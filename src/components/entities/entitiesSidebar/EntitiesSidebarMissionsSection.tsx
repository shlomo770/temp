import React, { FC, MutableRefObject } from "react";
import { FaPlus, FaTrashAlt } from "react-icons/fa";
import type { AppDispatch } from "../../../store/store";
import type { Entity } from "../../../store/slices/entitiesSlice";
import {
  removeMissionMetadata,
  setActiveMissionName,
} from "../../../store/slices/entitiesSlice";
import MissionFormPanel from "../MissionFormPanel";
import type { EntityFormCategory } from "../../../enums/entityCategory.enum";

export type EntitiesSidebarMissionsSectionProps = {
  onBackToRoot: () => void;
  activeMissionName: string | null;
  sortedMissionNames: string[];
  filteredMissionNames: string[];
  missionSearchQuery: string;
  setMissionSearchQuery: (q: string) => void;
  localDraftMissionNamesRef: MutableRefObject<Set<string>>;
  createLocalMission: () => void;
  sendMessage: (name: string, payload?: Record<string, unknown>) => void;
  dispatch: AppDispatch;
  missionsByName: Record<string, { entityIds?: string[] } | undefined>;
  entitiesById: Record<string, Entity | undefined>;
  onMissionMemberIdsChange: (ids: string[]) => void;
  saveMissionToServer: (name: string, explicitIds?: string[]) => void;
  onOpenMissionSaveCopy: () => void;
  handleMissionRename: (oldName: string, newName: string) => boolean;
  onOpenCreatePanelWithCategory?: (category: EntityFormCategory) => void;
  onOpenCreateMarkerPanel?: () => void;
  onCenterToEntity: (entity: Entity) => void;
};

const EntitiesSidebarMissionsSection: FC<EntitiesSidebarMissionsSectionProps> = ({
  onBackToRoot,
  activeMissionName,
  sortedMissionNames,
  filteredMissionNames,
  missionSearchQuery,
  setMissionSearchQuery,
  localDraftMissionNamesRef,
  createLocalMission,
  sendMessage,
  dispatch,
  missionsByName,
  entitiesById,
  onMissionMemberIdsChange,
  saveMissionToServer,
  onOpenMissionSaveCopy,
  handleMissionRename,
  onOpenCreatePanelWithCategory,
  onOpenCreateMarkerPanel,
  onCenterToEntity,
}) => (
  <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3">
    <button
      type="button"
      onClick={onBackToRoot}
      className="mb-2 flex shrink-0 items-center gap-2 text-sm text-gray-400 hover:text-white"
    >
      <img src="./icons/back_arrow512.png" alt="" className="h-4 w-4 invert opacity-70" />
      חזרה
    </button>

    {!activeMissionName ? (
      <>
        <div className="mb-3 shrink-0 rounded-lg border border-gray-700/50 bg-gray-800/40 px-3 py-2">
          <p className="text-[11px] leading-snug text-gray-400">
            לחץ על + כדי ליצור משימה חדשה — היא תופיע ברשימה עם שם ברירת מחדל. לחץ על שם משימה ברשימה כדי לפתוח ניהול (ישויות, שינוי שם, שמירה לשרת).
            ללא משימה פעילה המפה מציגה את כל הישויות מהמאגר.
          </p>
        </div>

        <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2">
          <p className="px-1 text-xs uppercase tracking-wide text-gray-500">כל המשימות</p>
          <button
            type="button"
            onClick={createLocalMission}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-600 text-white shadow transition-colors hover:bg-sky-500"
            title="משימה חדשה ברשימה"
          >
            <FaPlus className="h-4 w-4" />
          </button>
        </div>

        <input
          type="text"
          value={missionSearchQuery}
          onChange={(e) => setMissionSearchQuery(e.target.value)}
          placeholder="חיפוש בשם משימה..."
          className="mb-2 w-full shrink-0 rounded-lg border border-gray-600 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-400 focus:border-sky-500 focus:outline-none"
        />

        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto">
          {filteredMissionNames.length === 0 ? (
            <div className="text-xs text-gray-400">
              {sortedMissionNames.length === 0 ? "אין משימות להצגה" : "אין תוצאות לחיפוש"}
            </div>
          ) : (
            filteredMissionNames.map((mName) => (
              <div
                key={mName}
                className={`group flex items-center justify-between gap-1.5 rounded-lg px-2 py-2 transition-colors ${
                  activeMissionName === mName
                    ? "border border-sky-500/40 bg-sky-600/25"
                    : "bg-gray-800/60 hover:bg-gray-700/70"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    dispatch(setActiveMissionName(mName));
                    if (!localDraftMissionNamesRef.current.has(mName)) {
                      sendMessage("LOAD_MISSION", { mission_name: mName });
                    }
                  }}
                  className="min-w-0 flex-1 truncate pl-1 text-right text-sm font-medium text-gray-100"
                  title="פתח ניהול משימה"
                >
                  {mName}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!window.confirm(`למחוק את המשימה "${mName}"?`)) return;
                    sendMessage("DELETE_MISSION", { mission_name: mName });
                    dispatch(removeMissionMetadata(mName));
                  }}
                  className="shrink-0 rounded p-2 text-gray-400 hover:bg-red-900/20 hover:text-red-400"
                  title="מחק מהרשימה (מקומי)"
                >
                  <FaTrashAlt className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </>
    ) : (
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <button
          type="button"
          onClick={() => dispatch(setActiveMissionName(null))}
          className="w-fit shrink-0 text-right text-[11px] text-sky-400 hover:text-sky-300"
        >
          ← חזרה לרשימת משימות
        </button>
        <p className="shrink-0 text-[11px] leading-relaxed text-gray-500">
          חלון משמאל: טבלת כל הישויות, סינון תצוגה, קישור למשימה, הסרה מרובה, בחירה מלאה. סגירה ב־× או לרשימה.
        </p>
        <p className="shrink-0 text-[10px] leading-snug text-gray-600">
          המפה מציגה רק ישויות המשימה. ישות חדשה במצב משימה מתווספת למשימה מקומית. שליחה לשרת רק ב&quot;שמור לשרת&quot;.
        </p>
      </div>
    )}
    {activeMissionName ? (
      <MissionFormPanel
        onClose={() => dispatch(setActiveMissionName(null))}
        missionNames={sortedMissionNames}
        onMissionSwitch={(v) => {
          dispatch(setActiveMissionName(v));
          if (!localDraftMissionNamesRef.current.has(v)) {
            sendMessage("LOAD_MISSION", { mission_name: v });
          }
        }}
        missionName={activeMissionName}
        memberIds={missionsByName[activeMissionName]?.entityIds ?? []}
        allById={entitiesById}
        onMemberIdsChange={onMissionMemberIdsChange}
        onSaveMissionServer={() => saveMissionToServer(activeMissionName)}
        onOpenMissionSaveCopy={onOpenMissionSaveCopy}
        onMissionRename={handleMissionRename}
        onCreateNewInCategory={(cat) => onOpenCreatePanelWithCategory?.(cat)}
        onOpenCreateMarkerPanel={onOpenCreateMarkerPanel}
        onCenterToEntity={onCenterToEntity}
      />
    ) : null}
  </div>
);

export default EntitiesSidebarMissionsSection;
