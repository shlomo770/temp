/**
 * SAVE_MISSION — תאימות שרת:
 * - entity_ids (ברירת מחדל): מערך מזהים בלבד ב־JSON.
 * - full_entities: מערך אובייקטי ישות מלאים מהמאגר (לשרתים ישנים).
 *
 * הגדרה: VITE_SAVE_MISSION_MODE=full_entities או entity_ids
 */
export type SaveMissionPayloadMode = "entity_ids" | "full_entities";

export function getSaveMissionPayloadMode(): SaveMissionPayloadMode {
  const raw = import.meta.env.VITE_SAVE_MISSION_MODE as string | undefined;
  if (raw === "full_entities") return "full_entities";
  return "entity_ids";
}
