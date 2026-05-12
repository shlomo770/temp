import React, { FC } from "react";
import { FaChevronDown, FaTimes } from "react-icons/fa";
import MissionDePanel, { type MissionDePanelProps } from "./MissionDePanel";

export type MissionFormPanelProps = MissionDePanelProps & {
  onClose: () => void;
  missionNames: string[];
  onMissionSwitch: (missionName: string) => void;
};

const MissionFormPanel: FC<MissionFormPanelProps> = ({
  onClose,
  missionNames,
  onMissionSwitch,
  onSaveMissionServer,
  onOpenMissionSaveCopy,
  ...panel
}) => {
  return (
    <div
      className="fixed left-3 top-[68px] z-[1000] flex max-h-[calc(100vh-76px)] w-[min(380px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-zinc-700/55 bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900 shadow-2xl shadow-black/50 ring-1 ring-white/[0.06]"
      role="dialog"
      aria-labelledby="mission-form-title"
    >
      <header className="flex shrink-0 items-center gap-2.5 border-b border-zinc-700/55 bg-gradient-to-l from-sky-950/25 to-zinc-900/95 px-3 py-2.5 backdrop-blur-sm">
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-zinc-600/70 bg-zinc-950/50 text-zinc-400 shadow-sm transition hover:border-zinc-500 hover:bg-zinc-800 hover:text-white active:scale-[0.97]"
          aria-label="סגור"
        >
          <FaTimes className="h-3.5 w-3.5" />
        </button>
        <h2
          id="mission-form-title"
          className="min-w-0 flex-1 truncate text-[14px] font-semibold tracking-tight text-zinc-50"
        >
          משימה
        </h2>
        <div className="relative max-w-[140px] shrink-0">
          <select
            className="w-full appearance-none rounded-xl border border-zinc-600/70 bg-zinc-950/90 py-1.5 ps-8 pe-2 text-[11px] font-medium text-zinc-100 shadow-inner outline-none transition focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20"
            value={panel.missionName}
            onChange={(e) => onMissionSwitch(e.target.value)}
          >
            {missionNames.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <FaChevronDown className="pointer-events-none absolute start-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-500" />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-zinc-950/80 px-3 py-3">
        <MissionDePanel
          {...panel}
          onSaveMissionServer={onSaveMissionServer}
          onOpenMissionSaveCopy={onOpenMissionSaveCopy}
          showFooter={false}
        />
      </div>

      <footer className="flex shrink-0 justify-end gap-2 border-t border-zinc-700/55 bg-zinc-900/95 px-3 py-2.5 backdrop-blur-sm">
        <button
          type="button"
          onClick={onOpenMissionSaveCopy}
          className="rounded-xl border border-violet-500/35 bg-gradient-to-b from-violet-950/60 to-violet-950 px-3 py-1.5 text-[11px] font-semibold text-violet-100 shadow-sm ring-1 ring-violet-500/15 transition hover:from-violet-900/55 active:scale-[0.98]"
        >
          שמור עותק למשימה
        </button>
        <button
          type="button"
          onClick={onSaveMissionServer}
          className="rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 px-4 py-1.5 text-[11px] font-semibold text-white shadow-md shadow-emerald-950/40 transition hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.98]"
        >
          שמור לשרת
        </button>
      </footer>
    </div>
  );
};

export default MissionFormPanel;
