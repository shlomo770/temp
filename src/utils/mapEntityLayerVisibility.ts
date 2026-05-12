export type MinimalMap = {
    getLayer: (id: string) => unknown;
    setLayoutProperty: (id: string, name: string, value: unknown) => void;
  };
  
  const ENTITY_LAYER_IDS = (entityId: string) =>
    [
      `entity-layer-${entityId}`,
      `entity-icon-layer-${entityId}`,
      `entity-label-layer-${entityId}`,
    ] as const;
  
  export function setEntityVisibilityOnMap(
    map: MinimalMap | null | undefined,
    entityId: string,
    visible: boolean
  ): void {
    if (!map) return;
    const vis = visible ? "visible" : "none";
    for (const layerId of ENTITY_LAYER_IDS(entityId)) {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, "visibility", vis);
      }
    }
  }