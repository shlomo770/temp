import React, { useState } from "react";
import { FiRadio, FiBox } from "react-icons/fi";
import {
  CONTENT,
  SECTION,
  SECTION_TITLE,
  BTN,
  BTN_SECONDARY,
} from "../panelStyles";

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center justify-between gap-2 cursor-pointer">
      <span className="text-[11px] text-white/80">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full border transition ${
          checked
            ? "border-emerald-500/50 bg-emerald-600/80"
            : "border-white/20 bg-slate-700/80"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
            checked ? "left-4" : "left-0.5"
          }`}
        />
      </button>
    </label>
  );
}

export function TabSensors() {
  const [tail, setTail] = useState(false);
  const [rect, setRect] = useState(false);
  const [onMap, setOnMap] = useState(true);

  return (
    <div className={CONTENT}>
      <div className={SECTION}>
        <div className={SECTION_TITLE}>Tracking</div>
        <div className="space-y-2">
          <Toggle checked={tail} onChange={setTail} label="Tail Tracking" />
          <Toggle checked={rect} onChange={setRect} label="Show Track Rect" />
          <Toggle checked={onMap} onChange={setOnMap} label="Track On Map" />
        </div>
      </div>
      <div className={SECTION}>
        <div className={SECTION_TITLE}>Actions</div>
        <div className="grid grid-cols-2 gap-2">
          <button className={`${BTN} ${BTN_SECONDARY}`}>Detect</button>
          <button className={`${BTN} ${BTN_SECONDARY}`}>Retrack</button>
          <button className={`${BTN} ${BTN_SECONDARY} col-span-2`}>
            <FiRadio size={12} /> Radar Track
          </button>
          <button className={`${BTN} ${BTN_SECONDARY} col-span-2`}>
            <FiBox size={12} /> Telemetry
          </button>
        </div>
      </div>
    </div>
  );
}
