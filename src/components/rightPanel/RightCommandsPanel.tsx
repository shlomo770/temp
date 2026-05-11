import { useState, MutableRefObject } from "react";
import { PANEL, TAB_BAR, TAB_BTN } from "./panelStyles";
import {
  TabFlight,
  TabPath,
  TabTracker,
  TabSensors,
  TabComms,
  TabTargets,
  TabLog,
} from "./tabs";

const TABS = [
  { id: "flight", label: "Flight" },
  { id: "path", label: "Path" },
  { id: "tracker", label: "Track" },
  { id: "sensors", label: "Sensors" },
  { id: "comms", label: "Comms" },
  { id: "log", label: "Log" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export interface RightCommandsPanelProps {
  mapServiceRef?: MutableRefObject<any>;
  onAttackTarget?: (targetId: string) => void;
  onAbortTarget?: (targetId: string) => void;
}

export function RightCommandsPanel({
  mapServiceRef,
  onAttackTarget,
  onAbortTarget,
}: RightCommandsPanelProps = {}) {
  const [activeTab, setActiveTab] = useState<TabId>("flight");

  const renderTabContent = () => {
    switch (activeTab) {
      case "flight":
        return <TabFlight />;
      case "path":
        return <TabPath mapServiceRef={mapServiceRef} />;
      case "tracker":
        return <TabTracker />;
      case "sensors":
        return <TabSensors />;
      case "comms":
        return <TabComms />;
      case "log":
        return <TabLog />;
      default:
        return <TabFlight />;
    }
  };

  const showTargets =
    mapServiceRef && onAttackTarget && onAbortTarget;

  return (
    <aside className={PANEL}>
      <div className={TAB_BAR}>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={TAB_BTN(activeTab === id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto">
          {renderTabContent()}
        </div>
        <div className="shrink-0 border-t border-white/[0.06] flex flex-col max-h-[42vh] min-h-[140px] overflow-hidden bg-slate-900/50">
          {showTargets ? (
            <TabTargets
              mapServiceRef={mapServiceRef}
              onAttackTarget={onAttackTarget}
              onAbortTarget={onAbortTarget}
            />
          ) : (
            <div className="p-3 text-[10px] text-white/40 flex items-center justify-center min-h-[80px]">
              Targets unavailable
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
