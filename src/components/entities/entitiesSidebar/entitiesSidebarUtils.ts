import type { Entity } from "../../../store/slices/entitiesSlice";

export function pickNewMissionName(existing: string[]): string {
  const base = "משימה חדשה";
  if (!existing.includes(base)) return base;
  let i = 2;
  while (existing.includes(`${base} (${i})`)) i += 1;
  return `${base} (${i})`;
}

export function pickMissionCopyName(sourceName: string, existing: string[]): string {
  const trimmed = String(sourceName || "").trim();
  const base = trimmed ? `${trimmed} העתק` : "משימה העתק";
  if (!existing.includes(base)) return base;
  let i = 2;
  while (existing.includes(`${base} (${i})`)) i += 1;
  return `${base} (${i})`;
}

export function isTabbozonEntity(entity: Entity): boolean {
  const category = String(entity.category || "")
    .trim()
    .toUpperCase();
  const name = String(entity.name || "")
    .trim()
    .toUpperCase();
  return (
    entity.type === "sector" && (category === "TABBOZON" || name === "TABBOZON")
  );
}
