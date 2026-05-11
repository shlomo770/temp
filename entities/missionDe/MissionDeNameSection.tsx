import React, { FC } from "react";
import { inp, section } from "./missionDePanelStyles";

export type MissionDeNameSectionProps = {
  editMissionName: string;
  onEditChange: (v: string) => void;
  onCommitRename: () => void;
  onEnterBlur: (el: HTMLInputElement) => void;
};

const MissionDeNameSection: FC<MissionDeNameSectionProps> = ({
  editMissionName,
  onEditChange,
  onCommitRename,
  onEnterBlur,
}) => (
  <div className={section}>
    <label className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold tracking-wide text-zinc-300">
      <span
        className="h-1.5 w-1.5 rounded-full bg-sky-400/90 shadow-[0_0_8px_rgba(56,189,248,0.45)]"
        aria-hidden
      />
      שם משימה
    </label>
    <input
      type="text"
      value={editMissionName}
      onChange={(e) => onEditChange(e.target.value)}
      onBlur={onCommitRename}
      onKeyDown={(e) => {
        if (e.key === "Enter") onEnterBlur(e.target as HTMLInputElement);
      }}
      className={inp}
      autoComplete="off"
    />
  </div>
);

export default MissionDeNameSection;
