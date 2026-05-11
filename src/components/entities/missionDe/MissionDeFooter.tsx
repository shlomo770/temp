import React, { FC } from "react";
import { btn, btnSky } from "./missionDePanelStyles";

export type MissionDeFooterProps = {
  onSaveMissionServer: () => void;
  onOpenMissionSaveCopy: () => void;
};

const MissionDeFooter: FC<MissionDeFooterProps> = ({
  onSaveMissionServer,
  onOpenMissionSaveCopy,
}) => (
  <div className="flex flex-wrap gap-2 border-t border-zinc-700/50 pt-3">
    <button type="button" onClick={onSaveMissionServer} className={`${btnSky} px-4 py-2`}>
      שמור לשרת
    </button>
    <button
      type="button"
      onClick={onOpenMissionSaveCopy}
      className={`${btn} border-violet-500/35 bg-gradient-to-b from-violet-950/55 to-violet-950/75 px-4 py-2 text-violet-100 shadow-sm ring-1 ring-violet-500/15 hover:from-violet-900/60`}
    >
      שמור עותק למשימה
    </button>
  </div>
);

export default MissionDeFooter;
