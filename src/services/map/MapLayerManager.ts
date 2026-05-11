import { store } from '../../store/store';

export class MapLayerManager {
  private map: maplibregl.Map;

  constructor(map: maplibregl.Map) {
    this.map = map;
  }

  public removeLayerAndSource(layerId: string, sourceId?: string): void {
    if (!this.map) return;
    const resolvedSourceId = sourceId || layerId;
    if (this.map.getLayer(layerId)) {
      this.map.removeLayer(layerId);
    }
    if (this.map.getSource(resolvedSourceId)) {
      this.map.removeSource(resolvedSourceId);
    }
  }

  public toggleLayerVisibility(layerId: string, visible: boolean): void {
    if (!this.map || !this.map.isStyleLoaded()) return;
    try {
      if (this.map.getLayer(layerId)) {
        this.map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
      }
    } catch (error) {
      console.error('Error toggling layer visibility:', error);
    }
  }

  public toggleLayerGroup(category: string, visible: boolean): void {
    if (!this.map || !this.map.isStyleLoaded()) return;
    try {
      const layers = this.map.getStyle().layers || [];
      const categoryLayers = layers.filter(layer =>
        layer.id.startsWith(`${category}-`) ||
        layer.id === category ||
        layer.id.includes(category)
      );

      categoryLayers.forEach(layer => {
        if (this.map && this.map.getLayer(layer.id)) {
          this.map.setLayoutProperty(layer.id, 'visibility', visible ? 'visible' : 'none');
        }
      });
    } catch (error) {
      console.error('Error toggling layer group:', error);
    }
  }

  public toggleEntityLayers(entityType: string, visible: boolean): void {
    if (!this.map) {
      console.warn('Map not available for entity layer toggle');
      return;
    }

    const style = this.map.getStyle();
    if (!style || !style.layers) {
      console.warn('Map style not loaded yet, skipping entity layer toggle');
      return;
    }

    try {
      const layers = style.layers || [];
      const visibility = visible ? 'visible' : 'none';

      if (entityType === 'los') {
        const losLayers = layers.filter(layer =>
          layer.id.includes('los') || layer.id.startsWith('ray-')
        );

        losLayers.forEach(layer => {
          if (this.map && this.map.getLayer(layer.id)) {
            this.map.setLayoutProperty(layer.id, 'visibility', visibility);
          }
        });

        return;
      }

      const entityLayers = layers.filter(layer => {
        if (!layer.id.startsWith('entity-layer-')) return false;
        const entityId = layer.id.replace('entity-layer-', '');
        const state = store.getState();
        const entity = state.entities.byId[entityId];
        if (!entity) return false;
        return entity.type.toLowerCase() === entityType.toLowerCase();
      });

      entityLayers.forEach(layer => {
        if (this.map && this.map.getLayer(layer.id)) {
          this.map.setLayoutProperty(layer.id, 'visibility', visibility);
        }
      });
    } catch (error) {
      console.error('Error toggling entity layers:', error);
    }
  }

  public toggleTargetLayers(targetType: string, visible: boolean): void {
    if (!this.map) {
      console.warn('Map not available for target layer toggle');
      return;
    }

    const style = this.map.getStyle();
    if (!style || !style.layers) {
      console.warn('Map style not loaded yet, skipping target layer toggle');
      return;
    }

    try {
      const layers = style.layers || [];
      const visibility = visible ? 'visible' : 'none';

      if (targetType === 'all') {
        const targetLayers = layers.filter(layer =>
          layer.id.startsWith('targets-') ||
          layer.id.includes('target')
        );

        targetLayers.forEach(layer => {
          if (this.map && this.map.getLayer(layer.id)) {
            this.map.setLayoutProperty(layer.id, 'visibility', visibility);
          }
        });

      } else {
        const targetLayers = layers.filter(layer => {
          if (!layer.id.startsWith('targets-')) return false;

          const layerId = layer.id.toLowerCase();
          if (targetType === 'friendly' && layerId.includes('friendly')) return true;
          if (targetType === 'hostile' && layerId.includes('hostile')) return true;
          if (targetType === 'unknown' && layerId.includes('unknown')) return true;

          return false;
        });

        targetLayers.forEach(layer => {
          if (this.map && this.map.getLayer(layer.id)) {
            this.map.setLayoutProperty(layer.id, 'visibility', visibility);
          }
        });
      }

    } catch (error) {
      console.error('Error toggling target layers:', error);
    }
  }

  public applyCategoryFilters(categoryFilters: { [key: string]: boolean }): void {
    if (!this.map || !this.map.isStyleLoaded()) return;

    try {
      const state = store.getState();
      const entities = state.entities.byId;

      Object.entries(entities).forEach(([entityId, entity]) => {
        const layerId = `entity-layer-${entityId}`;
        const category = entity.category || 'Other';
        const visible = categoryFilters[category] !== false; 

        this.toggleLayerVisibility(layerId, visible);
      });
    } catch (error) {
      console.error('Error applying category filters:', error);
    }
  }

  public getLayerVisibility(layerId: string): boolean {
    if (!this.map || !this.map.isStyleLoaded()) return false;

    try {
      const layer = this.map.getLayer(layerId);
      if (!layer) return false;

      const visibility = (layer.layout as any)?.[' visibility'];
      return visibility !== 'none';
    } catch (error) {
      console.error('Error getting layer visibility:', error);
      return false;
    }
  }

  public updateEntityColors(): void {
    if (!this.map || !this.map.isStyleLoaded()) return;

    try {
      const state = store.getState();
      const entities = state.entities.byId;

      Object.entries(entities).forEach(([entityId, entity]) => {
        const layerId = `entity-layer-${entityId}`;
        const layer = this.map.getLayer(layerId);

        if (layer) {
          const color = (entity as any).color || '#3b82f6';
          const transparency = (entity as any).transparency !== undefined
            ? (entity as any).transparency / 100
            : 0.3;

          if (entity.type === 'line') {
            this.map.setPaintProperty(layerId, 'line-color', color);
            this.map.setPaintProperty(layerId, 'line-opacity', 1 - transparency);
          } else if (entity.type === 'polygon' || entity.type === 'circle' || entity.type === 'rectangle') {
            this.map.setPaintProperty(layerId, 'fill-color', color);
            this.map.setPaintProperty(layerId, 'fill-opacity', transparency);
          } else if (entity.type === 'marker') {
            this.map.setPaintProperty(layerId, 'circle-color', color);
            this.map.setPaintProperty(layerId, 'circle-opacity', 1 - transparency);
          }
        }
      });
    } catch (error) {
      console.error('Error updating entity colors:', error);
    }
  }
}
