import type { RootState } from "../store";
import type { Entity } from "../slices/entitiesSlice";

/** ישויות להצגה במפה בלבד — לפי משימה פעילה; ללא משימה פעילה אין תצוגה. */
export function selectEntitiesForMap(state: RootState): Record<string, Entity> {
  const { byId, activeMissionName, missionsByName } = state.entities;
  if (!activeMissionName) return {};
  const ids = missionsByName[activeMissionName]?.entityIds ?? [];
  const out: Record<string, Entity> = {};
  for (const id of ids) {
    const e = byId[id];
    if (e) out[id] = e;
  }
  return out;
}

/** משימה פעילה + ישות preview מהרשימה (ללא שמירת שיוך); בלי משימה פעילה אין preview על המפה */
export function selectDisplayedEntitiesOnMap(state: RootState): Record<string, Entity> {
  const base = selectEntitiesForMap(state);
  const { previewEntityId: pid, activeMissionName } = state.entities;
  if (!pid || !activeMissionName) return base;
  const e = state.entities.byId[pid];
  if (!e) return base;
  if (base[pid]) return base;
  return { ...base, [pid]: e };
}

export function selectAllEntitiesById(state: RootState): Record<string, Entity> {
  return state.entities.byId;
}
