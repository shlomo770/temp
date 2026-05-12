import type { RootState } from "../store";
import type { Entity } from "../slices/entitiesSlice";

/**
 * ישויות להצגה במפה:
 * - ללא משימה פעילה: כל מה שב־`byId`.
 * - עם משימה פעילה: רק מזהים ב־`missionsByName[activeMissionName].entityIds` שקיימים ב־`byId`.
 *   רשימת ה־IDs נטענת מ־GET_DB, מ־MISSION_DATA (אחרי LoadMission), או משמירה מקומית — זה קובע מי שייך למשימה.
 */
export function selectEntitiesForMap(state: RootState): Record<string, Entity> {
  const { byId, activeMissionName, missionsByName } = state.entities;
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


