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
