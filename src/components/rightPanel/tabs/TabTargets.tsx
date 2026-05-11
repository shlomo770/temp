import React, { useMemo, useState, MutableRefObject } from "react";
import { useAppSelector } from "../../../hooks/useAppSelector";
import { useAppDispatch } from "../../../hooks/useAppDispatch";
import { Target, sortByType } from "../../../store/slices/targetsSlice";
import { CONTENT, SECTION, SECTION_TITLE } from "../panelStyles";

const COLUMNS = [
  { id: "id" as const, label: "ID" },
  { id: "type" as const, label: "Type" },
  { id: "status" as const, label: "Status" },
  { id: "speed" as const, label: "Speed" },
  { id: "alt" as const, label: "Alt" },
  { id: "action" as const, label: "Action" },
];

type SortKey = "id" | "type" | "status" | "speed" | "alt";
type ColId = (typeof COLUMNS)[number]["id"];

const defaultVisible: Record<ColId, boolean> = {
  id: true,
  type: true,
  status: true,
  speed: true,
  alt: true,
  action: true,
};

interface TabTargetsProps {
  mapServiceRef: MutableRefObject<any>;
  onAttackTarget: (targetId: string) => void;
  onAbortTarget: (targetId: string) => void;
}

function shouldAbort(target: Target) {
  return (
    target.status === "allocated" ||
    target.status === "designated" ||
    target.status === "track" ||
    target.status === "arm"
  );
}

export function TabTargets({
  mapServiceRef,
  onAttackTarget,
  onAbortTarget,
}: TabTargetsProps) {
  const dispatch = useAppDispatch();
  const targetsState = useAppSelector((state) => state.targets);
  const targets = useMemo(
    () =>
      targetsState.allIds
        .map((id) => targetsState.byId[id])
        .filter(Boolean) as Target[],
    [targetsState.allIds, targetsState.byId]
  );

  const [visibleColumns, setVisibleColumns] =
    useState<Record<ColId, boolean>>(defaultVisible);
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  const toggleColumn = (col: ColId) => {
    setVisibleColumns((prev) => ({ ...prev, [col]: !prev[col] }));
  };

  const sortedTargets = useMemo(() => {
    const copy = [...targets];
    const getAlt = (t: Target) => Number(t.coordinates?.alt ?? 0);
    const getSpeed = (t: Target) => Number(t.speed ?? 0);
    copy.sort((a, b) => {
      let v = 0;
      if (sortKey === "id") v = String(a.id).localeCompare(String(b.id));
      if (sortKey === "type") v = String(a.type).localeCompare(String(b.type));
      if (sortKey === "status")
        v = String(a.status).localeCompare(String(b.status));
      if (sortKey === "speed") v = getSpeed(a) - getSpeed(b);
      if (sortKey === "alt") v = getAlt(a) - getAlt(b);
      return sortDir === "asc" ? v : -v;
    });
    return copy;
  }, [targets, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((p) => (p === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortArrow = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  const handleCenterTarget = (targetId: string) => {
    const target = targets.find((t) => t.id === targetId);
    if (!target || !mapServiceRef.current) return;
    const map = mapServiceRef.current.getMap();
    if (map) {
      map.flyTo({
        center: [target.coordinates.lng, target.coordinates.lat],
        zoom: 14,
        duration: 1000,
      });
    }
  };

  return (
    <div className={CONTENT}>
      <div className={SECTION}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className={SECTION_TITLE}>Targets ({targets.length})</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => dispatch(sortByType())}
              className="text-[9px] uppercase tracking-wider text-white/50 hover:text-white/80 px-2 py-1 rounded border border-white/10"
            >
              Sort by type
            </button>
            <button
              type="button"
              onClick={() => setShowColumnPicker(!showColumnPicker)}
              className="text-[9px] uppercase tracking-wider text-white/50 hover:text-white/80 px-2 py-1 rounded border border-white/10"
              title="Show / hide columns"
            >
              Columns
            </button>
          </div>
        </div>

        {showColumnPicker && (
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 pt-1.5 border-t border-white/[0.06]">
            {COLUMNS.map(({ id, label }) => (
              <label
                key={id}
                className="flex items-center gap-1.5 cursor-pointer text-[10px] text-white/70"
              >
                <input
                  type="checkbox"
                  checked={visibleColumns[id]}
                  onChange={() => toggleColumn(id)}
                  className="accent-emerald-500 w-3 h-3 rounded"
                />
                {label}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className={`${SECTION} flex-1 min-h-0 flex flex-col p-0 overflow-hidden`}>
        <div className="flex-1 overflow-auto scrollbar-modern min-h-[120px]">
          <table className="w-full text-[10px] text-white/90 border-collapse">
            <thead className="sticky top-0 bg-slate-800/95 text-white/70 z-[1]">
              <tr>
                {COLUMNS.filter((c) => visibleColumns[c.id]).map(({ id, label }) => (
                  <th
                    key={id}
                    className="px-2 py-1.5 text-left font-medium border-b border-white/[0.06] whitespace-nowrap"
                  >
                    {id !== "action" ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(id as SortKey)}
                        className="hover:text-white"
                      >
                        {label}
                        {sortArrow(id as SortKey)}
                      </button>
                    ) : (
                      label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedTargets.map((target) => {
                const showAbort = shouldAbort(target);
                return (
                  <tr
                    key={target.id}
                    className="border-b border-white/[0.04] hover:bg-white/[0.05] cursor-pointer"
                    onClick={() => handleCenterTarget(target.id)}
                  >
                    {visibleColumns.id && (
                      <td className="px-2 py-1 font-mono truncate max-w-[72px]">
                        {target.id}
                      </td>
                    )}
                    {visibleColumns.type && (
                      <td className="px-2 py-1 truncate max-w-[56px]">
                        {target.type}
                      </td>
                    )}
                    {visibleColumns.status && (
                      <td className="px-2 py-1 truncate max-w-[56px]">
                        {target.status}
                      </td>
                    )}
                    {visibleColumns.speed && (
                      <td className="px-2 py-1">{target.speed ?? "–"}</td>
                    )}
                    {visibleColumns.alt && (
                      <td className="px-2 py-1">
                        {target.coordinates?.alt ?? "–"}
                      </td>
                    )}
                    {visibleColumns.action && (
                      <td className="px-2 py-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                            showAbort
                              ? "bg-rose-600/80 hover:bg-rose-500/80"
                              : "bg-emerald-600/80 hover:bg-emerald-500/80"
                          } text-white`}
                          onClick={() =>
                            showAbort
                              ? onAbortTarget(target.id)
                              : onAttackTarget(target.id)
                          }
                        >
                          {showAbort ? "Abort" : "Assign"}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {targets.length === 0 && (
            <div className="text-[10px] text-white/40 py-4 text-center">
              No targets
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
