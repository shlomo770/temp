import type { EntityType } from "../../types";

const LOCAL_ENTITY_TYPES: EntityType[] = [
  "polygon",
  "line",
  "rectangle",
  "circle",
  "ellipse",
  "sector",
  "marker",
];
import type { Entity } from "../../store/slices/entitiesSlice";
import {
  EntityFormCategory,
  isLegacyTaboozoneCategoryRaw,
  parseEntityFormCategory,
} from "../../enums/entityCategory.enum";
import { normalizeCoordinates, toLocalEntityType } from "../webSocket/saveEntityMessage";
import { buildGeometryForCreate } from "./EntityGeometryService";

/** Maps server type strings not covered by toLocalEntityType. */
function inferEntityType(raw: unknown): EntityType | null {
  const fromServer = toLocalEntityType(String(raw ?? ""));
  if (fromServer) return fromServer;
  const lower = String(raw ?? "").trim().toLowerCase();
  if (LOCAL_ENTITY_TYPES.includes(lower as EntityType)) return lower as EntityType;
  const u = String(raw ?? "").trim().toUpperCase();
  if (u === "MARKER" || u === "POINT") return "marker";
  if (u === "RECTANGLE") return "rectangle";
  if (u === "CIRCLE") return "circle";
  return null;
}

/**
 * Converts a loose entity object from the server into the Redux Entity shape.
 * Does not assume GeoJSON-ready geometry — builds geometry from coordinates when missing.
 */
export function normalizeRawEntityToStore(raw: unknown): Entity | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = String(o.id ?? "").trim();
  if (!id) return null;

  const type = inferEntityType(o.type);
  if (!type) return null;

  let coords = normalizeCoordinates(o.coordinates);
  if (coords.length === 0 && o.geometry && typeof o.geometry === "object") {
    const g = o.geometry as Record<string, unknown>;
    const c = g.coordinates;
    if (Array.isArray(c)) {
      coords = normalizeCoordinates(c as unknown[]);
    }
  }

  if (coords.length === 0 && type !== "marker") {
    return null;
  }
  if (type === "marker" && coords.length === 0) {
    const lat = Number(o.lat ?? (o as any).latitude);
    const lng = Number(o.lng ?? (o as any).longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      coords = [{ lat, lng }];
    }
  }
  if (coords.length === 0) return null;

  const rawCat = String(o.category ?? EntityFormCategory.FREE);
  const baseProps = (o.properties as Record<string, unknown>) ?? {};
  const legacyTabbozonProp = Boolean((baseProps as { tabbozon?: boolean }).tabbozon);
  const legacyTaboozoneProp = Boolean((baseProps as { taboozone?: boolean }).taboozone);
  const taboozoneFlag =
    isLegacyTaboozoneCategoryRaw(rawCat) || legacyTabbozonProp || legacyTaboozoneProp;
  const category = parseEntityFormCategory(rawCat);
  const now = Date.now();
  const geom =
    o.geometry && typeof o.geometry === "object"
      ? o.geometry
      : buildGeometryForCreate(type, coords);

  const transparencyRaw = Number(o.transparency);
  let transparency = Number.isFinite(transparencyRaw) ? transparencyRaw : 1;
  if (transparency > 1) transparency = transparency / 100;
  if (transparency < 0) transparency = 0;
  if (transparency > 1) transparency = 1;

  const properties =
    taboozoneFlag && type === "sector"
      ? { ...baseProps, taboozone: true as const }
      : baseProps;

  return {
    id,
    type,
    name: String(o.name ?? id),
    color: String(o.color ?? "#3388ff"),
    transparency,
    category,
    visible: o.visible !== false,
    geometry: geom as any,
    coordinates: coords,
    properties,
    createdAt: typeof o.createdAt === "number" ? o.createdAt : now,
    updatedAt: typeof o.updatedAt === "number" ? o.updatedAt : now,
  };
}
