import { useCallback, useLayoutEffect, useRef } from "react";
import { useAppDispatch } from "../../../hooks/useAppDispatch";
import { updateEntity } from "../../../store/slices/entitiesSlice";
import { Coordinates } from "../../../types";
import { Entity as StoreEntity } from "../../../store/slices/entitiesSlice";
import { MapService } from "../../../services/map/MapService";
import { buildGeometryForUpdate } from "../../../services/entities/EntityGeometryService";
import { WsMessageName } from "../../../enums/ws.enum";
import { WebSocketService } from "../../../services/webSocket/WebSocketService";
import { buildUpdateEntityPayload, toEntityCategoryEnum } from '../../../services/webSocket/saveEntityMessage';



type UseMapEntitiesParams = {
  mapServiceRef: React.MutableRefObject<MapService | null>;
  entitiesById: Record<string, StoreEntity>;
};

export const useMapEntities = ({ mapServiceRef, entitiesById }: UseMapEntitiesParams) => {
  const dispatch = useAppDispatch();
  const prevEntityIds = useRef<Set<string>>(new Set());
  const prevEntitiesById = useRef<Record<string, StoreEntity>>({});

  useLayoutEffect(() => {
    if (!mapServiceRef.current) return;
    const map = (mapServiceRef.current as any).map;
    if (!map) return;

    const updateEntities = () => {
      const currentIds = new Set(Object.keys(entitiesById));
      const removedIds = Array.from(prevEntityIds.current).filter(id => !currentIds.has(id));
      removedIds.forEach(id => {
        mapServiceRef.current?.removeEntityFromMap(id);
      });
      // Safety cleanup: remove orphan map layers/sources that are no longer in Redux.
      const styleLayers = map.getStyle()?.layers ?? [];
      for (const layer of styleLayers) {
        const layerId = layer.id;
        const iconPrefix = "entity-icon-layer-";
        const fillPrefix = "entity-layer-";
        const labelPrefix = "entity-label-layer-";
        let entityId: string | null = null;
        if (layerId.startsWith(iconPrefix)) entityId = layerId.slice(iconPrefix.length);
        else if (layerId.startsWith(fillPrefix)) entityId = layerId.slice(fillPrefix.length);
        else if (layerId.startsWith(labelPrefix)) entityId = layerId.slice(labelPrefix.length);
        if (entityId && !currentIds.has(entityId)) {
          mapServiceRef.current?.removeEntityFromMap(entityId);
        }
      }
      const styleSources = map.getStyle()?.sources ?? {};
      for (const sourceId of Object.keys(styleSources)) {
        if (!sourceId.startsWith("entity-")) continue;
        if (sourceId.startsWith("entity-label-")) continue;
        const entityId = sourceId.slice("entity-".length);
        if (!entityId || currentIds.has(entityId)) continue;
        mapServiceRef.current?.removeEntityFromMap(entityId);
      }

      Object.entries(entitiesById).forEach(([id, entity]) => {
        if (!prevEntityIds.current.has(id)) {
          mapServiceRef.current?.addEntityToMap(entity);
        } else if (prevEntitiesById.current[id] !== entity) {
          mapServiceRef.current?.updateEntityToMap(entity);
        }
      });
      prevEntityIds.current = currentIds;
      // Clone to avoid mutating (or attempting to delete from) potentially frozen objects from Redux.
      prevEntitiesById.current = { ...entitiesById };
    };

    updateEntities();

    return () => {
    };
  }, [entitiesById, mapServiceRef]);

  const handleEntityUpdated = useCallback(
    (id: string, coordinates: Coordinates[]) => {
      const entity = entitiesById[id];
      if (!entity) {
        return;
      }
      const geometry = buildGeometryForUpdate(entity, coordinates);
      dispatch(
        updateEntity({
          id,
          coordinates,
          geometry,
          updatedAt: Date.now(),
        })
      );

      const payload = buildUpdateEntityPayload(entity.id, entity.category, entity.type, coordinates, entity.name);
      if (payload) {
        payload.type = toEntityCategoryEnum(payload.type);
        WebSocketService.getInstance().sendMessage(WsMessageName.UpdateEntity, payload);
      }
    },
    [dispatch, entitiesById]
  );

  const handleEntityDeleted = useCallback(() => {
  }, []);

  return {
    handleEntityUpdated,
    handleEntityDeleted,
  };
};
