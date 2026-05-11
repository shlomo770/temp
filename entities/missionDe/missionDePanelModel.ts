import type { Entity } from "../../../store/slices/entitiesSlice";
import {
  MISSION_DE_TABS,
  entityMatchesMissionDeTab,
} from "../../../constants/entityCategories";
import type { DisplayFilter } from "./MissionDePanelTypes";

export function creationCategoryForFilter(f: DisplayFilter): string {
  if (f === "ALL" || f === "MARKERS") return "FREE";
  switch (f) {
    case "FREE":
      return "FREE";
    case "FIZ":
      return "FIZ";
    case "WCO_FREE":
      return "WCO FREE";
    case "WCO_HOLD":
      return "WCO HOLD";
    default:
      return "FREE";
  }
}

/** ישויות במשימה — מקובצות לפי קטגוריית Mission (עץ) */
export function buildMissionTreeBuckets(
  memberIds: string[],
  allById: Record<string, Entity>
): Record<string, Entity[]> {
  const buckets: Record<string, Entity[]> = {};
  for (const t of MISSION_DE_TABS) buckets[t.id] = [];
  buckets.OTHER = [];

  for (const id of memberIds) {
    const e = allById[id];
    if (!e) continue;
    let placed = false;
    for (const t of MISSION_DE_TABS) {
      if (entityMatchesMissionDeTab(e, t.id)) {
        buckets[t.id].push(e);
        placed = true;
        break;
      }
    }
    if (!placed) buckets.OTHER.push(e);
  }
  for (const k of Object.keys(buckets)) {
    buckets[k].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "", "he")
    );
  }
  return buckets;
}

export function buildTableRows(
  allEntities: Entity[],
  displayFilter: DisplayFilter,
  searchQ: string
): Entity[] {
  let list =
    displayFilter === "ALL"
      ? allEntities
      : allEntities.filter((e) => entityMatchesMissionDeTab(e, displayFilter));
  const q = searchQ.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (e) =>
        (e.name || "").toLowerCase().includes(q) ||
        String(e.category || "")
          .toLowerCase()
          .includes(q) ||
        String(e.type || "")
          .toLowerCase()
          .includes(q)
    );
  }
  return [...list].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "", "he")
  );
}

export function missionFilterLabel(displayFilter: DisplayFilter): string {
  if (displayFilter === "ALL") return "הכל";
  return (
    MISSION_DE_TABS.find((t) => t.id === displayFilter)?.label ?? displayFilter
  );
}
