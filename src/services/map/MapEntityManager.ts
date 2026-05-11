import type * as maplibregl from 'maplibre-gl';
import { Entity, EntityType } from '../../types';
import { createCirclePolygon, createEllipsePolygon, createSectorPolygon, calculateCenter } from '../../utils/geometry';
import { closePolygonCoordinates } from '../entities/EntityGeometryService';
import { createMarkerIconImageData, getMarkerIconImageId } from '../../constants/markerIcons';
import { EntityFormCategory } from '../../enums/entityCategory.enum';

export class MapEntityManager {
  private map: maplibregl.Map;
  private entityCache: Map<string, any> = new Map();
  private styleWaiter: boolean = false;
  private addedIconImages = new Set<string>();
  private pendingAddTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private pendingRemoveTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private addRetryCounts = new Map<string, number>();
  private removeRetryCounts = new Map<string, number>();
  private readonly MAX_RETRIES = 50;

  constructor(map: maplibregl.Map) {
    this.map = map;
  }

  private logPolygonDiagnostics(entity: any, geojson: any, phase: string): void {
    if (entity?.type !== "polygon") return;
    try {
      const ring = geojson?.geometry?.type === "Polygon" ? geojson?.geometry?.coordinates?.[0] : null;
      if (!Array.isArray(ring) || ring.length === 0) {
        console.warn(`[PolygonDebug:${phase}] no ring`, { id: entity?.id, geometry: geojson?.geometry });
        return;
      }
      const first = ring[0];
      const last = ring[ring.length - 1];
      const isClosed = Array.isArray(first) && Array.isArray(last) && first[0] === last[0] && first[1] === last[1];
      const invalidPoints = ring.filter((p: any) => !Array.isArray(p) || p.length < 2 || !Number.isFinite(Number(p[0])) || !Number.isFinite(Number(p[1]))).length;
      console.log(`[PolygonDebug:${phase}]`, {
        id: entity?.id,
        ringPoints: ring.length,
        closed: isClosed,
        invalidPoints,
        first,
        last,
      });
    } catch (e) {
      console.warn(`[PolygonDebug:${phase}] diagnostics failed`, e);
    }
  }

  private entityLocks = new Set<string>();

  private ensureMarkerIconImage(map: maplibregl.Map, code: string): void {
    const id = getMarkerIconImageId(code);
    if (map.hasImage(id)) return;
    try {
      const img = createMarkerIconImageData(code);
      map.addImage(id, { width: img.width, height: img.height, data: img.data }, { pixelRatio: 2 });
      this.addedIconImages.add(id);
    } catch (_) {}
  }

  public addEntityToMap(entity: any): void {
    if (!this.map || !entity?.id) return;

    const map = this.map;
    const entityId = String(entity.id);
    const sourceId = `entity-${entity.id}`;
    const layerId = `entity-layer-${entity.id}`;

    const pendingTimer = this.pendingAddTimers.get(entityId);
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      this.pendingAddTimers.delete(entityId);
    }
    const retryCount = this.addRetryCounts.get(entityId) ?? 0;

    if (this.entityLocks.has(entity.id)) return;
    this.entityLocks.add(entity.id);
    if (!map.isStyleLoaded()) {
      if (retryCount >= this.MAX_RETRIES) {
        this.entityLocks.delete(entity.id);
        this.addRetryCounts.delete(entityId);
        return;
      }

      if (this.styleWaiter !== entity.id) {
        this.styleWaiter = entity.id;

        

        const timer = setTimeout(() => {
          this.pendingAddTimers.delete(entityId);
          this.styleWaiter = false;
          this.entityLocks.delete(entity.id);
          this.addRetryCounts.set(entityId, retryCount + 1);
          this.addEntityToMap(entity);
        }, 50);
        this.pendingAddTimers.set(entityId, timer);
      }

      return;
    }

    if (!entity.geometry && (!entity.coordinates || !Array.isArray(entity.coordinates))) {
      console.error("❌ Invalid entity (missing geometry/coords):", entity);
      this.entityLocks.delete(entity.id);
      this.addRetryCounts.delete(entityId);
      return;
    }

    let geojson: any;
    if (entity.geometry) {
      geojson = {
        type: "Feature",
        geometry: entity.geometry,
        properties: {
          id: entity.id,
          type: entity.type,
          name: entity.name,
          category: entity.category,
          color: entity.color,
          transparency: entity.transparency
        }
      };
    } else {
      geojson = this.convertEntityToGeoJSON(entity);
    }

    const existingSource = map.getSource(sourceId) as maplibregl.GeoJSONSource;

    if (!existingSource) {
      try {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);

        const isIconMarker = entity.type === 'marker' && entity.properties?.iconChar;
        if (isIconMarker && entity.coordinates?.[0]) {
          const coord = entity.coordinates[0];
          const code = entity.properties.iconChar;
          const lngLat: [number, number] = [coord.lng, coord.lat];
          const iconLayerId = `entity-icon-layer-${entity.id}`;
          this.ensureMarkerIconImage(map, code);
          map.addSource(sourceId, {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: { type: "Point", coordinates: lngLat },
              properties: { iconImage: getMarkerIconImageId(code) },
            },
          });
          map.addLayer({
            id: iconLayerId,
            type: "symbol",
            source: sourceId,
            layout: {
              "icon-image": ["get", "iconImage"],
              "icon-size": 1.8,
              "icon-anchor": "center",
              "icon-allow-overlap": true,
            },
          });
        } else {
          this.logPolygonDiagnostics(entity, geojson, "addSource");
          map.addSource(sourceId, {
            type: "geojson",
            data: geojson
          });

          map.addLayer({
            id: layerId,
            type: this.getLayerType(entity.type) as any,
            source: sourceId,
            paint: this.getPaintProperties(entity)
          });

          this.addEntityLabelLayer(map, entity, layerId);
        }

        map.triggerRepaint();
        this.entityCache.set(entity.id, { ...entity });

      } catch (err) {
        console.error("❌ Error creating entity:", err);
      }

      this.entityLocks.delete(entity.id);
      this.addRetryCounts.delete(entityId);
      return;
    }

    try {
      this.logPolygonDiagnostics(entity, geojson, "setData-existingSource");
      existingSource.setData(geojson);

      const isIconMarker = entity.type === 'marker' && entity.properties?.iconChar;
      if (isIconMarker && entity.coordinates?.[0]) {
        const code = entity.properties.iconChar;
        this.ensureMarkerIconImage(map, code);
        (existingSource as any).setData({
          type: "Feature",
          geometry: { type: "Point", coordinates: [entity.coordinates[0].lng, entity.coordinates[0].lat] },
          properties: { iconImage: getMarkerIconImageId(code) },
        });
      } else {
        const paint = this.getPaintProperties(entity);
        for (const [key, val] of Object.entries(paint)) {
          try {
            map.setPaintProperty(layerId, key, val);
          } catch (_) { }
        }
        this.addEntityLabelLayer(map, entity, layerId);
      }

      map.triggerRepaint();
      this.entityCache.set(entity.id, { ...entity });

    } catch (err) {
      console.error("⚠ Update failed, recreating:", err);

      try {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
        const iconLayerId = `entity-icon-layer-${entity.id}`;
        if (map.getLayer(iconLayerId)) map.removeLayer(iconLayerId);

        const isIconMarker = entity.type === 'marker' && entity.properties?.iconChar;
        if (isIconMarker && entity.coordinates?.[0]) {
          const coord = entity.coordinates[0];
          const code = entity.properties.iconChar;
          const lngLat: [number, number] = [coord.lng, coord.lat];
          this.ensureMarkerIconImage(map, code);
          map.addSource(sourceId, {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: { type: "Point", coordinates: lngLat },
              properties: { iconImage: getMarkerIconImageId(code) },
            },
          });
          map.addLayer({
            id: iconLayerId,
            type: "symbol",
            source: sourceId,
            layout: {
              "icon-image": ["get", "iconImage"],
              "icon-size": 1.8,
              "icon-anchor": "center",
              "icon-allow-overlap": true,
            },
          });
        } else {
          this.logPolygonDiagnostics(entity, geojson, "setData-recreateSource");
          map.addSource(sourceId, { type: "geojson", data: geojson });
          map.addLayer({
            id: layerId,
            type: this.getLayerType(entity.type) as any,
            source: sourceId,
            paint: this.getPaintProperties(entity)
          });
          this.addEntityLabelLayer(map, entity, layerId);
        }
      } catch (inner) {
        console.error("❌ Recreate failed:", inner);
      }
    }

    requestAnimationFrame(() => {
      this.entityLocks.delete(entity.id);
      this.addRetryCounts.delete(entityId);
    });
  }

  public removeEntityFromMap(entityId: string): void {
    const pendingRemove = this.pendingRemoveTimers.get(entityId);
    if (pendingRemove) {
      clearTimeout(pendingRemove);
      this.pendingRemoveTimers.delete(entityId);
    }
    const pendingTimer = this.pendingAddTimers.get(entityId);
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      this.pendingAddTimers.delete(entityId);
    }
    const removeRetryCount = this.removeRetryCounts.get(entityId) ?? 0;

    if (!this.map || !this.map.isStyleLoaded()) {
      if (removeRetryCount >= this.MAX_RETRIES) {
        this.pendingRemoveTimers.delete(entityId);
        this.removeRetryCounts.delete(entityId);
        return;
      }
      const retryTimer = setTimeout(() => {
        this.pendingRemoveTimers.delete(entityId);
        this.removeRetryCounts.set(entityId, removeRetryCount + 1);
        this.removeEntityFromMap(entityId);
      }, 80);
      this.pendingRemoveTimers.set(entityId, retryTimer);
      return;
    }

    const sourceId = `entity-${entityId}`;
    const layerId = `entity-layer-${entityId}`;

    try {
      const iconLayerId = `entity-icon-layer-${entityId}`;
      if (this.map.getLayer(iconLayerId)) {
        this.map.removeLayer(iconLayerId);
      }
      if (this.map.getLayer(`entity-label-layer-${entityId}`)) {
        this.map.removeLayer(`entity-label-layer-${entityId}`);
      }
      if (this.map.getSource(`entity-label-${entityId}`)) {
        this.map.removeSource(`entity-label-${entityId}`);
      }
      if (this.map.getLayer(layerId)) {
        this.map.removeLayer(layerId);
        console.log('✅ Removed layer:', layerId);
      }

      // Check if source exists before removing
      if (this.map.getSource(sourceId)) {
        this.map.removeSource(sourceId);
        console.log('✅ Removed source:', sourceId);
      }

      // Remove from cache
      this.entityCache.delete(entityId);
      this.removeRetryCounts.delete(entityId);
      this.addRetryCounts.delete(entityId);

    } catch (error) {
      console.error('❌ Error removing entity from map:', error, entityId);
    }
  }

  public updateEntityOnMap(entity: any): void {
    // // Simple approach: remove and re-add
    // this.removeEntityFromMap(entity.id);
    // this.addEntityToMap(entity);
    if (!entity || !entity.id) {
      console.warn('⚠️ Invalid entity in updateEntityOnMap:', entity);
      return;
    }

    const map = this.map!;
    const sourceId = `entity-${entity.id}`;
    const layerId = `entity-layer-${entity.id}`;

    const source = map.getSource(sourceId) as maplibregl.GeoJSONSource;
    if (!source) {
      console.warn('⚠️ UPDATE: source does not exist:', sourceId);
      return;
    }

    let geojson: any;
    if (entity.type !== 'sector') {
      if (entity.geometry) {
        geojson = {
          type: 'Feature',
          geometry: entity.geometry,
          properties: {
            ...(entity.properties || {}),
            id: entity.id,
            type: entity.type,
            name: entity.name,
            category: entity.category,
            color: entity.color,
            transparency: entity.transparency,
          },
        };
      } else if (entity.coordinates) {
        geojson = this.convertEntityToGeoJSON(entity);
      } else {
        console.error('❌ Entity has no geometry or coordinates in updateEntityOnMap:', entity);
        return;
      }

      try {
        this.logPolygonDiagnostics(entity, geojson, "updateEntityOnMap-setData");
        source.setData(geojson);
      } catch (err) {
        console.error('❌ Failed to setData on source in updateEntityOnMap:', err);
      }
    }
    switch (entity.type) {
      case 'marker':
      case 'target': {
        if (entity.properties?.iconChar && entity.coordinates?.[0] && this.map.getSource(sourceId)) {
          const code = entity.properties.iconChar;
          this.ensureMarkerIconImage(map, code);
          (source as any).setData({
            type: "Feature",
            geometry: { type: "Point", coordinates: [entity.coordinates[0].lng, entity.coordinates[0].lat] },
            properties: { iconImage: getMarkerIconImageId(code) },
          });
        } else if (map.getLayer(layerId)) {
          if (entity.color !== undefined) {
            map.setPaintProperty(layerId, 'circle-color', entity.color);
          }
          if (entity.transparency !== undefined) {
            map.setPaintProperty(layerId, 'circle-opacity', entity.transparency);
          }
          if (entity.style?.strokeColor !== undefined) {
            map.setPaintProperty(layerId, 'circle-stroke-color', entity.style.strokeColor);
          }
          if (entity.style?.strokeWidth !== undefined) {
            map.setPaintProperty(layerId, 'circle-stroke-width', entity.style.strokeWidth);
          }
        }
        break;
      }

      case 'line': {
        if (entity.color !== undefined) {
          map.setPaintProperty(layerId, 'line-color', entity.color);
        }
        if (entity.width !== undefined) {
          map.setPaintProperty(layerId, 'line-width', entity.width);
        } else if (entity.style?.strokeWidth !== undefined) {
          map.setPaintProperty(layerId, 'line-width', entity.style.strokeWidth);
        }
        if (entity.transparency !== undefined) {
          map.setPaintProperty(layerId, 'line-opacity', entity.transparency);
        }
        const labelSourceId = `entity-label-${entity.id}`;
        const labelSource = map.getSource(labelSourceId) as maplibregl.GeoJSONSource | undefined;
        if (labelSource) {
          const center = this.getEntityCenter(entity);
          if (center) {
            (labelSource as any).setData({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: center },
              properties: { label: this.getEntityLabelForMap(entity) }
            });
          }
        } else {
          this.addEntityLabelLayer(map, entity, layerId);
        }
        break;
      }

      case 'polygon':
      case 'rectangle':
      case 'circle':
      case 'ellipse':
      case 'sector':
        {
          if (entity.color !== undefined) {
            map.setPaintProperty(layerId, 'fill-color', entity.color);
          }
          if (entity.transparency !== undefined) {
            map.setPaintProperty(layerId, 'fill-opacity', entity.transparency);
          }
          if (entity.style?.strokeColor !== undefined) {
            map.setPaintProperty(layerId, 'fill-outline-color', entity.style.strokeColor);
          }
          const labelSourceId = `entity-label-${entity.id}`;
          const labelSource = map.getSource(labelSourceId) as maplibregl.GeoJSONSource | undefined;
          if (labelSource) {
            const center = this.getEntityCenter(entity);
            if (center) {
              (labelSource as any).setData({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: center },
                properties: { label: this.getEntityLabelForMap(entity) }
              });
            }
          } else {
            this.addEntityLabelLayer(map, entity, layerId);
          }
          break;
        }

      default: {
        console.warn('⚠️ updateEntityOnMap: Unknown entity type:', entity.type);
        break;
      }
    }
    map.triggerRepaint();
  }

  public focusOnEntity(entity: Entity): void {
    if (!this.map) {
      console.warn('⚠️ Map is not initialized, cannot focus on entity:', entity.id);
      return;
    }

    // Validate entity has coordinates
    if (!entity.coordinates || !Array.isArray(entity.coordinates) || entity.coordinates.length === 0) {
      console.error('❌ Invalid entity coordinates in focusOnEntity:', entity);
      return;
    }

    let lngSum = 0;
    let latSum = 0;

    for (let i = 0; i < entity.coordinates.length; i++) {
      const coord = entity.coordinates[i];
      if (coord && typeof coord.lng === 'number' && typeof coord.lat === 'number') {
        lngSum += coord.lng;
        latSum += coord.lat;
      } else {
        console.error('❌ Invalid coordinate at index', i, ':', coord);
        return;
      }
    }

    const coordinateCount = entity.coordinates.length;
    const centerLng = lngSum / coordinateCount;
    const centerLat = latSum / coordinateCount;

    this.map.flyTo({
      center: [centerLng, centerLat],
      zoom: 14,
      duration: 1000
    });
  }

  public getCachedEntity(entityId: string): any {
    return this.entityCache.get(entityId);
  }

  private convertEntityToGeoJSON(entity: Entity): any {
    console.log('🔧 Converting entity to GeoJSON:', entity);

    // Validate entity has required properties
    if (!entity.coordinates || !Array.isArray(entity.coordinates) || entity.coordinates.length === 0) {
      console.error('❌ Invalid entity coordinates:', entity);
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [0, 0] },
        properties: { category: 'Other', error: 'Invalid coordinates' }
      };
    }

    switch (entity.type) {
      case 'marker':
      case 'target':
        return this.createMarkerGeoJSON(entity);
      case 'line':
        return this.createLineGeoJSON(entity);
      case 'circle':
        return this.createCircleGeoJSON(entity);
      case 'ellipse':
        return this.createEllipseGeoJSON(entity);
      case 'sector':
        return this.createSectorGeoJSON(entity);
      case 'polygon':
      case 'rectangle':
        return this.createPolygonGeoJSON(entity);
      default:
        console.warn('⚠️ Unknown entity type:', entity.type);
        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [0, 0] },
          properties: { category: 'Other', error: 'Unknown entity type' }
        };
    }
  }

  private createMarkerGeoJSON(entity: Entity): any {
    const firstCoord = entity.coordinates[0];
    if (!firstCoord || typeof firstCoord.lng !== 'number' || typeof firstCoord.lat !== 'number') {
      console.error('❌ Invalid marker coordinates:', entity.coordinates);
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [0, 0] },
        properties: { category: 'Other', error: 'Invalid marker coordinates' }
      };
    }

    return {
      type: 'Feature',
      id: entity.id,
      geometry: {
        type: 'Point',
        coordinates: [firstCoord.lng, firstCoord.lat]
      },
      properties: {
        ...(entity.properties || {}),
        id: entity.id,
        type: entity.type,
        category: entity.properties?.category || 'Other'
      }
    };
  }

  private createLineGeoJSON(entity: Entity): any {
    const validCoords = entity.coordinates.filter(coord =>
      coord && typeof coord.lng === 'number' && typeof coord.lat === 'number'
    );

    if (validCoords.length < 2) {
      console.error('❌ Invalid line coordinates (need at least 2 valid points):', entity.coordinates);
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [0, 0] },
        properties: { category: 'Other', error: 'Invalid line coordinates' }
      };
    }

    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: validCoords.map(coord => [coord.lng, coord.lat])
      },
      properties: {
        ...(entity.properties || {}),
        category: entity.properties?.category || 'Other'
      }
    };
  }

  private createCircleGeoJSON(entity: Entity): any {
    const validCoords = entity.coordinates.filter(coord =>
      coord && typeof coord.lng === 'number' && typeof coord.lat === 'number'
    );

    if (validCoords.length < 2) {
      console.error('❌ Invalid circle coordinates (need center and edge point):', entity.coordinates);
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [0, 0] },
        properties: { category: 'Other', error: 'Invalid circle coordinates' }
      };
    }

    const center = validCoords[0];
    const edge = validCoords[1];
    const circleCoords = createCirclePolygon(center, edge, 64);

    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [circleCoords.map(coord => [coord.lng, coord.lat])]
      },
      properties: {
        ...(entity.properties || {}),
        category: entity.properties?.category || 'Other'
      }
    };
  }

  private createEllipseGeoJSON(entity: Entity): any {
    const validCoords = entity.coordinates.filter(coord =>
      coord && typeof coord.lng === 'number' && typeof coord.lat === 'number'
    );

    if (validCoords.length < 2) {
      console.error('❌ Invalid ellipse coordinates (need center and edge point):', entity.coordinates);
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [0, 0] },
        properties: { category: 'Other', error: 'Invalid ellipse coordinates' }
      };
    }

    const center = validCoords[0];
    const edge = validCoords[1];
    const ellipseCoords = createEllipsePolygon(center, edge, 64);

    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [ellipseCoords.map(coord => [coord.lng, coord.lat])]
      },
      properties: {
        ...(entity.properties || {}),
        category: entity.properties?.category || 'Other'
      }
    };
  }

  private createSectorGeoJSON(entity: Entity): any {
    const validCoords = entity.coordinates.filter(coord =>
      coord && typeof coord.lng === 'number' && typeof coord.lat === 'number'
    );

    if (validCoords.length < 3) {
      console.error('❌ Invalid sector coordinates (need center and 2 angle points):', entity.coordinates);
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [0, 0] },
        properties: { category: 'Other', error: 'Invalid sector coordinates' }
      };
    }

    const center = validCoords[0];
    const startPoint = validCoords[1];
    const endPoint = validCoords[2];
    const sectorCoords = createSectorPolygon(center, startPoint, endPoint, 32);

    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [sectorCoords.map(coord => [coord.lng, coord.lat])]
      },
      properties: {
        ...(entity.properties || {}),
        category: entity.properties?.category || 'Other'
      }
    };
  }

  private createPolygonGeoJSON(entity: Entity): any {
    const validCoords = entity.coordinates.filter(coord =>
      coord && typeof coord.lng === 'number' && typeof coord.lat === 'number'
    );

    if (validCoords.length < 3) {
      console.error('❌ Invalid polygon coordinates (need at least 3 valid points):', entity.coordinates);
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [0, 0] },
        properties: { category: 'Other', error: 'Invalid polygon coordinates' }
      };
    }

    const closedCoords = closePolygonCoordinates(validCoords);
    const polygonCoords = closedCoords.map(coord => [coord.lng, coord.lat]);
    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [polygonCoords]
      },
      properties: {
        ...(entity.properties || {}),
        category: entity.properties?.category || 'Other'
      }
    };
  }

  /** Center of polygon/circle/ellipse/rectangle/sector/line for label placement. Returns [lng, lat] or null. */
  private getEntityCenter(entity: any): [number, number] | null {
    const fillTypes = ['polygon', 'rectangle', 'circle', 'ellipse', 'sector'];
    const lineType = entity?.type === 'line';
    if (!fillTypes.includes(entity?.type) && !lineType) return null;
    if (entity.type === 'circle' || entity.type === 'ellipse' || entity.type === 'sector') {
      if (entity.coordinates?.[0]) {
        const c = entity.coordinates[0];
        return [typeof c.lng === 'number' ? c.lng : c[0], typeof c.lat === 'number' ? c.lat : c[1]];
      }
      return null;
    }
    if (entity.type === 'line') {
      const coords = entity.coordinates?.length
        ? entity.coordinates.map((c: any) => ({ lng: c.lng ?? c[0], lat: c.lat ?? c[1] }))
        : entity.geometry?.type === 'LineString' && entity.geometry.coordinates?.length
          ? entity.geometry.coordinates.map((c: number[]) => ({ lng: c[0], lat: c[1] }))
          : [];
      if (coords.length === 0) return null;
      const center = calculateCenter(coords);
      return [center.lng, center.lat];
    }
    if (entity.geometry?.type === 'Polygon' && entity.geometry.coordinates?.[0]?.length) {
      const ring = entity.geometry.coordinates[0];
      const coords = ring.map((c: number[]) => ({ lng: c[0], lat: c[1] }));
      const center = calculateCenter(coords);
      return [center.lng, center.lat];
    }
    if (entity.coordinates?.length) {
      const center = calculateCenter(entity.coordinates);
      return [center.lng, center.lat];
    }
    return null;
  }

  /** טקסט לתווית על המפה: שם + סוג; אם סוג FREE – רק השם */
  private getEntityLabelForMap(entity: any): string {
    const category = (entity?.category ?? entity?.properties?.category) ?? '';
    const name = (entity?.name ?? entity?.properties?.name) ?? '';
    const type = entity?.type ?? 'entity';
    const typeLabel = String(type).toUpperCase().replace(/_/g, ' ');
    const catStr = String(category).trim();
    const nameStr = String(name).trim();

    if (catStr.toUpperCase() === EntityFormCategory.FREE) {
      return nameStr || typeLabel;
    }
    if (nameStr) {
      return `${nameStr} (${catStr || typeLabel})`;
    }
    return catStr ? catStr.toUpperCase() : typeLabel;
  }

  /** טקסט במרכז היישות – שכבת symbol (שם + סוג); תומך גם ב-line (polyline). */
  private addEntityLabelLayer(map: maplibregl.Map, entity: any, _fillLayerId: string): void {
    const labelTypes = ['polygon', 'rectangle', 'circle', 'ellipse', 'sector', 'line'];
    if (!labelTypes.includes(entity?.type)) {
      console.log('[EntityLabel] לא תווית – סוג לא נתמך:', entity?.id, entity?.type);
      return;
    }
    const center = this.getEntityCenter(entity);
    if (!center) {
      console.log('[EntityLabel] לא תווית – אין מרכז:', entity?.id, 'geometry:', !!entity?.geometry, 'coordinates:', entity?.coordinates?.length);
      return;
    }
    const label = this.getEntityLabelForMap(entity);
    console.log('[EntityLabel] מוסיף תווית:', entity.id, 'סוג:', entity.type, 'טקסט על מפה:', label, 'מרכז:', center);
    const labelSourceId = `entity-label-${entity.id}`;
    const labelLayerId = `entity-label-layer-${entity.id}`;
    try {
      if (map.getLayer(labelLayerId)) map.removeLayer(labelLayerId);
      if (map.getSource(labelSourceId)) map.removeSource(labelSourceId);
      const pointFeature = {
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: center },
        properties: { label }
      };
      map.addSource(labelSourceId, { type: 'geojson', data: pointFeature });
      map.addLayer({
        id: labelLayerId,
        type: 'symbol',
        source: labelSourceId,
        layout: {
          'text-field': ['get', 'label'],
          'text-size': 16,
          'text-anchor': 'center',
          'text-allow-overlap': true
        },
        paint: {
          'text-color': '#1a1a1a',
          'text-halo-color': '#ffffff',
          'text-halo-width': 3
        }
      });
      console.log('[EntityLabel] שכבת תווית נוצרה:', labelLayerId);
    } catch (e) {
      console.warn('[EntityLabel] שגיאה ביצירת תווית:', entity?.id, e);
    }
  }

  private getLayerType(entityType: EntityType): string {
    switch (entityType) {
      case 'marker':
      case 'target':
        return 'circle';
      case 'line':
        return 'line';
      case 'polygon':
      case 'rectangle':
      case 'circle':
      case 'ellipse':
      case 'sector':
        return 'fill';
      default:
        return 'circle';
    }
  }

  private getPaintProperties(entity: Entity) {
    const style = entity.style || {};

    try {
      const entityColor =
        (entity as any).color ||
        style.fillColor ||
        (entity.type === 'sector' &&
        ((entity as any).name === 'Taboozone' || (entity as any).name === 'Tabbozon')
          ? '#FFB300'
          : undefined) ||
        '#3b82f6';

      const entityTransparency =
        (entity as any).transparency ??
        style.fillOpacity ??
        0.3;

      if (entity.type === 'marker') {
        return {
          'circle-radius': 8,
          'circle-color': entityColor,
          'circle-stroke-color': style.strokeColor || '#1e40af',
          'circle-stroke-width': style.strokeWidth || 2,
          'circle-opacity': 1 - entityTransparency,
        };
      }

      if (entity.type === 'target') {
        return {
          'circle-radius': 40,
          'circle-color': '#ff0000',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 4,
        };
      }

      if (entity.type === 'line') {
        return {
          'line-color': entityColor,
          'line-width': style.strokeWidth || (entity as any).width || 2,
          'line-opacity': 1 - entityTransparency,
        };
      }

      if (
        entity.type === 'polygon' ||
        entity.type === 'rectangle' ||
        entity.type === 'circle' ||
        entity.type === 'ellipse' ||
        entity.type === 'sector'
      ) {
        return {
          'fill-color': entityColor,
          'fill-opacity': entityTransparency,
          'fill-outline-color': style.strokeColor || '#1e40af',
        };
      }

      return {};
    } catch (error) {
      console.error('❌ Error in getPaintProperties:', error, entity);
      return {
        'fill-color': '#3b82f6',
        'fill-opacity': 0.3,
        'fill-outline-color': '#1e40af',
      };
    }
  }
}