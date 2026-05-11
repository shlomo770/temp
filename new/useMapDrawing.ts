import { useCallback, useRef } from "react";
import { useAppDispatch } from "../../../hooks/useAppDispatch";
import { addEntity, setDrawingMode, setCreationForm } from "../../../store/slices/entitiesSlice";
import { Entity, EntityType } from "../../../types";
import { MapService } from "../../../services/map/MapService";
import { buildNewEntity, closePolygonCoordinates } from "../../../services/entities/EntityGeometryService";
import { store } from "../../../store/store";
import { WebSocketService } from "../../../services/webSocket/WebSocketService";
import { WsMessageName } from "../../../enums/ws.enum";
import { buildSaveEntityPayload } from "../../../services/webSocket/saveEntityMessage";
import { EntityFormCategory } from "../../../enums/entityCategory.enum";

type UseMapDrawingParams = {
  mapServiceRef: React.MutableRefObject<MapService | null>;
};

function notifyServerEntityCreated(
  id: string,
  category: string,
  type: EntityType,
  coordinates: Entity["coordinates"]
) {
  const payload = buildSaveEntityPayload(id, category, type, coordinates ?? []);
  if (!payload) return;
  WebSocketService.getInstance().sendMessage(WsMessageName.SaveEntity, payload);
}

export const useMapDrawing = ({ mapServiceRef }: UseMapDrawingParams) => {
  const dispatch = useAppDispatch();
  const lastCreateRef = useRef<{ key: string; at: number } | null>(null);

  const cleanupPreview = useCallback((type: EntityType) => {
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
  }, [mapServiceRef]);

  const handleEntityDrawn = useCallback((entity: Omit<Entity, "id">) => {
    // Guard against duplicate draw-complete callbacks for the same geometry.
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
    const baseCategory = (creationCategory && creationCategory.trim()) || EntityFormCategory.FREE;
    const height = Number.isFinite(Number(creationHeight)) ? Number(creationHeight) : 0;
    const withHeight = (coords: Entity["coordinates"]) =>
      (coords || []).map((c: any) => ({ ...c, alt: height }));

    if (entity.type === "marker") {
      const entityId = `entity_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      const newEntity = buildNewEntity(
        entityId,
        baseName || "Point",
        EntityFormCategory.FREE,
        "marker",
        withHeight(entity.coordinates),
        entity.properties?.iconChar ? { iconChar: entity.properties.iconChar } : undefined
      );
      dispatch(addEntity(newEntity));
      notifyServerEntityCreated(newEntity.id, newEntity.category, newEntity.type, newEntity.coordinates);
      cleanupPreview("marker");
      dispatch(setCreationForm({ name: '', category: EntityFormCategory.FREE, height: 0 }));
      dispatch(setDrawingMode(null));
      return;
    }

    const name = baseName || "Entity";
    const category = baseCategory || EntityFormCategory.FREE;
    const entityId = `entity_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const finalCoordinates = entity.type === "polygon"
      ? closePolygonCoordinates(withHeight(entity.coordinates))
      : withHeight(entity.coordinates);
    const newEntity = buildNewEntity(entityId, name, category, entity.type, finalCoordinates);
    dispatch(addEntity(newEntity));
    notifyServerEntityCreated(newEntity.id, newEntity.category, newEntity.type, newEntity.coordinates);
    dispatch(setCreationForm({ name: '', category: EntityFormCategory.FREE, height: 0 }));
    cleanupPreview(entity.type);
    dispatch(setDrawingMode(null));
  }, [cleanupPreview, dispatch, mapServiceRef]);

  return {
    handleEntityDrawn,
  };
};
