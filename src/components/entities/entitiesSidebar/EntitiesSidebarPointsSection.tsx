import React, { FC, MutableRefObject } from "react";
import { FaCrosshairs, FaEye, FaEyeSlash, FaPlus, FaTrashAlt, FaChevronLeft } from "react-icons/fa";
import { MARKER_ICONS, getMarkerIconChar } from "../../../constants/MarkerIcons";
import type { AppDispatch } from "../../../store/store";
import type { Entity } from "../../../store/slices/entitiesSlice";
import {
  removeEntity,
  setPreviewEntityId,
  setSelectedEntity,
  toggleEntityVisibility,
} from "../../../store/slices/entitiesSlice";
import { setEntityVisibilityOnMap } from "../../../utils/mapEntityLayerVisibility";
import { isTabbozonEntity } from "./entitiesSidebarUtils";
import type { OutboundMessageMap, OutboundMessageName } from "../../../services/webSocket/wsTypes";
import { toEntityCategoryEnum } from "../../../services/webSocket/saveEntityMessage";
import { WsMessageName } from "../../../enums/ws.enum";
import { swalConfirmDanger, swalInfo } from "../../../utils/swalDialog";

export type EntitiesSidebarPointsSectionProps = {
  onBack: () => void;
  pointsSearchQuery: string;
  setPointsSearchQuery: (q: string) => void;
  filteredPointsByIcon: Record<string, Entity[]>;
  openMarkerGroup: string | null;
  setOpenMarkerGroup: (v: string | null) => void;
  activeMissionName: string | null;
  selectedEntityId: string | null;
  mapServiceRef?: MutableRefObject<any>;
  dispatch: AppDispatch;
  sendMessage: <T extends OutboundMessageName>(headerName: T, data: OutboundMessageMap[T]) => void;
  setGroupVisibility: (list: Entity[], visible: boolean) => void;
  deleteGroup: (list: Entity[], label: string) => void | Promise<void>;
  onEditEntity: (entity: Entity) => void;
  onCenterToEntity: (entity: Entity) => void;
  onOpenCreateMarkerPanel?: () => void;
  editingEntityId?: string | null;
};

function groupInitial(group: string): string {
  const t = String(group || "").trim();
  return t ? t.slice(0, 1).toUpperCase() : "?";
}

/** גליף מזערי לקבוצה — רק אם יש def; אחרת רק האות */
function GroupGlyph({ group, list }: { group: string; list: Entity[] }) {
  const anyEntity = list[0];
  const code = (anyEntity?.properties && (anyEntity.properties as { iconChar?: string }).iconChar) as
    | string
    | undefined;
  const def = code ? MARKER_ICONS.find((m) => m.code === code) : undefined;
  if (!def) {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-zinc-600/60 bg-zinc-900/90 text-[9px] font-bold tabular-nums text-sky-300/95">
        {groupInitial(group)}
      </span>
    );
  }
  return (
    <span
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-zinc-600/50 bg-zinc-900/95 text-[10px] leading-none text-zinc-200"
      style={{ fontFamily: `${def.font}, sans-serif` }}
      title={def.label}
    >
      {getMarkerIconChar(def.code)}
    </span>
  );
}

const iconBtn =
  "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-zinc-500 transition hover:bg-zinc-700/80 hover:text-zinc-100";

const EntitiesSidebarPointsSection: FC<EntitiesSidebarPointsSectionProps> = ({
  onBack,
  pointsSearchQuery,
  setPointsSearchQuery,
  filteredPointsByIcon,
  openMarkerGroup,
  setOpenMarkerGroup,
  activeMissionName,
  selectedEntityId,
  mapServiceRef,
  dispatch,
  sendMessage,
  setGroupVisibility,
  deleteGroup,
  onEditEntity,
  onCenterToEntity,
  onOpenCreateMarkerPanel,
  editingEntityId,
}) => {
  const handleEntityClick = (entity: Entity) => {
    if (entity.type === "marker" || isTabbozonEntity(entity)) {
      dispatch(setSelectedEntity(entity.id));
      return;
    }
    dispatch(setSelectedEntity(entity.id));
    onEditEntity(entity);
  };

  const handleDeleteEntity = async (e: React.MouseEvent, entity: Entity) => {
    e.stopPropagation();
    if (editingEntityId === entity.id) {
      await swalInfo("לא ניתן למחוק ישות שנמצאת כרגע בעריכה.", "לא ניתן למחוק");
      return;
    }
    const ok = await swalConfirmDanger(`למחוק את "${entity.name}"?`, {
      title: "מחיקת ישות",
      confirmText: "מחק",
      cancelText: "ביטול",
    });
    if (!ok) return;
    sendMessage(WsMessageName.EntityDeleted, { id: entity.id, type: toEntityCategoryEnum(entity.type) });
    dispatch(removeEntity(entity.id));
    if (mapServiceRef?.current) mapServiceRef.current.removeEntityFromMap?.(entity.id);
    if (selectedEntityId === entity.id) dispatch(setSelectedEntity(null));
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-2.5 pb-2 pt-1">
      <button
        type="button"
        onClick={onBack}
        className="mb-2 flex items-center gap-1.5 py-1 text-[11px] text-zinc-500 transition hover:text-zinc-200"
      >
        <img src="./icons/back_arrow512.png" alt="" className="h-3.5 w-3.5 invert opacity-60" />
        חזרה
      </button>

      <div className="mb-2 flex items-center justify-between gap-2 border-b border-zinc-700/40 pb-2">
        <div className="min-w-0">
          <h3 className="text-[11px] font-semibold tracking-wide text-zinc-200">נקודות</h3>
          <p className="text-[9px] text-zinc-600">לפי סוג · קומפקטי</p>
        </div>
        <button
          type="button"
          onClick={() => onOpenCreateMarkerPanel?.()}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sky-600/90 text-white shadow-sm transition hover:bg-sky-500"
          title="נקודה חדשה"
        >
          <FaPlus className="h-3 w-3" />
        </button>
      </div>

      <input
        type="search"
        value={pointsSearchQuery}
        onChange={(e) => setPointsSearchQuery(e.target.value)}
        placeholder="חיפוש…"
        className="mb-2 w-full rounded-md border border-zinc-700/60 bg-zinc-900/80 px-2 py-1 text-[11px] text-zinc-100 placeholder-zinc-600 outline-none ring-0 transition focus:border-sky-600/50"
      />

      <div className="flex flex-col gap-1">
        {Object.entries(filteredPointsByIcon).map(([group, list]) => {
          const isOpenGroup = openMarkerGroup === group;
          const allHidden = list.length > 0 && list.every((e) => !e.visible);
          return (
            <div key={group} className="rounded-md border border-zinc-700/35 bg-zinc-900/40">
              <div className="flex items-stretch gap-0.5">
                <button
                  type="button"
                  onClick={() => setOpenMarkerGroup(isOpenGroup ? null : group)}
                  className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-right transition hover:bg-zinc-800/50"
                >
                  <FaChevronLeft
                    className={`h-2.5 w-2.5 shrink-0 text-zinc-600 transition-transform ${isOpenGroup ? "-rotate-90" : ""}`}
                    aria-hidden
                  />
                  <GroupGlyph group={group} list={list} />
                  <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-zinc-200">{group}</span>
                  <span className="shrink-0 rounded bg-zinc-800/90 px-1.5 py-0.5 text-[9px] tabular-nums font-medium text-zinc-500">
                    {list.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setGroupVisibility(list, allHidden);
                  }}
                  className={`${iconBtn} border-s border-zinc-700/30`}
                  title={allHidden ? "הצג הכל" : "הסתר הכל"}
                >
                  {allHidden ? <FaEye className="h-2.5 w-2.5" /> : <FaEyeSlash className="h-2.5 w-2.5" />}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteGroup(list, group);
                  }}
                  className={`${iconBtn} border-s border-zinc-700/30 text-zinc-600 hover:text-rose-400`}
                  title="מחק קבוצה"
                >
                  <FaTrashAlt className="h-2.5 w-2.5" />
                </button>
              </div>

              {isOpenGroup && (
                <ul
                  className="border-t border-zinc-800/60 py-0.5 pe-1 ps-1"
                  onMouseLeave={() => {
                    if (activeMissionName) dispatch(setPreviewEntityId(null));
                  }}
                >
                  {list.map((entity) => {
                    const isSelected = selectedEntityId === entity.id;
                    return (
                      <li
                        key={entity.id}
                        onMouseEnter={() => {
                          if (activeMissionName) dispatch(setPreviewEntityId(entity.id));
                        }}
                        onClick={() => handleEntityClick(entity)}
                        className={`flex cursor-pointer items-center gap-0.5 rounded px-1 py-0.5 text-[10px] transition ${isSelected
                          ? "bg-sky-900/35 text-sky-100 ring-1 ring-sky-600/30"
                          : "text-zinc-300 hover:bg-zinc-800/60"
                          }`}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCenterToEntity(entity);
                          }}
                          className={iconBtn}
                          title="מפה"
                        >
                          <FaCrosshairs className="h-2.5 w-2.5" />
                        </button>
                        <span className="min-w-0 flex-1 truncate text-right leading-tight">{entity.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextVisible = !entity.visible;
                            dispatch(toggleEntityVisibility(entity.id));
                            const map = mapServiceRef?.current?.getMap?.() ?? null;
                            setEntityVisibilityOnMap(map, entity.id, nextVisible);
                          }}
                          className={`${iconBtn} ${entity.visible ? "text-emerald-500/90" : "text-zinc-600"
                            }`}
                          title={entity.visible ? "הסתר" : "הצג"}
                        >
                          {entity.visible ? (
                            <FaEye className="h-2.5 w-2.5" />
                          ) : (
                            <FaEyeSlash className="h-2.5 w-2.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteEntity(e, entity)}
                          className={`${iconBtn} text-zinc-600 hover:text-rose-400`}
                          title="מחק"
                        >
                          <FaTrashAlt className="h-2.5 w-2.5" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EntitiesSidebarPointsSection;
