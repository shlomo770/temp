import React, { useState, useRef, useEffect } from "react";
import {
  FiZap,
  FiArrowUp,
  FiMapPin,
  FiRotateCcw,
  FiTarget,
} from "react-icons/fi";
import { IoClose } from "react-icons/io5";

interface Props {
  onClose: () => void;
}

/* ---------- STYLE ---------- */

const PANEL =
  "fixed z-[90] w-[260px] rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-sm shadow-lg overflow-hidden";

const HEADER =
  "flex items-center justify-between px-3 py-1.5 bg-slate-800/80 border-b border-white/10 cursor-move";

const TITLE =
  "text-[10px] uppercase tracking-wider text-white/60";

const BODY = "p-2.5 space-y-3";

const BTN_BASE =
  "h-8 px-2 rounded-md text-[10.5px] font-semibold flex items-center justify-center gap-1 border border-white/10 transition";

const BTN_NEUTRAL =
  "bg-slate-700/70 hover:bg-slate-600 text-white";

const BTN_ACTIVE =
  "bg-emerald-700/70 text-white";

const BTN_SUB =
  "bg-slate-800/70 hover:bg-slate-700 text-white/90";

const BTN_DANGER =
  "bg-rose-700/70 hover:bg-rose-600 text-white";

const INPUT =
  "h-8 rounded-md border border-white/10 bg-slate-800/90 px-2 text-[10.5px] text-white focus:outline-none w-full";

const LABEL =
  "text-[9px] text-white/40 uppercase tracking-wider";

/* ---------- COMPONENT ---------- */

export const FlightControlMenuPanel: React.FC<Props> = ({ onClose }) => {
  const [armed, setArmed] = useState(false);
  const [armAndTakeoff, setArmAndTakeoff] = useState(true);
  const [mode, setMode] = useState("Acro");
  const [dir, setDir] = useState("180");
  const [alt, setAlt] = useState("100");

  /* ---------- DRAG ---------- */

  const [pos, setPos] = useState({ left: 80, top: 80 });
  const dragRef = useRef({ active: false, ox: 0, oy: 0 });

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!dragRef.current.active) return;
      setPos({
        left: e.clientX - dragRef.current.ox,
        top: e.clientY - dragRef.current.oy,
      });
    };
    const up = () => (dragRef.current.active = false);

    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
    return () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
    };
  }, []);

  const dragStart = (e: React.PointerEvent) => {
    dragRef.current = {
      active: true,
      ox: e.clientX - pos.left,
      oy: e.clientY - pos.top,
    };
  };

  const handleTakeoff = () => {
    if (armAndTakeoff && !armed) setArmed(true);
    console.log("TAKEOFF");
  };

  return (
    <div className={PANEL} style={{ left: pos.left, top: pos.top }}>
      {/* HEADER */}
      <div onPointerDown={dragStart} className={HEADER}>
        <span className={TITLE}>Flight Control</span>

        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-white/10 text-white/60"
        >
          <IoClose size={14} />
        </button>
      </div>

      <div className={BODY}>
        {/* ARM / TAKEOFF */}
        <div className="space-y-1">
          <div className="text-[9px] text-white/40 uppercase tracking-wider text-center">
            Arm & Takeoff
          </div>

          <div className="grid grid-cols-[1fr_1fr_64px] gap-1.5 items-center">
            {/* ARM */}
            <button
              onClick={() => setArmed(!armed)}
              className={`${BTN_BASE} ${
                armed ? BTN_ACTIVE : BTN_NEUTRAL
              }`}
            >
              <FiZap size={12} />
              {armed ? "ARMED" : "DISARM"}
            </button>

            {/* TAKEOFF */}
            <button
              onClick={handleTakeoff}
              className={`${BTN_BASE} ${BTN_NEUTRAL}`}
            >
              <FiArrowUp size={12} />
              TKOF
            </button>

            {/* TOGGLE */}
            <button
              onClick={() => setArmAndTakeoff(!armAndTakeoff)}
              className={`
                relative h-6 rounded-full border border-white/15 transition
                ${armAndTakeoff ? "bg-emerald-600" : "bg-slate-700"}
              `}
            >
              <span
                className={`
                  absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-white transition
                  ${armAndTakeoff ? "left-[26px]" : "left-[3px]"}
                `}
              />
            </button>
          </div>
        </div>

        {/* NAV */}
        <div className="grid grid-cols-2 gap-1.5">
          <button className={`${BTN_BASE} ${BTN_SUB}`}>
            <FiMapPin size={12} />
            GOTO
          </button>

          <button className={`${BTN_BASE} ${BTN_SUB}`}>
            <FiTarget size={12} />
            CIRCLE
          </button>
        </div>

        {/* MODE */}
        <div className="space-y-1">
          <div className={LABEL}>Flight Mode</div>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className={INPUT}
          >
            <option>Acro</option>
            <option>Manual</option>
            <option>Auto</option>
          </select>
        </div>

        {/* RTL */}
        <button className={`${BTN_BASE} ${BTN_DANGER} w-full`}>
          <FiRotateCcw size={12} />
          RTL
        </button>

        {/* DIR / ALT */}
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <div className={LABEL}>Dir</div>
            <input
              type="number"
              value={dir}
              onChange={(e) => setDir(e.target.value)}
              className={INPUT}
            />
          </div>

          <div>
            <div className={LABEL}>Alt</div>
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
};