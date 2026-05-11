import React from "react";
import { FiCrosshair, FiTool } from "react-icons/fi";
import {
  CONTENT,
  SECTION,
  SECTION_TITLE,
  BTN,
  BTN_PRIMARY,
  BTN_SECONDARY,
} from "../panelStyles";

export function TabTracker() {
  return (
    <div className={CONTENT}>
      <div className={SECTION}>
        <div className={SECTION_TITLE}>Tracker Control</div>
        <div className="space-y-2">
          <button className={`${BTN} ${BTN_PRIMARY} w-full`}>
            <FiCrosshair size={12} /> Start Homing
          </button>
          <button className={`${BTN} ${BTN_SECONDARY} w-full`}>
            <FiTool size={12} /> Calibration
          </button>
        </div>
      </div>
    </div>
  );
}
