/**
 * טאבי Mission DE / מסננים — סדר קבוע; MARKERS (נקודות) אחרון.
 */
export enum EntityMissionTab {
  FREE = "FREE",
  FIZ = "FIZ",
  WCO_FREE = "WCO_FREE",
  WCO_HOLD = "WCO_HOLD",
  MARKERS = "MARKERS",
}

/** קטגוריה בטפסי יצירה ובישויות מקומיות (ערכי אחסון עם רווח ב-WCO). */
export enum EntityFormCategory {
  FREE = "FREE",
  FIZ = "FIZ",
  WCO_FREE = "WCO FREE",
  WCO_HOLD = "WCO HOLD",
}

/** מסנן «הכל» ב-Mission DE */
export const MISSION_DE_FILTER_ALL = "ALL" as const;

export type MissionDeDisplayFilter = typeof MISSION_DE_FILTER_ALL | EntityMissionTab;

/** קטגוריה בפרוטוקול שמירה לשרת (מקף תחתון). */
export enum ServerEntityCategory {
  FREE = "FREE",
  FIZ = "FIZ",
  WCO_FREE = "WCO_FREE",
  WCO_HOLD = "WCO_HOLD",
}

const FORM_VALUES = new Set<string>(Object.values(EntityFormCategory));

/** נרמול כל מחרוזת (שרת / ישן) לאחת מארבע קטגוריות האחסון המותרות. */
export function parseEntityFormCategory(raw: string | undefined | null): EntityFormCategory {
  const s = String(raw ?? "").trim();
  if (FORM_VALUES.has(s)) return s as EntityFormCategory;
  const normalized = s.toUpperCase().replace(/\s+/g, "_");
  if (normalized === "WCO_FREE" || normalized === "WCP_FREE") return EntityFormCategory.WCO_FREE;
  if (normalized === "WCO_HOLD") return EntityFormCategory.WCO_HOLD;
  if (normalized === "FIZ") return EntityFormCategory.FIZ;
  if (normalized === "FREE") return EntityFormCategory.FREE;
  return EntityFormCategory.FREE;
}

/** קטגוריה ישנה (שרת) לפני מעבר ל-enum — TABBOZON הישן ו-TABOOZONE */
export function isLegacyTaboozoneCategoryRaw(raw: string | undefined | null): boolean {
  const u = String(raw ?? "").trim().toUpperCase();
  return u === "TABBOZON" || u === "TABOOZONE";
}
