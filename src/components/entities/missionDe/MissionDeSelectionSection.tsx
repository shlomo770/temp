import React, { FC } from "react";
import {
  FaPlus,
  FaCrosshairs,
  FaFilter,
  FaChevronLeft,
  FaListUl,
} from "react-icons/fa";
import { MISSION_DE_TABS } from "../../../constants/entityCategories";
import { MISSION_DE_FILTER_ALL } from "../../../enums/entityCategory.enum";
import type { Entity } from "../../../store/slices/entitiesSlice";
import type { DisplayFilter } from "./MissionDePanelTypes";
import { btn, btnEmerald, btnRose, btnSky, inp, section, sel } from "./missionDePanelStyles";

export type MissionDeSelectionSectionProps = {
  selectionOpen: boolean;
  onToggleSelectionOpen: () => void;
  displayFilter: DisplayFilter;
  onDisplayFilterChange: (f: DisplayFilter) => void;
  searchQ: string;
  onSearchQChange: (q: string) => void;
  onNewClick: () => void;
  canAdd: boolean;
  canRemove: boolean;
  onAddSelected: () => void;
  onRemoveSelected: () => void;
  onSelectAllInView: () => void;
  onClearSelection: () => void;
  selectedCount: number;
  filterLabel: string;
  tableRows: Entity[];
  memberSet: Set<string>;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onCenterToEntity: (e: Entity) => void;
};

const MissionDeSelectionSection: FC<MissionDeSelectionSectionProps> = ({
  selectionOpen,
  onToggleSelectionOpen,
  displayFilter,
  onDisplayFilterChange,
  searchQ,
  onSearchQChange,
  onNewClick,
  canAdd,
  canRemove,
  onAddSelected,
  onRemoveSelected,
  onSelectAllInView,
  onClearSelection,
  selectedCount,
  filterLabel,
  tableRows,
  memberSet,
  selectedIds,
  onToggleSelect,
  onCenterToEntity,
}) => (
  <div className={section}>
    <button
      type="button"
      onClick={onToggleSelectionOpen}
      className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-start transition ${
        selectionOpen
          ? "border-sky-500/35 bg-sky-950/25 shadow-inner shadow-sky-950/20 ring-1 ring-sky-500/20"
          : "border-zinc-600/60 bg-zinc-950/70 hover:border-zinc-500/70 hover:bg-zinc-900/80"
      }`}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/12 text-violet-300 ring-1 ring-violet-500/20">
          <FaListUl className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block text-[12px] font-semibold text-zinc-100">בחירה מהמערכת</span>
          <span className="mt-0.5 block text-[10px] text-zinc-500">סינון · חיפוש · לחיצה על שורה</span>
        </span>
      </span>
      <FaChevronLeft
        className={`h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform duration-200 ${selectionOpen ? "-rotate-90 text-sky-400" : ""}`}
        aria-hidden
      />
    </button>

    {selectionOpen ? (
      <div className="mt-3 space-y-3 border-t border-zinc-700/50 pt-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex min-w-[120px] max-w-[160px] flex-1 flex-col gap-1">
            <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              <FaFilter className="h-2.5 w-2.5 text-sky-400/90" aria-hidden />
              קטגוריה
            </span>
            <select
              className={sel}
              value={displayFilter}
              onChange={(e) => onDisplayFilterChange(e.target.value as DisplayFilter)}
            >
              <option value={MISSION_DE_FILTER_ALL}>הכל</option>
              {MISSION_DE_TABS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[100px] flex-[2] flex-col gap-1">
            <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">חיפוש</span>
            <input
              type="search"
              className={inp}
              placeholder="שם, סוג או קטגוריה…"
              value={searchQ}
              onChange={(e) => onSearchQChange(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" className={btnSky} onClick={onNewClick}>
            <FaPlus className="inline h-3 w-3 opacity-90" aria-hidden /> חדש
          </button>
          <button type="button" className={btnEmerald} disabled={!canAdd} onClick={onAddSelected}>
            הוסף למשימה
          </button>
          <button type="button" className={btnRose} disabled={!canRemove} onClick={onRemoveSelected}>
            הסר מהמשימה
          </button>
          <button type="button" className={btn} onClick={onSelectAllInView}>
            כל התצוגה
          </button>
          <button type="button" className={btn} onClick={onClearSelection} disabled={selectedCount === 0}>
            נקה ({selectedCount})
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-500">
          <span className="rounded-md bg-zinc-800/70 px-2 py-0.5 font-medium text-zinc-300 ring-1 ring-zinc-600/45">
            {filterLabel}
          </span>
          <span className="text-zinc-600">·</span>
          <span>{tableRows.length} שורות</span>
          <span className="text-zinc-600">·</span>
          <span className={selectedCount > 0 ? "font-medium text-sky-400/95" : ""}>
            נבחרו {selectedCount}
          </span>
        </div>
        <div className="max-h-[min(240px,38vh)] overflow-auto rounded-xl border border-zinc-700/50 bg-zinc-950/50 shadow-inner shadow-black/25 ring-1 ring-white/[0.03]">
          <table className="w-full border-collapse text-[11px]">
            <thead className="sticky top-0 z-[1] border-b border-zinc-700/60 bg-zinc-900/95 backdrop-blur-sm">
              <tr className="text-[9px] font-semibold uppercase tracking-wide text-zinc-500">
                <th className="w-8 px-2 py-2 text-center font-medium">#</th>
                <th className="px-2 py-2 text-right font-medium">שם</th>
                <th className="w-14 px-1 py-2 text-center font-medium">סוג</th>
                <th className="w-[4.5rem] px-1 py-2 text-right font-medium">קטגוריה</th>
                <th className="w-9 px-1 py-2 text-center font-medium">מפה</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center">
                    <p className="text-[11px] font-medium text-zinc-500">ללא תוצאות</p>
                    <p className="mt-1 text-[10px] text-zinc-600">נסו לשנות סינון או את מילות החיפוש</p>
                  </td>
                </tr>
              ) : (
                tableRows.map((e, idx) => {
                  const inM = memberSet.has(e.id);
                  const selRow = selectedIds.has(e.id);
                  return (
                    <tr
                      key={e.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onToggleSelect(e.id)}
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter" || ev.key === " ") {
                          ev.preventDefault();
                          onToggleSelect(e.id);
                        }
                      }}
                      className={`cursor-pointer border-b border-zinc-800/60 transition-colors last:border-b-0 ${
                        selRow
                          ? "bg-sky-950/50 ring-1 ring-inset ring-sky-500/35"
                          : inM
                            ? "bg-emerald-950/20 hover:bg-emerald-950/30"
                            : "hover:bg-zinc-800/40"
                      }`}
                    >
                      <td className="px-2 py-1.5 text-center tabular-nums text-zinc-500">{idx + 1}</td>
                      <td className="max-w-[1px] px-2 py-1.5">
                        <span className="flex items-center gap-1.5">
                          {inM ? (
                            <span className="shrink-0 rounded-md bg-emerald-900/55 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-emerald-300 ring-1 ring-emerald-700/40">
                              במשימה
                            </span>
                          ) : null}
                          <span className="truncate font-medium text-zinc-50">{e.name}</span>
                        </span>
                      </td>
                      <td className="px-1 py-1.5 text-center">
                        <span className="inline-block rounded-md bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300 ring-1 ring-zinc-700/50">
                          {e.type}
                        </span>
                      </td>
                      <td className="truncate px-1 py-1.5 text-[10px] text-zinc-400">{e.category || "—"}</td>
                      <td className="px-1 py-1 text-center">
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-zinc-500 transition hover:border-zinc-600 hover:bg-zinc-800 hover:text-white"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            onCenterToEntity(e);
                          }}
                        >
                          <FaCrosshairs className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    ) : null}
  </div>
);

export default MissionDeSelectionSection;
