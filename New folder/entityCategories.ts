export const ENTITY_CATEGORY_OPTIONS = [
  'FREE',
  'FIZ',
  'WCO HOLD',
  'WCO FREE',
] as const;

/** קטגוריות נפוצות להצגה ברשימות אזורים — נוסף על מה שמגיע מהמאגר */
export const ENTITY_CATEGORY_EXTRA_PRESETS = [
  'DEFENSE',
  'ATTACK',
  'GENERAL',
  'PROHIBITED',
] as const;

export type EntityCategory = typeof ENTITY_CATEGORY_OPTIONS[number];

export function categoriesMatch(a: string | undefined, b: string | undefined): boolean {
  return String(a ?? "").trim().toUpperCase() === String(b ?? "").trim().toUpperCase();
}

/** טאבי Mission DE בלבד — סדר קבוע; לא כולל קטגוריות אחרות מהמערכת */
export type MissionDeTabId = "FREE" | "FIZ" | "WCO_FREE" | "WCO_HOLD" | "MARKERS";

export const MISSION_DE_TABS: readonly {
  id: MissionDeTabId;
  /** תווית בטאב */
  label: string;
  /** קטגוריות ישות (מזהים חלופיים לשם קטגוריה במאגר) */
  entityCategories?: readonly string[];
  /** טאב נקודות במפה */
  markersOnly?: boolean;
}[] = [
  { id: "FREE", label: "FREE", entityCategories: ["FREE"] },
  { id: "FIZ", label: "FIZ", entityCategories: ["FIZ"] },
  {
    id: "WCO_FREE",
    label: "WCO FREE",
    entityCategories: ["WCO FREE", "WCO_FREE", "WCP_FREE"],
  },
  {
    id: "WCO_HOLD",
    label: "WCO HOLD",
    entityCategories: ["WCO HOLD", "WCO_HOLD"],
  },
  { id: "MARKERS", label: "נקודות", markersOnly: true },
];

/** האם ישות שייכת לטאב Mission DE (לא כולל נקודות) */
export function entityMatchesMissionDeTab(
  e: { type?: string; category?: string } | undefined,
  tabId: MissionDeTabId
): boolean {
  if (!e) return false;
  const tab = MISSION_DE_TABS.find((t) => t.id === tabId);
  if (!tab) return false;
  if (tab.markersOnly) return e.type === "marker";
  return (tab.entityCategories ?? []).some((c) => categoriesMatch(c, e.category));
}

/** רשימת טאבים לרשימות אזורים כלליות: ערכי enum + פריסטים + כל קטגוריה שמופיעה על ישות במערכת */
export function getMergedCategoryList(
  byId: Record<string, { category?: string } | undefined>
): string[] {
  const set = new Set<string>();
  for (const o of ENTITY_CATEGORY_OPTIONS) set.add(o);
  for (const o of ENTITY_CATEGORY_EXTRA_PRESETS) set.add(o);
  for (const e of Object.values(byId)) {
    const c = e && String(e.category ?? "").trim();
    if (c) set.add(c);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "he"));
}