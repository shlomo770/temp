import React from "react";
import { CONTENT, SECTION, SECTION_TITLE, LED } from "../panelStyles";

export function TabComms() {
  return (
    <div className={CONTENT}>
      <div className={SECTION}>
        <div className={SECTION_TITLE}>Communications</div>
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span className={LED(true)} />
            <span className="text-[11px] text-white/80">Main</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={LED(false)} />
            <span className="text-[11px] text-white/80">Homing</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={LED(true, true)} />
            <span className="text-[11px] text-white/80">Radar</span>
          </div>
        </div>
      </div>
    </div>
  );
}
