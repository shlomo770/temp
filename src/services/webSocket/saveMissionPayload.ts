import type { Entity } from "../../store/slices/entitiesSlice";
import { getSaveMissionPayloadMode } from "../../config/saveMission";

/** מחרוזת ה־entities לשדה SAVE_MISSION לפי מצב התאימות */
export function buildSaveMissionEntitiesField(
  entityIds: string[],
  getById: () => Record<string, Entity>
): string {
  const mode = getSaveMissionPayloadMode();
  if (mode === "full_entities") {
    const byId = getById();
    const objs = entityIds.map((id) => byId[id]).filter(Boolean) as Entity[];
    return JSON.stringify(objs);
  }
  return JSON.stringify(entityIds);
}
