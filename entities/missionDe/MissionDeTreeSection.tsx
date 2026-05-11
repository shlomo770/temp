import React, { FC } from "react";
import { FaClipboardList, FaCrosshairs, FaInbox, FaTrashAlt } from "react-icons/fa";
import { MISSION_DE_TABS } from "../../../constants/entityCategories";
import type { Entity } from "../../../store/slices/entitiesSlice";
import { section } from "./missionDePanelStyles";

export type MissionDeTreeSectionProps = {
  memberIds: string[];
  missionTreeBuckets: Record<string, Entity[]>;
  otherCount: number;
  treeSelectedIds: Set<string>;
  onToggleTreeSelect: (id: string) => void;
  onClearTreeSelection: () => void;
  onDeleteTreeSelected: () => void;
  onRemoveOne: (id: string) => void;
  onCenterToEntity: (e: Entity) => void;
};

const MissionDeTreeSection: FC<MissionDeTreeSectionProps> = ({
  memberIds,
  missionTreeBuckets,
  otherCount,
  treeSelectedIds,
  onToggleTreeSelect,
  onClearTreeSelection,
  onDeleteTreeSelected,
  onRemoveOne,
  onCenterToEntity,
}) => (
  <div className={section}>
    <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
      <div className="flex min-w-0 flex-1 items-start gap-2.5">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/12 text-sky-400 shadow-inner shadow-sky-950/30 ring-1 ring-sky-500/15">
          <FaClipboardList className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <span className="block text-[11px] font-semibold text-zinc-100">במשימה</span>
          <span className="mt-0.5 block text-[10px] leading-snug text-zinc-500">
            לפי קטגוריה · לחיצה על שורה לבחירה
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="rounded-full bg-zinc-800/90 px-2.5 py-1 text-[10px] font-medium tabular-nums text-zinc-300 ring-1 ring-zinc-600/50">
          {memberIds.length} סה״כ
        </span>
        {treeSelectedIds.size > 0 ? (
          <>
            <span className="rounded-full bg-sky-950/70 px-2 py-1 text-[10px] font-medium text-sky-300 ring-1 ring-sky-500/25">
              נבחרו {treeSelectedIds.size}
            </span>
            <button
              type="button"
              title="הסר מהמשימה את הנבחרים"
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-gradient-to-b from-rose-950/70 to-rose-950 px-2.5 py-1 text-[10px] font-semibold text-rose-50 shadow-sm transition hover:from-rose-900/80 hover:to-rose-950 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
              disabled={treeSelectedIds.size === 0}
              onClick={onDeleteTreeSelected}
            >
              <FaTrashAlt className="h-3 w-3" aria-hidden />
              מחיקה
            </button>
            <button
              type="button"
              className="rounded-lg px-2 py-1 text-[10px] font-medium text-zinc-400 transition hover:bg-zinc-800/90 hover:text-zinc-200"
              onClick={onClearTreeSelection}
            >
              נקה בחירה
            </button>
          </>
        ) : null}
      </div>
    </div>
    <div className="max-h-[min(220px,32vh)] space-y-1.5 overflow-y-auto rounded-xl border border-zinc-700/50 bg-zinc-950/60 p-2 shadow-inner shadow-black/20">
      {memberIds.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700/60 bg-zinc-900/40 px-4 py-8 text-center">
          <FaInbox className="h-8 w-8 text-zinc-600" aria-hidden />
          <p className="text-[11px] font-medium text-zinc-400">אין ישויות במשימה</p>
          <p className="max-w-[14rem] text-[10px] leading-relaxed text-zinc-600">
            פתחו את «בחירה» למטה והוסיפו ישויות מהמערכת
          </p>
        </div>
      ) : (
        <>
          {MISSION_DE_TABS.filter((tab) => (missionTreeBuckets[tab.id] ?? []).length > 0).map(
            (tab) => {
              const items = missionTreeBuckets[tab.id] ?? [];
              return (
                <details
                  key={tab.id}
                  open
                  className="overflow-hidden rounded-xl border border-zinc-700/40 bg-zinc-900/45 shadow-sm transition hover:border-zinc-600/50"
                >
                  <summary className="cursor-pointer list-none px-2.5 py-2 text-[11px] font-semibold text-sky-300 transition hover:bg-zinc-800/40 [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate">{tab.label}</span>
                      <span className="shrink-0 rounded-md bg-zinc-800/90 px-1.5 py-0.5 text-[10px] font-normal tabular-nums text-zinc-400 ring-1 ring-zinc-600/40">
                        {items.length}
                      </span>
                    </span>
                  </summary>
                  <ul className="space-y-1 border-t border-zinc-800/70 bg-zinc-950/30 px-2 pb-2 pt-2">
                    {items.map((e) => {
                      const sel = treeSelectedIds.has(e.id);
                      return (
                        <li
                          key={e.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => onToggleTreeSelect(e.id)}
                          onKeyDown={(ev) => {
                            if (ev.key === "Enter" || ev.key === " ") {
                              ev.preventDefault();
                              onToggleTreeSelect(e.id);
                            }
                          }}
                          className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] transition ${
                            sel
                              ? "bg-sky-950/60 ring-1 ring-inset ring-sky-500/40 shadow-sm shadow-sky-950/20"
                              : "hover:bg-zinc-800/55"
                          }`}
                        >
                          <span className="min-w-0 flex-1 truncate font-medium text-zinc-100" title={e.name}>
                            {e.name}
                          </span>
                          <span className="shrink-0 rounded-md bg-zinc-800/80 px-1.5 py-0.5 text-[9px] font-medium text-zinc-400 ring-1 ring-zinc-700/60">
                            {e.type}
                          </span>
                          <button
                            type="button"
                            title="הסר מהמשימה"
                            className="shrink-0 rounded-md px-1.5 text-[11px] font-medium text-rose-400/95 transition hover:bg-rose-950/50 hover:text-rose-300"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              onRemoveOne(e.id);
                            }}
                          >
                            ×
                          </button>
                          <button
                            type="button"
                            title="מפה"
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-600/50 bg-zinc-900/80 text-zinc-400 transition hover:border-sky-500/35 hover:bg-sky-950/40 hover:text-sky-300"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              onCenterToEntity(e);
                            }}
                          >
                            <FaCrosshairs className="h-3 w-3" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </details>
              );
            }
          )}
          {otherCount > 0 ? (
            <details
              open
              className="overflow-hidden rounded-xl border border-amber-600/25 bg-gradient-to-br from-amber-950/25 to-zinc-950/40 shadow-sm ring-1 ring-amber-700/15"
            >
              <summary className="cursor-pointer list-none px-2.5 py-2 text-[11px] font-semibold text-amber-300/95 [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-2">
                  <span>אחר</span>
                  <span className="shrink-0 rounded-md bg-amber-950/50 px-1.5 py-0.5 text-[10px] font-normal tabular-nums text-amber-200/90 ring-1 ring-amber-700/35">
                    {otherCount}
                  </span>
                </span>
              </summary>
              <ul className="space-y-1 border-t border-amber-900/25 bg-zinc-950/35 px-2 pb-2 pt-2">
                {(missionTreeBuckets.OTHER ?? []).map((e) => {
                  const sel = treeSelectedIds.has(e.id);
                  return (
                    <li
                      key={e.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onToggleTreeSelect(e.id)}
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter" || ev.key === " ") {
                          ev.preventDefault();
                          onToggleTreeSelect(e.id);
                        }
                      }}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] transition ${
                        sel
                          ? "bg-sky-950/55 ring-1 ring-inset ring-sky-500/40"
                          : "hover:bg-zinc-800/55"
                      }`}
                    >
                      <span className="min-w-0 flex-1 truncate font-medium text-zinc-100">{e.name}</span>
                      <span className="shrink-0 rounded-md bg-amber-950/35 px-1.5 py-0.5 text-[9px] text-amber-200/85 ring-1 ring-amber-800/40">
                        {e.category || "?"}
                      </span>
                      <button
                        type="button"
                        className="shrink-0 rounded-md px-1.5 text-[11px] font-medium text-rose-400/95 transition hover:bg-rose-950/50"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onRemoveOne(e.id);
                        }}
                      >
                        ×
                      </button>
                      <button
                        type="button"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-600/50 bg-zinc-900/80 text-zinc-400 transition hover:border-amber-500/35 hover:bg-amber-950/30 hover:text-amber-200"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onCenterToEntity(e);
                        }}
                      >
                        <FaCrosshairs className="h-3 w-3" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </details>
          ) : null}
        </>
      )}
    </div>
  </div>
);

export default MissionDeTreeSection;
