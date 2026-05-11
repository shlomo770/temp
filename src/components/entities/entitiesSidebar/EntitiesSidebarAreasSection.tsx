import React, { FC, MutableRefObject } from "react";
import { FaCopy, FaCrosshairs, FaEye, FaEyeSlash, FaPlus, FaTrashAlt } from "react-icons/fa";
import type { AppDispatch } from "../../../store/store";
import type { Entity } from "../../../store/slices/entitiesSlice";
import {
  removeEntity,
  setPreviewEntityId,
  setSelectedEntity,
  toggleEntityVisibility,
} from "../../../store/slices/entitiesSlice";
import { setEntityVisibilityOnMap } from "../../../utils/mapEntityLayerVisibility";
import {
  EntityCategoryBadge,
  EntityTypeGlyph,
  getEntityTypeLabel,
} from "./entityDisplay";
import { isTaboozoneEntity } from "./entitiesSidebarUtils";
import type { EntityFormCategory } from "../../../enums/entityCategory.enum";

export type EntitiesSidebarAreasSectionProps = {
  onBack: () => void;
  areaSearchQuery: string;
  setAreaSearchQuery: (q: string) => void;
  filteredAreaByCategory: Partial<Record<EntityFormCategory, Record<string, Entity[]>>>;
  openAreaCategory: EntityFormCategory | null;
  setOpenAreaCategory: (v: EntityFormCategory | null) => void;
  openAreaTypeKey: string | null;
  setOpenAreaTypeKey: (v: string | null) => void;
  editingEntityId?: string | null;
  selectedEntityId: string | null;
  activeMissionName: string | null;
  mapServiceRef?: MutableRefObject<any>;
  dispatch: AppDispatch;
  sendMessage: (name: string, payload?: Record<string, unknown>) => void;
  setGroupVisibility: (list: Entity[], visible: boolean) => void;
  deleteGroup: (list: Entity[], label: string) => void;
  onEditEntity: (entity: Entity) => void;
  onCenterToEntity: (entity: Entity) => void;
  onOpenCreatePanel?: () => void;
  entityOpen: Entity | null;
  openDuplicatePanel: (entity: Entity) => void;
};

const EntitiesSidebarAreasSection: FC<EntitiesSidebarAreasSectionProps> = ({
  onBack,
  areaSearchQuery,
  setAreaSearchQuery,
  filteredAreaByCategory,
  openAreaCategory,
  setOpenAreaCategory,
  openAreaTypeKey,
  setOpenAreaTypeKey,
  editingEntityId,
  selectedEntityId,
  activeMissionName,
  mapServiceRef,
  dispatch,
  sendMessage,
  setGroupVisibility,
  deleteGroup,
  onEditEntity,
  onCenterToEntity,
  onOpenCreatePanel,
  entityOpen,
  openDuplicatePanel,
}) => {
  const handleEntityClick = (entity: Entity) => {
    if (entity.type === "marker" || isTaboozoneEntity(entity)) {
      dispatch(setSelectedEntity(entity.id));
      return;
    }
    dispatch(setSelectedEntity(entity.id));
    onEditEntity(entity);
  };

  const handleDeleteEntity = (e: React.MouseEvent, entity: Entity) => {
    e.stopPropagation();
    if (editingEntityId === entity.id) {
      alert("לא ניתן למחוק ישות שנמצאת כרגע בעריכה.");
      return;
    }
    if (!window.confirm(`למחוק את "${entity.name}"?`)) return;
    sendMessage("ENTITY_DELETED", { entityId: entity.id });
    dispatch(removeEntity(entity.id));
    if (mapServiceRef?.current) mapServiceRef.current.removeEntityFromMap?.(entity.id);
    if (selectedEntityId === entity.id) dispatch(setSelectedEntity(null));
  };

  const applyVisibility = (entity: Entity, nextVisible: boolean) => {
    dispatch(toggleEntityVisibility(entity.id));
    const map = mapServiceRef?.current?.getMap?.() ?? null;
    setEntityVisibilityOnMap(map, entity.id, nextVisible);
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-3">
      <button
        type="button"
        onClick={onBack}
        className="mb-3 flex items-center gap-2 text-sm text-gray-400 hover:text-white"
      >
        <img src="./icons/back_arrow512.png" alt="" className="h-4 w-4 invert opacity-70" />
        חזרה
      </button>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="px-1 text-xs uppercase tracking-wide text-gray-500">Existing areas</p>
        <button
          type="button"
          onClick={() => onOpenCreatePanel?.()}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-600 text-white shadow transition-colors hover:bg-sky-500"
          title="יצירת ישות חדשה"
        >
          <FaPlus className="h-4 w-4" />
        </button>
      </div>
      <input
        type="text"
        value={areaSearchQuery}
        onChange={(e) => setAreaSearchQuery(e.target.value)}
        placeholder="חיפוש לפי שם ישות..."
        className="mb-2 w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-400 focus:border-sky-500 focus:outline-none"
      />
      <div className="space-y-2">
        {(Object.entries(filteredAreaByCategory) as [EntityFormCategory, Record<string, Entity[]>][]).map(
          ([cat, types]) => {
          const catList = Object.values(types).flat();
          const catCount = catList.length;
          const isCatOpen = openAreaCategory === cat;
          const allHidden = catList.length > 0 && catList.every((e) => !e.visible);
          const hasEditingInCategory =
            !!editingEntityId && catList.some((e) => e.id === editingEntityId);
          return (
            <div key={cat}>
              <div className="flex items-center gap-1 overflow-hidden rounded-lg bg-gray-800/60">
                <button
                  type="button"
                  onClick={() => {
                    setOpenAreaCategory(isCatOpen ? null : cat);
                    setOpenAreaTypeKey(null);
                  }}
                  className="flex min-w-0 flex-1 items-center justify-between px-3 py-2 text-right text-sm text-gray-100 transition-colors hover:bg-gray-700/70"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <EntityCategoryBadge category={cat} />
                    <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded bg-sky-500/20 text-xs font-semibold text-sky-300">
                      {catCount}
                    </span>
                    <span className="truncate font-medium">{cat}</span>
                  </span>
                  <span className="shrink-0 text-xs text-gray-400">{isCatOpen ? "▲" : "▼"}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setGroupVisibility(catList, allHidden);
                  }}
                  className="rounded p-2 text-gray-400 hover:bg-gray-700/70 hover:text-white"
                  title={allHidden ? "הצג כולם" : "הסתר כולם"}
                >
                  {allHidden ? <FaEye className="h-3.5 w-3.5" /> : <FaEyeSlash className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteGroup(catList, `קטגוריה ${cat}`);
                  }}
                  disabled={hasEditingInCategory}
                  className={`rounded p-2 ${
                    hasEditingInCategory
                      ? "cursor-not-allowed text-gray-600"
                      : "text-gray-400 hover:bg-red-900/20 hover:text-red-400"
                  }`}
                  title={
                    hasEditingInCategory
                      ? "לא ניתן למחוק קטגוריה כשישות בתוכה בעריכה"
                      : "מחק קטגוריה"
                  }
                >
                  <FaTrashAlt className="h-3.5 w-3.5" />
                </button>
              </div>

              {isCatOpen && (
                <div className="mt-1 space-y-1 border-l border-gray-700/60 ps-2">
                  {Object.entries(types).map(([type, list]) => {
                    const typeKey = `${cat}:${type}`;
                    const isTypeOpen = openAreaTypeKey === typeKey;
                    const typeCount = list.length;
                    const typeLabel = getEntityTypeLabel(type);
                    const typeAllHidden = list.length > 0 && list.every((e) => !e.visible);
                    const hasEditingInType =
                      !!editingEntityId && list.some((e) => e.id === editingEntityId);
                    return (
                      <div key={typeKey}>
                        <div className="flex items-center gap-1 overflow-hidden rounded-lg bg-gray-900/20">
                          <button
                            type="button"
                            onClick={() => setOpenAreaTypeKey(isTypeOpen ? null : typeKey)}
                            className="flex min-w-0 flex-1 items-center justify-between px-3 py-2 text-right text-sm text-gray-100 transition-colors hover:bg-gray-800/40"
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-gray-800/60 text-gray-300">
                                <EntityTypeGlyph type={type} />
                              </span>
                              <span className="inline-flex h-5 min-w-[18px] items-center justify-center rounded bg-gray-800/60 text-[11px] font-semibold text-gray-300">
                                {typeCount}
                              </span>
                              <span className="truncate">{typeLabel}</span>
                            </span>
                            <span className="shrink-0 text-xs text-gray-400">{isTypeOpen ? "▲" : "▼"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setGroupVisibility(list, typeAllHidden);
                            }}
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-800/60 hover:text-white"
                            title={typeAllHidden ? "הצג כולם" : "הסתר כולם"}
                          >
                            {typeAllHidden ? <FaEye className="h-3 w-3" /> : <FaEyeSlash className="h-3 w-3" />}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteGroup(list, `סוג ${typeLabel}`);
                            }}
                            disabled={hasEditingInType}
                            className={`rounded p-1.5 ${
                              hasEditingInType
                                ? "cursor-not-allowed text-gray-600"
                                : "text-gray-400 hover:bg-red-900/20 hover:text-red-400"
                            }`}
                            title={
                              hasEditingInType
                                ? "לא ניתן למחוק סוג כשישות בתוכו בעריכה"
                                : "מחק סוג"
                            }
                          >
                            <FaTrashAlt className="h-3 w-3" />
                          </button>
                        </div>

                        {isTypeOpen && (
                          <ul
                            className="mt-1 space-y-1.5"
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
                                  className={`group flex w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-all ${
                                    isSelected
                                      ? "border-sky-500/50 bg-sky-600/30 text-white"
                                      : "border-transparent bg-gray-700/40 text-gray-200 hover:bg-gray-600/50"
                                  } ${!entity.visible ? "opacity-60" : ""}`}
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-medium">{entity.name}</div>
                                  </div>
                                  <div
                                    className={`flex items-center gap-0.5 transition-opacity ${
                                      isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onCenterToEntity(entity);
                                      }}
                                      className="rounded p-1.5 text-gray-400 hover:bg-gray-600 hover:text-white"
                                      title="מרכז למפה"
                                    >
                                      <FaCrosshairs className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        applyVisibility(entity, !entity.visible);
                                      }}
                                      className={`rounded p-1.5 ${
                                        entity.visible
                                          ? "text-green-400 hover:bg-green-900/30"
                                          : "text-red-400 hover:bg-red-900/30"
                                      }`}
                                      title={entity.visible ? "הסתר" : "הצג"}
                                    >
                                      {entity.visible ? (
                                        <FaEye className="h-4 w-4" />
                                      ) : (
                                        <FaEyeSlash className="h-4 w-4" />
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => handleDeleteEntity(e, entity)}
                                      disabled={editingEntityId === entity.id}
                                      className={`rounded p-1.5 ${
                                        editingEntityId === entity.id
                                          ? "cursor-not-allowed text-gray-600"
                                          : "text-gray-400 hover:bg-red-900/30 hover:text-red-400"
                                      }`}
                                      title={
                                        editingEntityId === entity.id
                                          ? "לא ניתן למחוק ישות שנמצאת בעריכה"
                                          : "מחק"
                                      }
                                    >
                                      <FaTrashAlt className="h-4 w-4" />
                                    </button>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {entityOpen && selectedEntityId === entityOpen.id && (
        <div className="mt-3 rounded-lg border border-gray-600/50 bg-gray-700/30 px-3 py-2 text-sm text-gray-300">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-gray-500">נבחר: </span>
              <span className="font-medium">{entityOpen.name}</span>
              {entityOpen.category && (
                <span className="text-gray-400"> · {entityOpen.category}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => openDuplicatePanel(entityOpen)}
              className="inline-flex items-center gap-1 rounded bg-sky-700/40 px-2 py-1 text-xs text-sky-200 hover:bg-sky-600/50"
              title="שכפל ישות"
            >
              <FaCopy className="h-3 w-3" />
              שכפל
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntitiesSidebarAreasSection;
