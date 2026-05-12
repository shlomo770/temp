import { Entity } from "../../types";
import { store } from "../../store/store";
import { MapEntityManager } from "./MapEntityManager";
import { selectDisplayedEntitiesOnMap } from "../../store/selectors/entitiesSelectors";

export class MapEntityRenderer {
  private map: maplibregl.Map;
  private entityManager: MapEntityManager;

  constructor(map: maplibregl.Map) {
    this.map = map;
    this.entityManager = new MapEntityManager(map);
  }

  public addEntityToMap(entity: any) {
    this.entityManager.addEntityToMap(entity);
  }

  public updateEntityToMap(entity: any) {
    this.entityManager.updateEntityOnMap(entity);
  }

  public removeEntityFromMap(entityId: string) {
    this.entityManager.removeEntityFromMap(entityId);
  }

  public focusOnEntity(entity: Entity) {
    this.entityManager.focusOnEntity(entity);
  }

  public getCachedEntity(entityId: string): any {
    return this.entityManager.getCachedEntity(entityId);
  }

  public clearAllEntitiesFromMap() {
    if (!this.map) return;
    const map = this.map;

    map.getStyle().layers?.forEach((layer) => {
      if (layer.id.startsWith("entity-")) {
        if (map.getLayer(layer.id)) map.removeLayer(layer.id);
      }
    });

    Object.keys(map.getStyle().sources).forEach((srcId) => {
      if (srcId.startsWith("entity-")) {
        if (map.getSource(srcId)) map.removeSource(srcId);
      }
    });
  }

  public reloadAllEntities() {
    if (!this.map) return;
    this.clearAllEntitiesFromMap();
    const entitiesForMap = selectDisplayedEntitiesOnMap(store.getState());
    Object.values(entitiesForMap).forEach((e) => {
      if (e) this.addEntityToMap(e);
    });
  }
}
