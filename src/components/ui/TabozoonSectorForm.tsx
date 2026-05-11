import { useState} from "react";
import { CenterModal } from "./Modal";
import { DegreeInput } from "./DegreeInput";


export function RadarSectorModal({
    open,
    onClose,
    onSend,
  }: {
    open: boolean;
    onClose: () => void;
    onSend: (v: {
      minAngle: number;
      maxAngle: number;
      radius: number;
    }) => void;
  }) {
    const [minA, setMinA] = useState<number | "">("");
    const [maxA, setMaxA] = useState<number | "">("");
    const [radius, setRadius] = useState<number | "">(5000);
  
    const valid =
      minA !== "" &&
      maxA !== "" &&
      radius !== "" &&
      minA >= 0 &&
      maxA >= 0 &&
      minA <= 360 &&
      maxA <= 360 &&
      radius > 0;
  
    return (
      <CenterModal open={open} onClose={onClose}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-slate-100">
            Tabo Sector
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            ✕
          </button>
        </div>
  
        {/* Angles – same row */}
        <div className="flex gap-2 mb-3">
          <DegreeInput
            label="Min°"
            value={minA}
            onChange={setMinA}
          />
          <DegreeInput
            label="Max°"
            value={maxA}
            onChange={setMaxA}
          />
        </div>
  
        {/* Radius */}
        <div className="mb-4">
          <label className="text-xs text-slate-400 mb-1 block">
            Range (m)
          </label>
          <input
            type="number"
            min={1}
            step={100}
            value={radius}
            onChange={(e) => setRadius(+e.target.value || "")}
            className="input-dark"
          />
        </div>
  
        {/* Footer */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md bg-slate-800 text-slate-300 text-sm"
          >
            Cancel
          </button>
          <button
            disabled={!valid}
            onClick={() => {
              onSend({
                minAngle: minA as number,
                maxAngle: maxA as number,
                radius: radius as number,
              });
              onClose();
            }}
            className={`
              px-4 py-1.5 rounded-md text-sm font-semibold transition
              ${
                valid
                  ? "bg-amber-400 text-black hover:bg-amber-300"
                  : "bg-slate-700 text-slate-500 cursor-not-allowed"
              }
            `}
          >
            Apply
          </button>
        </div>
      </CenterModal>
    );
  }