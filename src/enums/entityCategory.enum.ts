
export enum EntityMissionTab {
  FREE = "FREE",
  FIZ = "FIZ",
  WCO_FREE = "WCO_FREE",
  WCO_HOLD = "WCO_HOLD",
  MARKERS = "MARKERS",
}

export enum EntityFormCategory {
  FREE = "FREE",
  FIZ = "FIZ",
  WCO_FREE = "WCO FREE",
  WCO_HOLD = "WCO HOLD",
}

export const MISSION_DE_FILTER_ALL = "ALL" as const;

export type MissionDeDisplayFilter = typeof MISSION_DE_FILTER_ALL | EntityMissionTab;

export enum ServerEntityCategory {
  FREE = "FREE",
  FIZ = "FIZ",
  WCO_FREE = "WCO_FREE",
  WCO_HOLD = "WCO_HOLD",
}
