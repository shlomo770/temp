import React, { FC } from "react";

export type EntitiesSidebarHomeProps = {
  onOpenMissions: () => void;
  onOpenAreas: () => void;
  onOpenPoints: () => void;
};

const EntitiesSidebarHome: FC<EntitiesSidebarHomeProps> = ({
  onOpenMissions,
  onOpenAreas,
  onOpenPoints,
}) => (
  <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
    <button
      type="button"
      onClick={onOpenMissions}
      className="flex w-full items-center gap-3 rounded-lg bg-gray-700/50 px-4 py-3 text-left text-white transition-colors hover:bg-gray-600/50"
    >
      <img src="./icons/task_512.png" alt="" className="h-8 w-8 opacity-90" />
      <div className="flex flex-col">
        <span className="font-medium">Missions</span>
        <span className="text-xs text-gray-400">שמירה</span>
      </div>
    </button>
    <button
      type="button"
      onClick={onOpenAreas}
      className="flex w-full items-center gap-3 rounded-lg bg-gray-700/50 px-4 py-3 text-left text-white transition-colors hover:bg-gray-600/50"
    >
      <img src="./icons/polygon_512.png" alt="" className="h-8 w-8 opacity-90" />
      <div className="flex flex-col">
        <span className="font-medium">Areas</span>
        <span className="text-xs text-gray-400">אזורים וישויות</span>
      </div>
    </button>
    <button
      type="button"
      onClick={onOpenPoints}
      className="mt-2 flex w-full items-center gap-3 rounded-lg bg-gray-700/50 px-4 py-3 text-left text-white transition-colors hover:bg-gray-600/50"
    >
      <img src="./icons/pointing_center_512.png" alt="" className="h-8 w-8 opacity-90" />
      <div className="flex flex-col">
        <span className="font-medium">Points</span>
        <span className="text-xs text-gray-400">נקודות (markers)</span>
      </div>
    </button>
  </div>
);

export default EntitiesSidebarHome;
