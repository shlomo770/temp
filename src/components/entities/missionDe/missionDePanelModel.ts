import type { Entity } from "../../../store/slices/entitiesSlice";
import {
  MISSION_DE_TABS,
  entityMatchesMissionDeTab,
} from "../../../constants/entityCategories";
import type { DisplayFilter } from "./MissionDePanelTypes";
import {
  EntityFormCategory,
  EntityMissionTab,
  MISSION_DE_FILTER_ALL,
} from "../../../enums/entityCategory.enum";

export function creationCategoryForFilter(f: DisplayFilter): EntityFormCategory {
  if (f === MISSION_DE_FILTER_ALL || f === EntityMissionTab.MARKERS) {
    return EntityFormCategory.FREE;
  }
  switch (f) {
    case EntityMissionTab.FREE:
      return EntityFormCategory.FREE;
    case EntityMissionTab.FIZ:
      return EntityFormCategory.FIZ;
    case EntityMissionTab.WCO_FREE:
      return EntityFormCategory.WCO_FREE;
    case EntityMissionTab.WCO_HOLD:
      return EntityFormCategory.WCO_HOLD;
    default:
      return EntityFormCategory.FREE;
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
    displayFilter === MISSION_DE_FILTER_ALL
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
  if (displayFilter === MISSION_DE_FILTER_ALL) return "הכל";
  return (
    MISSION_DE_TABS.find((t) => t.id === displayFilter)?.label ?? displayFilter
  );
}
