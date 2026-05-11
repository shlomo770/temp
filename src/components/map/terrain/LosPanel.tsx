import { useMemo } from "react";
import type { LonLat, LosSamplingPreset, LosWorkerResult } from "../../../terrain/terrain.types";

interface Props {
  observer: LonLat;
  target: LonLat;
  setObserver: (p: LonLat) => void;
  setTarget: (p: LonLat) => void;
  busy: boolean;
  onUseMyPosition: () => void;
  onPickObserverFromMap: () => void;
  onPickTargetFromMap: () => void;
  onCompute: (payload: {
    observer: LonLat;
    target: LonLat;
    observerHeightM: number;
    targetHeightM: number;
    quality: LosSamplingPreset;
  }) => void;
  onClear: () => void;
  result: LosWorkerResult | null;
  quality: LosSamplingPreset;
  setQuality: (value: LosSamplingPreset) => void;
  observerHeightM: number;
  setObserverHeightM: (value: number) => void;
  targetHeightM: number;
  setTargetHeightM: (value: number) => void;
  pickingLabel?: string;
}

export default function LosPanel({
  observer,
  target,
  setObserver,
  setTarget,
  busy,
  onUseMyPosition,
  onPickObserverFromMap,
  onPickTargetFromMap,
  onCompute,
  onClear,
  result,
  quality,
  setQuality,
  observerHeightM,
  setObserverHeightM,
  targetHeightM,
  setTargetHeightM,
  pickingLabel,
}: Props) {
  const profile = useMemo(() => {
    if (!result || result.profileDistancesM.length === 0) return "";
    const maxDist = Math.max(...result.profileDistancesM, 1);
    const maxY = Math.max(...result.profileTerrainM, ...result.profileRayM);
    const minY = Math.min(...result.profileTerrainM, ...result.profileRayM);
    const toPoint = (x: number, y: number) => `${(x / maxDist) * 240},${80 - ((y - minY) / (maxY - minY || 1)) * 70}`;
    return {
      terrain: result.profileDistancesM.map((d, i) => toPoint(d, result.profileTerrainM[i])).join(" "),
      ray: result.profileDistancesM.map((d, i) => toPoint(d, result.profileRayM[i])).join(" "),
    };
  }, [result]);

  return (
    <div className="space-y-3 text-slate-900">
      {pickingLabel && <div className="text-xs text-blue-700 font-medium">{pickingLabel}</div>}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <label>Observer Lon<input className="w-full text-black px-2 py-1 rounded" type="number" value={observer.lng} onChange={(e) => setObserver({ ...observer, lng: Number(e.target.value) })} /></label>
        <label>Observer Lat<input className="w-full text-black px-2 py-1 rounded" type="number" value={observer.lat} onChange={(e) => setObserver({ ...observer, lat: Number(e.target.value) })} /></label>
        <label>Obs. height (m AGL)<input className="w-full text-black px-2 py-1 rounded" type="number" min={0} value={observerHeightM} onChange={(e) => setObserverHeightM(Math.max(0, Number(e.target.value)))} /></label>
        <label>Target height (m AGL)<input className="w-full text-black px-2 py-1 rounded" type="number" min={0} value={targetHeightM} onChange={(e) => setTargetHeightM(Math.max(0, Number(e.target.value)))} /></label>
        <label>Target Lon<input className="w-full text-black px-2 py-1 rounded" type="number" value={target.lng} onChange={(e) => setTarget({ ...target, lng: Number(e.target.value) })} /></label>
        <label>Target Lat<input className="w-full text-black px-2 py-1 rounded" type="number" value={target.lat} onChange={(e) => setTarget({ ...target, lat: Number(e.target.value) })} /></label>
      </div>
      <div className="flex gap-2 text-xs">
        {(["low", "medium", "high"] as LosSamplingPreset[]).map((q) => (
          <button key={q} onClick={() => setQuality(q)} className={`px-2 py-1 rounded text-white ${quality === q ? "bg-blue-600" : "bg-gray-700"}`}>{q}</button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <button className="px-2 py-1 bg-gray-700 text-white rounded" onClick={onUseMyPosition}>Use my position</button>
        <button className="px-2 py-1 bg-indigo-700 text-white rounded" onClick={onPickObserverFromMap}>Pick observer on map</button>
        <button className="px-2 py-1 bg-indigo-700 text-white rounded" onClick={onPickTargetFromMap}>Pick target on map</button>
        <button
          className="px-2 py-1 bg-emerald-700 text-white rounded disabled:opacity-50"
          disabled={busy}
          onClick={() => onCompute({ observer, target, observerHeightM, targetHeightM, quality })}
        >
          Compute LOS
        </button>
        <button className="px-2 py-1 bg-red-700 text-white rounded" onClick={onClear}>Clear LOS</button>
      </div>
      {result && (
        <div className="text-xs space-y-1">
          <div>Result: {result.visible ? "Visible" : "Blocked"}</div>
          <div>Distance: {result.distanceM.toFixed(1)} m</div>
          <div>3D Distance: {result.distance3DM.toFixed(1)} m</div>
          <div>Azimuth: {result.azimuthDeg.toFixed(2)} deg</div>
          <div>Elevation: {result.elevationDeg.toFixed(2)} deg</div>
          <div>Block distance: {result.blockDistanceM?.toFixed(1) ?? "-"}</div>
          {!!profile && (
            <svg width="240" height="80" className="bg-slate-100 rounded border border-slate-300">
              <polyline points={profile.terrain} fill="none" stroke="#f59e0b" strokeWidth="1.5" />
              <polyline points={profile.ray} fill="none" stroke="#22c55e" strokeWidth="1.5" />
            </svg>
          )}
        </div>
      )}
    </div>
  );
}
