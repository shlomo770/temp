import type { Entity } from "../../../store/slices/entitiesSlice";
import type { MissionDeDisplayFilter } from "../../../enums/entityCategory.enum";

export type DisplayFilter = MissionDeDisplayFilter;

export type MissionDePanelProps = {
  missionName: string;
  memberIds: string[];
  allById: Record<string, Entity>;
  onMemberIdsChange: (ids: string[]) => void;
  onSaveMissionServer: () => void;
  onOpenMissionSaveCopy: () => void;
  onMissionRename: (oldName: string, newName: string) => boolean;
  onCreateNewInCategory: (category: string) => void;
  onOpenCreateMarkerPanel?: () => void;
  onCenterToEntity: (e: Entity) => void;
  showFooter?: boolean;
};
