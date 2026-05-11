import type { Entity } from "../../../store/slices/entitiesSlice";

/** שם משימה חדשה שלא מתנגש עם רשימת השמות הקיימת */
export function pickNewMissionName(existing: string[]): string {
  const base = "משימה חדשה";
  if (!existing.includes(base)) return base;
  let i = 2;
  while (existing.includes(`${base} (${i})`)) i += 1;
  return `${base} (${i})`;
}

/** שם משימת עותק ייחודי: «שם המקור העתק», «שם המקור העתק (2)» … */
export function pickMissionCopyName(sourceName: string, existing: string[]): string {
  const trimmed = String(sourceName || "").trim();
  const base = trimmed ? `${trimmed} העתק` : "משימה העתק";
  if (!existing.includes(base)) return base;
  let i = 2;
  while (existing.includes(`${base} (${i})`)) i += 1;
  return `${base} (${i})`;
}

export function isTaboozoneEntity(entity: Entity): boolean {
  if (entity.type !== "sector") return false;
  const props = entity.properties as { taboozone?: boolean; tabbozon?: boolean } | undefined;
  if (props?.taboozone || props?.tabbozon) return true;
  const name = String(entity.name || "")
    .trim()
    .toUpperCase();
  return name === "TABBOZON" || name === "TABOOZONE";
}
