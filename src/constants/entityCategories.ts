import {
  EntityFormCategory,
  EntityMissionTab,
} from "../enums/entityCategory.enum";

export const ENTITY_CATEGORY_OPTIONS: readonly EntityFormCategory[] = [
  EntityFormCategory.FREE,
  EntityFormCategory.FIZ,
  EntityFormCategory.WCO_HOLD,
  EntityFormCategory.WCO_FREE,
];

export type EntityCategory = EntityFormCategory;

export function categoriesMatch(a: string | undefined, b: string | undefined): boolean {
  return String(a ?? "").trim().toUpperCase() === String(b ?? "").trim().toUpperCase();
}

/** טאבי Mission DE — זהה ל־EntityMissionTab */
export type MissionDeTabId = EntityMissionTab;

export const MISSION_DE_TABS: readonly {
  id: MissionDeTabId;
  /** תווית בטאב */
  label: string;
  /** קטגוריות ישות (מזהים חלופיים לשם קטגוריה במאגר) */
  entityCategories?: readonly string[];
  /** טאב נקודות במפה */
  markersOnly?: boolean;
}[] = [
  { id: EntityMissionTab.FREE, label: "FREE", entityCategories: ["FREE"] },
  { id: EntityMissionTab.FIZ, label: "FIZ", entityCategories: ["FIZ"] },
  {
    id: EntityMissionTab.WCO_FREE,
    label: "WCO FREE",
    entityCategories: ["WCO FREE", "WCO_FREE", "WCP_FREE"],
  },
  {
    id: EntityMissionTab.WCO_HOLD,
    label: "WCO HOLD",
    entityCategories: ["WCO HOLD", "WCO_HOLD"],
  },
  { id: EntityMissionTab.MARKERS, label: "נקודות", markersOnly: true },
];

/** האם ישות שייכת לטאב Mission DE (לא כולל נקודות) */
export function entityMatchesMissionDeTab(
  e: { type?: string; category?: EntityFormCategory | string } | undefined,
  tabId: MissionDeTabId
): boolean {
  if (!e) return false;
  const tab = MISSION_DE_TABS.find((t) => t.id === tabId);
  if (!tab) return false;
  if (tab.markersOnly) return e.type === "marker";
  return (tab.entityCategories ?? []).some((c) => categoriesMatch(c, e.category));
}

/** רשימת קטגוריות לאזורים: רק ערכי EntityFormCategory שמופיעים במערכת */
export function getMergedCategoryList(
  byId: Record<string, { category?: EntityFormCategory } | undefined>
): EntityFormCategory[] {
  const set = new Set<EntityFormCategory>();
  for (const o of ENTITY_CATEGORY_OPTIONS) set.add(o);
  for (const e of Object.values(byId)) {
    const c = e?.category;
    if (c) set.add(c);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "he"));
}
