import { useCallback, useRef } from "react";
import { useAppDispatch } from "../../../hooks/useAppDispatch";
import {
  addEntity,
  setDrawingMode,
  setCreationForm,
} from "../../../store/slices/entitiesSlice";
import { Entity, EntityType } from "../../../types";
import { MapService } from "../../../services/map/MapService";
import {
  buildNewEntity,
  closePolygonCoordinates,
} from "../../../services/entities/EntityGeometryService";
import { store } from "../../../store/store";
import { WebSocketService } from "../../../services/webSocket/WebSocketService";
import { WsMessageName } from "../../../enums/ws.enum";
import { buildSaveEntityPayload, toEntityCategoryEnum } from "../../../services/webSocket/saveEntityMessage";
import { EntityCategoryEnum } from "../../../enums/entitis.enum";


type UseMapDrawingParams = {
  mapServiceRef: React.MutableRefObject<MapService | null>;
};

function notifyServerEntityCreated(
  id: string,
  category: EntityCategoryEnum,
  type: EntityType,
  coordinates: Entity["coordinates"],
  name: string
) {

  const payload = buildSaveEntityPayload(id, category, type, coordinates ?? [], name);
  if (!payload) return;
  payload.type = toEntityCategoryEnum(payload.type);
  WebSocketService.getInstance().sendMessage(WsMessageName.SaveEntity, payload);
}

export const useMapDrawing = ({ mapServiceRef }: UseMapDrawingParams) => {
  const dispatch = useAppDispatch();
  const lastCreateRef = useRef<{ key: string; at: number } | null>(null);

  const cleanupPreview = useCallback(
    (type: EntityType) => {
      if (!mapServiceRef.current) return;

      if (type === "circle") {
        mapServiceRef.current.removeCirclePreview();
      }

      if (type === "ellipse") {
        mapServiceRef.current.removeEllipsePreview();
      }

      if (type === "sector") {
        mapServiceRef.current.removeSectorPreview();
      }

      if (type === "polygon" || type === "line") {
        mapServiceRef.current.removePolygonPreview();
      }

      if (type === "marker") {
        mapServiceRef.current.removeCirclePreview?.();
      }
    },
    [mapServiceRef]
  );

  const handleEntityDrawn = useCallback((entity: Omit<Entity, "id">) => {
    const dedupeKey = JSON.stringify({
      type: entity.type,
      coordinates: entity.coordinates ?? [],
      iconChar: (entity as any)?.properties?.iconChar ?? null,
    });
    const now = Date.now();
    if (lastCreateRef.current && lastCreateRef.current.key === dedupeKey && now - lastCreateRef.current.at < 400) {
      return;
    }
    lastCreateRef.current = { key: dedupeKey, at: now };

    const { creationName, creationCategory, creationHeight } = store.getState().entities;
    const baseName = (creationName && creationName.trim()) || "Entity";
    const baseCategory = (creationCategory) || EntityCategoryEnum.FREE;
    const height = Number.isFinite(Number(creationHeight)) ? Number(creationHeight) : 0;
    const withHeight = (coords: Entity["coordinates"]) =>
      (coords || []).map((c: any) => ({ ...c, alt: height }));

    if (entity.type === "marker") {
      const entityId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      const newEntity = buildNewEntity(
        entityId,
        baseName || "Point",
        EntityCategoryEnum.FREE,
        "marker",
        withHeight(entity.coordinates),
        entity.properties?.iconChar ? { iconChar: entity.properties.iconChar } : undefined
      );
      dispatch(addEntity(newEntity));
      notifyServerEntityCreated(newEntity.id, newEntity.category, newEntity.type, newEntity.coordinates, newEntity.name);
      cleanupPreview("marker");
      dispatch(setCreationForm({ name: '', category: EntityCategoryEnum.FREE, height: 0 }));
      dispatch(setDrawingMode(null));
      return;
    }

    const name = baseName || "Entity";
    const category = baseCategory || EntityCategoryEnum.FREE;
    const entityId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const finalCoordinates = entity.type === "polygon"
      ? closePolygonCoordinates(withHeight(entity.coordinates))
      : withHeight(entity.coordinates);
    const newEntity = buildNewEntity(entityId, name, category, entity.type, finalCoordinates);
    dispatch(addEntity(newEntity));
    notifyServerEntityCreated(newEntity.id, newEntity.category, newEntity.type, newEntity.coordinates, newEntity.name);
    dispatch(setCreationForm({ name: '', category: EntityCategoryEnum.FREE, height: 0 }));
    cleanupPreview(entity.type);
    dispatch(setDrawingMode(null));
  }, [cleanupPreview, dispatch, mapServiceRef]);

  return {
    handleEntityDrawn,
  };
};

