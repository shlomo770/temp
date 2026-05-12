/**
 * יחידת מהירות בשורה השנייה של תווית מטרה (אותיות קטנות בלבד).
 */
export const TARGET_MAP_LABEL_SPEED_UNIT = "kmh";

const ALT_MAX_DIGITS = 9999;

function formatAltMeters(alt: number): string {
  const r = Math.round(Number(alt));
  if (!Number.isFinite(r)) return "";
  const clamped = Math.min(ALT_MAX_DIGITS, Math.max(0, r));
  return `${clamped} m`;
}

/** שורה שנייה לתווית מפה: מהירות + גובה (למשל `120 kmh  1200 m`). */
export function formatTargetMapLabelSecondLine(t: {
  speed?: number;
  coordinates?: { alt?: number };
}): string {
  const parts: string[] = [];
  if (t.speed != null && Number.isFinite(t.speed)) {
    parts.push(`${Math.round(t.speed)} ${TARGET_MAP_LABEL_SPEED_UNIT}`);
  }
  const alt = t.coordinates?.alt;
  if (alt != null && Number.isFinite(Number(alt))) {
    parts.push(formatAltMeters(Number(alt)));
  }
  return parts.join("  ");
}
