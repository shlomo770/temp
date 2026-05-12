import { EntityCategoryEnum } from "../enums/entitis.enum";

const enumValueToName = (v: number): string | undefined => {
  const table = EntityCategoryEnum as unknown as Record<number, string>;
  const name = table[v];
  return typeof name === "string" ? name : undefined;
};

/** תווית קטגוריה לתצוגה (מפה / UI) — ממיר מספר enum או מחרוזת מספרית לשם */
export function formatEntityCategoryLabel(
  cat: EntityCategoryEnum | string | number | undefined | null
): string {
  if (cat === undefined || cat === null) return "";
  if (typeof cat === "number" && Number.isInteger(cat)) {
    const name = enumValueToName(cat);
    if (name) return name.replace(/_/g, " ");
    return String(cat);
  }
  if (typeof cat === "string") {
    const t = cat.trim();
    if (t === "") return "";
    if (/^\d+$/.test(t)) {
      const v = parseInt(t, 10);
      const name = enumValueToName(v);
      if (name) return name.replace(/_/g, " ");
    }
    return t.replace(/_/g, " ");
  }
  return String(cat).replace(/_/g, " ");
}

export const ENTITY_CATEGORY_OPTIONS = [
  EntityCategoryEnum.FREE,
  EntityCategoryEnum.FIZ,
  EntityCategoryEnum.WCO_HOLD,
  EntityCategoryEnum.WCO_FREE,
] as const;

/** טאבי Mission DE — תואם ל־missionDePanelModel */
export type MissionDeTabId = "FREE" | "FIZ" | "WCO_FREE" | "WCO_HOLD" | "MARKERS";

export const MISSION_DE_TABS: readonly {
  id: MissionDeTabId;
  label: string;
  entityCategories?: readonly string[];
  markersOnly?: boolean;
}[] = [
  { id: "FREE", label: "FREE", entityCategories: ["FREE"] },
  { id: "FIZ", label: "FIZ", entityCategories: ["FIZ"] },
  {
    id: "WCO_FREE",
    label: "WCO FREE",
    entityCategories: ["WCO_FREE", "WCO FREE", "WCP_FREE"],
  },
  {
    id: "WCO_HOLD",
    label: "WCO HOLD",
    entityCategories: ["WCO_HOLD", "WCO HOLD"],
  },
  { id: "MARKERS", label: "נקודות", markersOnly: true },
];

export function categoriesMatch(a: string | undefined, b: string | undefined): boolean {
  return String(a ?? "").trim().toUpperCase() === String(b ?? "").trim().toUpperCase();
}

function categoryToStorageLabel(cat: EntityCategoryEnum | string | undefined): string {
  if (cat === undefined || cat === null) return "";
  if (typeof cat === "string") return cat;
  const name = EntityCategoryEnum[cat];
  return name ?? String(cat);
}

/** האם ישות שייכת לטאב Mission DE */
export function entityMatchesMissionDeTab(
  e: { type?: string; category?: EntityCategoryEnum | string } | undefined,
  tabId: MissionDeTabId
): boolean {
  if (!e) return false;
  const tab = MISSION_DE_TABS.find((t) => t.id === tabId);
  if (!tab) return false;
  if (tab.markersOnly) return e.type === "marker";
  const catStr = categoryToStorageLabel(e.category as EntityCategoryEnum);
  return (tab.entityCategories ?? []).some((c) => categoriesMatch(c, catStr));
}
