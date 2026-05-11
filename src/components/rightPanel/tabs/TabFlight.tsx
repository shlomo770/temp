import React, { useState } from "react";
import { FiZap, FiArrowUp, FiMapPin, FiRotateCcw, FiTarget } from "react-icons/fi";
import {
  CONTENT,
  SECTION,
  SECTION_TITLE,
  BTN,
  BTN_PRIMARY,
  BTN_SECONDARY,
  BTN_DANGER,
  INPUT,
  LABEL,
} from "../panelStyles";

export function TabFlight() {
  const [armed, setArmed] = useState(false);
  const [armTk, setArmTk] = useState(true);
  const [mode, setMode] = useState("Acro");
  const [dir, setDir] = useState("180");
  const [alt, setAlt] = useState("100");

  return (
    <div className={CONTENT}>
      <div className={SECTION}>
        <div className={SECTION_TITLE}>Arm & Takeoff</div>
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
          <button
            onClick={() => setArmed(!armed)}
            className={`${BTN} ${armed ? BTN_PRIMARY : BTN_SECONDARY}`}
          >
            <FiZap size={12} />
            {armed ? "ARMED" : "DISARM"}
          </button>
          <button className={`${BTN} ${BTN_SECONDARY}`}>
            <FiArrowUp size={12} />
            TAKEOFF
          </button>
          <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-white/70">
            <input
              type="checkbox"
              checked={armTk}
              onChange={(e) => setArmTk(e.target.checked)}
              className="accent-emerald-500 w-3.5 h-3.5 rounded"
            />
            ARM+TK
          </label>
        </div>
      </div>

      <div className={SECTION}>
        <div className={SECTION_TITLE}>Navigation</div>
        <div className="grid grid-cols-2 gap-2">
          <button className={`${BTN} ${BTN_SECONDARY}`}>
            <FiMapPin size={12} /> GOTO WP
          </button>
          <button className={`${BTN} ${BTN_SECONDARY}`}>
            <FiTarget size={12} /> CIRCLE
          </button>
        </div>
      </div>

      <div className={SECTION}>
        <label className={LABEL}>Flight Mode</label>
        <select className={INPUT} value={mode} onChange={(e) => setMode(e.target.value)}>
          <option>Acro</option>
          <option>Manual</option>
          <option>Auto</option>
          <option>Loiter</option>
        </select>
      </div>

      <div className={SECTION}>
        <button className={`${BTN} ${BTN_DANGER} w-full`}>
          <FiRotateCcw size={12} /> RTL DIRECT
        </button>
      </div>

      <div className={SECTION}>
        <div className={SECTION_TITLE}>Target & Altitude</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={LABEL}>Dir (180–360)</label>
            <input
              type="number"
              min={180}
              max={360}
              value={dir}
              onChange={(e) => setDir(e.target.value)}
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL}>Alt (m)</label>
            <input
              type="number"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              className={INPUT}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
