/** שדה `entities` ב־SAVE_MISSION — מערך מזהי ישויות בלבד (JSON). */
export function buildSaveMissionEntitiesField(entityIds: string[]): string {
  return JSON.stringify(entityIds);
}
