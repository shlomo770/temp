import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import type { Entity } from "../slices/entitiesSlice";

/**
 * ישויות להצגה במפה:
 * - בלי משימה פעילה — כל מה שנטען מהמאגר (GET_DB וכו׳).
 * - עם משימה פעילה — רק ישויות השייכות למשימה (לפי missionsByName).
 */
export const selectEntitiesForMap = createSelector(
  [
    (state: RootState) => state.entities.byId,
    (state: RootState) => state.entities.activeMissionName,
    (state: RootState) => state.entities.missionsByName,
  ],
  (byId, activeMissionName, missionsByName): Record<string, Entity> => {
    if (!activeMissionName) {
      return byId;
    }
    const ids = missionsByName[activeMissionName]?.entityIds ?? [];
    const out: Record<string, Entity> = {};
    for (const id of ids) {
      const e = byId[id];
      if (e) out[id] = e;
    }
    return out;
  }
);

/** משימה פעילה + ישות preview מהסרגל — רק כשיש משימה פעילה */
export const selectDisplayedEntitiesOnMap = createSelector(
  [
    selectEntitiesForMap,
    (state: RootState) => state.entities.previewEntityId,
    (state: RootState) => state.entities.activeMissionName,
    (state: RootState) => state.entities.byId,
  ],
  (baseMap, previewEntityId, activeMissionName, byId): Record<string, Entity> => {
    if (!previewEntityId || !activeMissionName) return baseMap;
    const e = byId[previewEntityId];
    if (!e) return baseMap;
    if (baseMap[previewEntityId]) return baseMap;
    return { ...baseMap, [previewEntityId]: e };
  }
);

export function selectAllEntitiesById(state: RootState): Record<string, Entity> {
  return state.entities.byId;
}
