import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectCategories,
  selectFilteredFaults,
  setSelectedCategories,
  setSeverityFilter,
  setShowInactive,
  getBadge,
  Fault,
} from "../../store/slices/faultsSlice";
import { ErrorSeverityE, ErrorStateE } from "../../enums/general.enum";

const normalizeTs = (ts: number) => (ts < 1e12 ? ts * 1000 : ts);
const formatTs = (ts: number, tz = "Asia/Jerusalem") =>
  new Date(normalizeTs(ts)).toLocaleString("he-IL", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
const sevText = (v: ErrorSeverityE) => ErrorSeverityE[v] ?? String(v);
const stateText = (v: ErrorStateE) => ErrorStateE[v] ?? String(v);

export default function FaultsList() {
  const dispatch = useDispatch();
  const categories = useSelector(selectCategories) as string[];
  const faults = useSelector(selectFilteredFaults) as Fault[];
  const selectedCategories = useSelector(
    (s: any) => s.faults.filters.selectedCategories as string[]
  );
  const severity = useSelector(
    (s: any) => s.faults.filters.severity as ErrorSeverityE | "ALL"
  );
  const showInactive = useSelector(
    (s: any) => !!s.faults.filters.showInactive
  );

  const view = useMemo(
    () =>
      (faults ?? []).map((f) => ({
        ...f,
        timeText: f.lastSeen ? formatTs(f.lastSeen) : "--",
      })),
    [faults]
  );

  const toggleCategory = (cat: string) => {
    const set = new Set(selectedCategories ?? []);
    set.has(cat) ? set.delete(cat) : set.add(cat);
    dispatch(setSelectedCategories(Array.from(set)));
  };

  const sevPillClass = (sev: ErrorSeverityE) => {
    switch (sev) {
      case ErrorSeverityE.SEVERE:
        return "bg-red-500/20 text-red-300 border-red-500/60";
      case ErrorSeverityE.INTERMEDIATE:
        return "bg-amber-500/15 text-amber-200 border-amber-400/60";
      case ErrorSeverityE.WARNING:
      default:
        return "bg-cyan-500/15 text-cyan-200 border-cyan-400/60";
    }
  };

  const stateDotClass = (state: ErrorStateE) => {
    if (state === ErrorStateE.EXISTS || state === ErrorStateE.REPEATED)
      return "bg-red-400";
    return "bg-neutral-500";
  };

  return (
    <div className="w-full max-w-[900px] h-full text-neutral-100 rounded-2xl bg-slate-900/90 border border-white/10 shadow-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-900/95">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
          <h3 className="text-sm font-semibold tracking-[0.16em] uppercase text-white/80">
            Failures monitor
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-white/60">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            <span>Critical</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-300" />
            <span>Intermediate</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-cyan-300" />
            <span>Warning</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-2.5 border-b border-white/8 bg-slate-900/80 flex flex-wrap items-center gap-3 text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="text-white/60">Severity</span>
          <select
            className="bg-slate-900 border border-white/15 rounded-md px-2 py-1 text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-emerald-400/60"
            value={severity}
            onChange={(e) => {
              const v = e.target.value;
              dispatch(
                setSeverityFilter(
                  v === "ALL" ? "ALL" : (Number(v) as ErrorSeverityE)
                )
              );
            }}
          >
            <option value="ALL">All</option>
            <option value={ErrorSeverityE.SEVERE}>
              {sevText(ErrorSeverityE.SEVERE)}
            </option>
            <option value={ErrorSeverityE.INTERMEDIATE}>
              {sevText(ErrorSeverityE.INTERMEDIATE)}
            </option>
            <option value={ErrorSeverityE.WARNING}>
              {sevText(ErrorSeverityE.WARNING)}
            </option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/60">Categories</span>
          <div className="flex flex-wrap gap-1.5 max-w-[420px]">
            {categories.map((cat) => {
              const isOn =
                selectedCategories.length === 0 ||
                selectedCategories.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={
                    "px-2 py-0.5 rounded-full border text-[11px] transition " +
                    (isOn
                      ? "bg-emerald-500/10 border-emerald-400/60 text-emerald-100"
                      : "bg-slate-800/60 border-white/10 text-white/45 hover:text-white/80")
                  }
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
        <label className="flex items-center gap-1.5 ml-auto text-[11px] text-white/65">
          <input
            type="checkbox"
            className="w-3 h-3 rounded border border-white/40 bg-black/40"
            checked={showInactive}
            onChange={(e) => dispatch(setShowInactive(e.target.checked))}
          />
          Show inactive
        </label>
      </div>

      {/* Table header */}
      <div className="px-3 pt-2 pb-1 text-[11px] text-white/45 border-b border-white/8 bg-slate-900/70">
        <div className="grid grid-cols-[auto,4rem,5rem,1fr,7rem] gap-2 items-center">
          <span className="pl-1">Cat / Code</span>
          <span>Severity</span>
          <span>Status</span>
          <span>Description</span>
          <span className="text-right">Last seen</span>
        </div>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-auto px-2 py-2 space-y-1.5">
        {view.map((f) => {
          const badge = getBadge(f);
          const sevPill = sevPillClass(f.severity);
          const isInactive = badge.label === "INACTIVE";
          const rowOpacity = isInactive ? "opacity-60" : "";

          return (
            <div
              key={f.id}
              className={
                "rounded-lg border border-white/10 bg-slate-900/80 px-2.5 py-1.5 text-[11px] flex items-center gap-2 hover:border-emerald-400/50 hover:bg-slate-800/80 transition " +
                rowOpacity
              }
            >
              <div className="flex items-center gap-1 w-[110px] shrink-0">
                <span
                  className={
                    "h-2.5 w-2.5 rounded-full " + stateDotClass(f.state)
                  }
                />
                <span className="font-mono text-white/80 truncate max-w-[68px]">
                  {f.category}
                </span>
                <span className="font-mono text-white/55 text-[10px]">
                  #{f.code}
                </span>
              </div>

              <div
                className={
                  "px-1.5 py-0.5 rounded-full border text-[10px] font-semibold capitalize text-center w-[64px] shrink-0 " +
                  sevPill
                }
              >
                {sevText(f.severity).toLowerCase()}
              </div>

              <div className="w-[72px] shrink-0 flex items-center gap-1 text-[10px] text-white/70">
                <span
                  className={
                    "inline-flex px-1.5 py-0.5 rounded-full border border-white/15 bg-white/5"
                  }
                >
                  {stateText(f.state)}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-white truncate">
                  {f.description}
                </div>
                <div className="text-[10px] text-white/45 truncate">
                  {badge.label}
                </div>
              </div>

              <div className="w-[88px] text-right text-[10px] text-white/55 font-mono shrink-0">
                {f.timeText}
              </div>
            </div>
          );
        })}

        {view.length === 0 && (
          <div className="text-sm text-neutral-400 px-2 py-8 text-center">
            אין תקלות לפי הפילטר הנוכחי
          </div>
        )}
      </div>
    </div>
  );
}






