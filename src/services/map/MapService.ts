import maplibregl from "maplibre-gl";
import { Entity, EntityType, Coordinates } from "../../types";
import { getMapStyle } from "../../utils/mapStyle";
import { isMapLibreImageDecodeError } from "../../utils/mapLibreErrorFilter";
import { MapLayerManager } from "./MapLayerManager";
import { MapEntityRenderer } from "./MapEntityRenderer";
import { MapDrawingService } from "./MapDrawingService";
import { MapMeasurementService } from "./MapMeasurementService";
import { MapStyleService } from "./MapStyleService";

export class MapService {
  private map: maplibregl.Map | null = null;
  private layerManager: MapLayerManager | null = null;
  private entityRenderer: MapEntityRenderer | null = null;
  private drawingService: MapDrawingService | null = null;
  private measurementService: MapMeasurementService | null = null;
  private styleService: MapStyleService | null = null;
  private jsonPathsCache: Array<{ id?: string; name?: string; points: Array<Coordinates & { alt?: number }> }> = [];

  public onEntityDrawn?: (entity: Omit<Entity, "id">) => void;
  public onEntityUpdated?: (id: string, coordinates: Coordinates[]) => void;
  public onEntityDeleted?: (id: string) => void;

  public getMap(): maplibregl.Map | null { return this.map; }
  public getCurrentMapType(): string { return this.styleService?.getCurrentMapType() || "vector-global"; }

  public initialize(
    container: string | HTMLElement,
    onEntityDrawn: (entity: Omit<Entity, "id">) => void,
    onEntityUpdated: (id: string, coordinates: Coordinates[]) => void,
    onEntityDeleted: (id: string) => void,
    initialMapType: string = "osm",
    initialCenter: { lng: number; lat: number } = { lng: 34.784, lat: 32.055 },
    initialZoom: number = 5
  ) {
    this.onEntityDrawn = onEntityDrawn;
    this.onEntityUpdated = onEntityUpdated;
    this.onEntityDeleted = onEntityDeleted;

    this.map = new maplibregl.Map({
      container,
      pitchWithRotate: false,
      maxPitch: 0,
      style: getMapStyle(initialMapType, "raster"),
      center: [initialCenter.lng, initialCenter.lat],
      zoom: initialZoom,
      interactive: true,
      touchZoomRotate: true,
      touchPitch: true,
      dragRotate: true,
      dragPan: true,
      scrollZoom: true,
      boxZoom: true,
      doubleClickZoom: false
    });

    const scaleControl = new maplibregl.ScaleControl({
      maxWidth: 150,
      unit: "metric"
    });
    this.map.addControl(scaleControl, "bottom-left");

    this.layerManager = new MapLayerManager(this.map);
    this.entityRenderer = new MapEntityRenderer(this.map);
    this.drawingService = new MapDrawingService(this.map, this.entityRenderer);
    this.measurementService = new MapMeasurementService(this.map, this.layerManager);
    this.styleService = new MapStyleService(this.map, this.drawingService, this.entityRenderer);
    this.styleService.setInitialMapType(initialMapType);
    this.styleService.onStyleChanged(() => {
      if (this.jsonPathsCache.length > 0) {
        this.applyJsonPaths();
      }
    });

    this.drawingService.initialize({
      onEntityDrawn,
      onEntityUpdated,
      onEntityDeleted
    });

    this.map.doubleClickZoom.disable();

    // Offline: swallow tile/image decode errors so missing tiles don't throw
    this.map.on("error", (e: { error?: Error }) => {
      if (e.error && isMapLibreImageDecodeError(e.error)) {
        try {
          (e as any).preventDefault?.();
        } catch { /* ignore */ }
      }
    });
  }

  public setDrawingCallbacks(
    onEntityDrawn: (entity: Omit<Entity, "id">) => void,
    onEntityUpdated: (id: string, coordinates: Coordinates[]) => void,
    onEntityDeleted: (id: string) => void
  ) {
    this.onEntityDrawn = onEntityDrawn;
    this.onEntityUpdated = onEntityUpdated;
    this.onEntityDeleted = onEntityDeleted;
    this.drawingService?.setCallbacks({
      onEntityDrawn,
      onEntityUpdated,
      onEntityDeleted
    });
  }

  public setDrawingUiListener(listener: (state: any) => void) {
    this.drawingService?.setUiListener(listener);
  }

  public onStyleChanged(callback: () => void) {
    this.styleService?.onStyleChanged(callback);
  }

  public changeMapStylePreservingEntities(newStyle: any) {
    this.styleService?.changeMapStylePreservingEntities(newStyle);
  }

  public registerFinishEdit(fn: () => void) {
    this.drawingService?.registerFinishEdit(fn);
  }

  public triggerFinishEdit() {
    this.drawingService?.triggerFinishEdit();
  }

  public clearAllEntitiesFromMap() {
    this.entityRenderer?.clearAllEntitiesFromMap();
  }

  public reloadAllEntities() {
    this.entityRenderer?.reloadAllEntities();
  }

  public setDrawingMode(mode: EntityType | null) {
    this.drawingService?.setDrawingMode(mode);
  }

  public removeCirclePreview() {
    this.drawingService?.removeCirclePreview();
  }

  public removeEllipsePreview() {
    this.drawingService?.removeEllipsePreview();
  }

  public removeSectorPreview() {
    this.drawingService?.removeSectorPreview();
  }

  public removePolygonPreview() {
    this.drawingService?.removePolygonPreview();
  }

  public removeLastDrawPreview() {
    this.drawingService?.removeLastDrawPreview();
  }

  public finishEdit() {
    this.drawingService?.finishEdit();
  }

  public setEditMode(entityId: string, entity?: any) {
    this.drawingService?.setEditMode(entityId, entity);
  }

  public renderMeasurement(points: Coordinates[]) {
    this.measurementService?.renderMeasurement(points);
  }

  public renderMeasurementPreview(start: Coordinates, current: Coordinates) {
    this.measurementService?.renderMeasurementPreview(start, current);
  }

  public clearMeasurementPreview() {
    this.measurementService?.clearMeasurementPreview();
  }

  public clearMeasurement() {
    this.measurementService?.clearMeasurement();
  }

  public renderJsonPaths(
    paths: Array<{ id?: string; name?: string; points: Array<Coordinates & { alt?: number }> }>
  ) {
    if (!this.map || !this.layerManager) return;
    this.jsonPathsCache = paths;
    if (!this.map.isStyleLoaded?.()) {
      this.map.once("load", () => this.applyJsonPaths());
      this.map.once("styledata", () => this.applyJsonPaths());
      return;
    }
    this.applyJsonPaths();
  }

  private applyJsonPaths() {
    const map = this.map;
    if (!map || !this.layerManager) return;
    if (!map.isStyleLoaded?.()) return;
    const paths = this.jsonPathsCache || [];
    this.clearJsonPaths();
    if (paths.length === 0) return;

    const allPoints: Array<{ lng: number; lat: number }> = [];

    paths.forEach((path, idx) => {
      const safeId = String(path.id || `path-${idx + 1}`).replace(/[^a-zA-Z0-9_-]/g, "-");
      const pathId = safeId || `path-${idx + 1}`;
      const lineSourceId = `json-path-${pathId}`;
      const lineLayerId = `json-path-line-${pathId}`;
      const pointSourceId = `json-path-points-${pathId}`;
      const pointLayerId = `json-path-point-${pathId}`;
      const labelLayerId = `json-path-label-${pathId}`;

      if (!path.points || path.points.length < 2) return;
      path.points.forEach((pt) => {
        if (Number.isFinite(pt.lng) && Number.isFinite(pt.lat)) {
          allPoints.push({ lng: pt.lng, lat: pt.lat });
        }
      });

      const lineData = {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: path.points.map(pt => [pt.lng, pt.lat])
        },
        properties: {
          name: path.name || pathId
        }
      };
      const existingLineSource = map.getSource(lineSourceId) as maplibregl.GeoJSONSource | undefined;
      if (existingLineSource) {
        existingLineSource.setData(lineData as any);
      } else {
        map.addSource(lineSourceId, { type: "geojson", data: lineData as any });
      }
      if (!map.getLayer(lineLayerId)) {
        map.addLayer({
          id: lineLayerId,
          type: "line",
          source: lineSourceId,
          paint: {
            "line-color": "#22c55e",
            "line-width": 4
          },
          layout: {
            "line-cap": "round",
            "line-join": "round"
          }
        });
      }

      const pointsData = {
        type: "FeatureCollection",
        features: path.points.map((pt, index) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [pt.lng, pt.lat]
          },
          properties: {
            index,
            alt: typeof pt.alt === "number" ? pt.alt : undefined
          }
        }))
      };
      const existingPointSource = map.getSource(pointSourceId) as maplibregl.GeoJSONSource | undefined;
      if (existingPointSource) {
        existingPointSource.setData(pointsData as any);
      } else {
        map.addSource(pointSourceId, { type: "geojson", data: pointsData as any });
      }
      if (!map.getLayer(pointLayerId)) {
        map.addLayer({
          id: pointLayerId,
          type: "circle",
          source: pointSourceId,
          paint: {
            "circle-radius": 4,
            "circle-color": "#22c55e",
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 1
          }
        });
      }
      if (!map.getLayer(labelLayerId)) {
        map.addLayer({
          id: labelLayerId,
          type: "symbol",
          source: pointSourceId,
          layout: {
            "text-field": ["case", ["has", "alt"], ["concat", ["to-string", ["get", "alt"]], " m"], ""],
            "text-font": ["Open Sans Semibold"],
            "text-size": 12,
            "text-offset": [0, 1.2],
            "text-anchor": "top",
            "text-allow-overlap": true,
            "text-ignore-placement": true
          },
          paint: {
            "text-color": "#ffffff",
            "text-halo-color": "#000000",
            "text-halo-width": 1
          }
        });
      }
    });

    if (allPoints.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      allPoints.forEach((p) => bounds.extend([p.lng, p.lat]));
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 60, duration: 800, maxZoom: 14 });
      }
    }
  }

  public clearJsonPaths() {
    const map = this.map;
    if (!map || !this.layerManager) return;
    const style = map.getStyle();
    const layers = style?.layers ? style.layers.map((l) => l.id) : [];
    layers.forEach((layerId) => {
      if (
        layerId.startsWith("json-path-line-") ||
        layerId.startsWith("json-path-point-") ||
        layerId.startsWith("json-path-label-")
      ) {
        this.layerManager?.removeLayerAndSource(layerId);
      }
    });
    const sources = style?.sources ? Object.keys(style.sources) : [];
    sources.forEach((sourceId) => {
      if (sourceId.startsWith("json-path-") || sourceId.startsWith("json-path-points-")) {
        this.layerManager?.removeLayerAndSource(sourceId);
      }
    });
  }

  public renderAreaMeasurement(points: Coordinates[]) {
    this.measurementService?.renderAreaMeasurement(points);
  }

  public renderAreaMeasurementPreview(points: Coordinates[], current: Coordinates) {
    this.measurementService?.renderAreaMeasurementPreview(points, current);
  }

  public clearAreaMeasurementPreview() {
    this.measurementService?.clearAreaMeasurementPreview();
  }

  public clearAreaMeasurement() {
    this.measurementService?.clearAreaMeasurement();
  }

  public setRotation(rotation: number) {
    this.styleService?.setRotation(rotation);
  }

  public setBrightness(brightness: number) {
    this.styleService?.setBrightness(brightness);
  }

  public setMapType(mapType: string) {
    this.styleService?.setMapType(mapType);
  }

  public addEntityToMap(entity: any) {
    if (this.entityRenderer) {
      this.entityRenderer.addEntityToMap(entity);
    } else {
      console.error("❌ EntityRenderer not initialized");
    }
  }

  public updateEntityToMap(entity: any) {
    if (this.entityRenderer) {
      this.entityRenderer.updateEntityToMap(entity);
    } else {
      console.error("❌ EntityRenderer not initialized");
    }
  }

  public removeEntityFromMap(entityId: string) {
    if (this.entityRenderer) {
      this.entityRenderer.removeEntityFromMap(entityId);
    } else {
      console.error("❌ EntityRenderer not initialized");
    }
  }

  public focusOnEntity(entity: Entity) {
    if (this.entityRenderer) {
      this.entityRenderer.focusOnEntity(entity);
    } else {
      console.error("❌ EntityRenderer not initialized");
    }
  }

  public updateEntityColors() {
    if (this.layerManager) {
      this.layerManager.updateEntityColors();
    } else {
      console.error("❌ LayerManager not initialized");
    }
  }

  public destroy() {
    this.drawingService?.destroy();
    this.drawingService = null;
    this.measurementService = null;
    this.styleService = null;
    this.layerManager = null;
    this.entityRenderer = null;
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}
