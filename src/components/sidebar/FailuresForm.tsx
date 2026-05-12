// import { useMemo } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { selectCategories, selectFilteredFaults, setSelectedCategories, setSeverityFilter, setShowInactive, getBadge, Fault } from "../../store/slices/faultsSlice";
// import { ErrorSeverityE, ErrorStateE } from "../../enums/general.enum";
// const normalizeTs = (ts: number) => (ts < 1e12 ? ts * 1000 : ts);
// const formatTs = (ts: number, tz = "Asia/Jerusalem") =>
//   new Date(normalizeTs(ts)).toLocaleString("he-IL", { timeZone: tz });
// const sevText = (v: ErrorSeverityE) => ErrorSeverityE[v] ?? String(v);
// const stateText = (v: ErrorStateE) => ErrorStateE[v] ?? String(v);

// export default function FaultsList() {
//   const dispatch = useDispatch();
//   const categories = useSelector(selectCategories) as string[];
//   const faults = useSelector(selectFilteredFaults) as Fault[];
//   const selectedCategories = useSelector(
//     (s: any) => s.faults.filters.selectedCategories as string[]
//   );
//   const severity = useSelector(
//     (s: any) => s.faults.filters.severity as ErrorSeverityE | "ALL"
//   );
//   const showInactive = useSelector(
//     (s: any) => !!s.faults.filters.showInactive
//   );
//   const view = useMemo(
//     () =>
//       (faults ?? []).map((f) => ({
//         ...f,
//         timeText: f.lastSeen ? formatTs(f.lastSeen) : "--",
//       })),
//     [faults]
//   );

//   const toggleCategory = (cat: string) => {
//     const set = new Set(selectedCategories ?? []);
//     set.has(cat) ? set.delete(cat) : set.add(cat);
//     dispatch(setSelectedCategories(Array.from(set)));
//   };

//   return (
//     <div className="w-full max-w-[800px] text-neutral-100 rounded-xl shadow">
//       <div className="text-center border-b border-gray-600 pb-3 mb-3">
//         <h3 className="text-xl font-semibold text-white">Failures</h3>
//       </div>
//       <div className="flex flex-wrap items-center gap-3 px-2 pb-3 border-b border-gray-700">
//         <div className="flex items-center gap-2">
//           <span className="text-xs text-neutral-300">Severity:</span>
//           <select
//             className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-sm"
//             value={severity}
//             onChange={(e) => {
//               const v = e.target.value;
//               dispatch(
//                 setSeverityFilter(
//                   v === "ALL" ? "ALL" : (Number(v) as ErrorSeverityE)
//                 )
//               );
//             }}>
//             <option value="ALL">All</option>
//             <option value={ErrorSeverityE.SEVERE}>
//               {sevText(ErrorSeverityE.SEVERE)}
//             </option>
//             <option value={ErrorSeverityE.INTERMEDIATE}>
//               {sevText(ErrorSeverityE.INTERMEDIATE)}
//             </option>
//             <option value={ErrorSeverityE.WARNING}>
//               {sevText(ErrorSeverityE.WARNING)}
//             </option>
//           </select>
//         </div>
//         <label className="flex items-center gap-2 text-sm">
//           <input
//             type="checkbox"
//             checked={showInactive}
//             onChange={(e) => dispatch(setShowInactive(e.target.checked))}
//           />
//           Show Inactive
//         </label>
//       </div>
//       <div className="px-2 py-3 border-b border-gray-700">
//         <div className="flex items-center justify-between">
//           <div className="text-xs text-neutral-300">Categories:</div>
//         </div>
//         <div className="flex flex-wrap gap-2 pt-2">
//           {categories.map((cat) => {
//             const isOn =
//               selectedCategories.length === 0 ||
//               selectedCategories.includes(cat);
//             return (
//               <button
//                 key={cat}
//                 onClick={() => toggleCategory(cat)}
//                 className={
//                   "text-xs px-2 py-1 rounded border " +
//                   (isOn ? "bg-neutral-800 border-neutral-600 text-white" : "bg-neutral-900 border-neutral-800 text-neutral-400")}>
//                 {cat}
//               </button>
//             );
//           })}
//         </div>
//       </div>

//       <div className="space-y-2 max-h-[60vh] overflow-auto pr-1 px-2 py-3">
//         {view.map((f) => {
//           const badge = getBadge(f);
//           const badgeClass =
//             "absolute -top-3 -left-0 text-xs font-bold px-2 py-0.3 rounded-full border " +
//             (badge.color === "cyan" ? "bg-cyan-700/30 border-cyan-500 text-cyan-200" :
//               badge.color === "amber" ? "bg-amber-700/30 border-amber-500 text-amber-200" :
//                 "bg-neutral-700/50 border-neutral-500 text-neutral-300");
//           const sevColor = f.severity === ErrorSeverityE.SEVERE ? "text-red-400" : f.severity === ErrorSeverityE.INTERMEDIATE ? "text-yellow-300" : "text-neutral-200";
//           const inactiveStyle = badge.label === "INACTIVE" ? "line-through opacity-70" : "";
//           return (
//             <div
//               key={f.id}
//               className="relative bg-[#1f2937d6] rounded-lg px-5 py-3 border border-neutral-500">
//               <span className={badgeClass}>{badge.label}</span>
//               <div className="flex items-start justify-between gap-3">
//                 <div className="flex-1 min-w-0">
//                   <div
//                     className={"text-sm font-semibold break-words " + sevColor + " " + inactiveStyle}>
//                     [{f.category}]  {f.description}
//                   </div>
//                   <div className="text-xs text-neutral-400 pt-1 ">
//                     Severity: {sevText(f.severity)} | State:{" "}
//                     {stateText(f.state)} | LastSeen: {f.timeText}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//         {view.length === 0 && (
//           <div className="text-sm text-neutral-400 px-2 py-8 text-center">
//             אין תקלות לפי הפילטר הנוכחי
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }


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
      <div className="flex items-center justify-between px-4 ml-2 py-3 border-b border-white/10 bg-slate-900/95">
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








