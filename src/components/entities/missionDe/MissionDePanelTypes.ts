import type { Entity } from "../../../store/slices/entitiesSlice";
import type { MissionDeTabId } from "../../../constants/entityCategories";
import type { EntityCategoryEnum } from "../../../enums/entitis.enum";

export type DisplayFilter = "ALL" | MissionDeTabId;

export type MissionDePanelProps = {
  missionName: string;
  memberIds: string[];
  allById: any;
  onMemberIdsChange: (ids: string[]) => void;
  onSaveMissionServer: () => void;
  onOpenMissionSaveCopy: () => void;
  onMissionRename: (oldName: string, newName: string) => boolean | Promise<boolean>;
  onCreateNewInCategory: (category: EntityCategoryEnum) => void;
  onOpenCreateMarkerPanel?: () => void;
  onCenterToEntity: (e: Entity) => void;
  showFooter?: boolean;
};
