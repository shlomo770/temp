import type { CoverageQualityPreset, LonLat } from "../../../terrain/terrain.types";

interface Props {
  observer: LonLat;
  setObserver: (p: LonLat) => void;
  west: number;
  south: number;
  east: number;
  north: number;
  setBounds: (bounds: { west: number; south: number; east: number; north: number }) => void;
  busy: boolean;
  visiblePercent: number | null;
  onUseMyPosition: () => void;
  onCompute: (payload: {
    west: number;
    south: number;
    east: number;
    north: number;
    observer: LonLat;
    observerHeightM: number;
    targetHeightM: number;
    quality: CoverageQualityPreset;
    showHidden: boolean;
    showSeen: boolean;
  }) => void;
  onClear: () => void;
  onPickObserverFromMap: () => void;
  onPickAoiFromMap: () => void;
  pickingLabel?: string;
  observerHeightM: number;
  setObserverHeightM: (value: number) => void;
  targetHeightM: number;
  setTargetHeightM: (value: number) => void;
  quality: CoverageQualityPreset;
  setQuality: (value: CoverageQualityPreset) => void;
  showHidden: boolean;
  setShowHidden: (value: boolean) => void;
  showSeen: boolean;
  setShowSeen: (value: boolean) => void;
}

export default function CoveragePanel({
  observer,
  setObserver,
  west,
  south,
  east,
  north,
  setBounds,
  busy,
  visiblePercent,
  onUseMyPosition,
  onCompute,
  onClear,
  onPickObserverFromMap,
  onPickAoiFromMap,
  pickingLabel,
  observerHeightM,
  setObserverHeightM,
  targetHeightM,
  setTargetHeightM,
  quality,
  setQuality,
  showHidden,
  setShowHidden,
  showSeen,
  setShowSeen,
}: Props) {
  return (
    <div className="space-y-3 text-slate-900 text-xs">
      {pickingLabel && <div className="text-blue-700 font-medium">{pickingLabel}</div>}
      <div className="grid grid-cols-2 gap-2">
        <label>X-W<input className="w-full text-black px-2 py-1 rounded" type="number" value={west} onChange={(e) => setBounds({ west: Number(e.target.value), south, east, north })} /></label>
        <label>Y-S<input className="w-full text-black px-2 py-1 rounded" type="number" value={south} onChange={(e) => setBounds({ west, south: Number(e.target.value), east, north })} /></label>
        <label>X-E<input className="w-full text-black px-2 py-1 rounded" type="number" value={east} onChange={(e) => setBounds({ west, south, east: Number(e.target.value), north })} /></label>
        <label>Y-N<input className="w-full text-black px-2 py-1 rounded" type="number" value={north} onChange={(e) => setBounds({ west, south, east, north: Number(e.target.value) })} /></label>
        <label>Observer X<input className="w-full text-black px-2 py-1 rounded" type="number" value={observer.lng} onChange={(e) => setObserver({ ...observer, lng: Number(e.target.value) })} /></label>
        <label>Observer Y<input className="w-full text-black px-2 py-1 rounded" type="number" value={observer.lat} onChange={(e) => setObserver({ ...observer, lat: Number(e.target.value) })} /></label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label>Obs. height (m AGL)<input className="w-full text-black px-2 py-1 rounded" type="number" min={0} value={observerHeightM} onChange={(e) => setObserverHeightM(Math.max(0, Number(e.target.value)))} /></label>
        <label>Target height (m AGL)<input className="w-full text-black px-2 py-1 rounded" type="number" min={0} value={targetHeightM} onChange={(e) => setTargetHeightM(Math.max(0, Number(e.target.value)))} /></label>
      </div>
      <div className="flex gap-2">
        {(["low", "medium", "high"] as CoverageQualityPreset[]).map((q) => (
          <button key={q} onClick={() => setQuality(q)} className={`px-2 py-1 rounded text-white ${quality === q ? "bg-blue-600" : "bg-gray-700"}`}>{q}</button>
        ))}
      </div>
      <div className="flex gap-3">
        <label><input type="checkbox" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} /> Hidden area</label>
        <label><input type="checkbox" checked={showSeen} onChange={(e) => setShowSeen(e.target.checked)} /> Seen area</label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="px-2 py-1 bg-gray-700 text-white rounded" onClick={onUseMyPosition}>Use my position</button>
        <button className="px-2 py-1 bg-indigo-700 text-white rounded" onClick={onPickObserverFromMap}>Pick observer on map</button>
        <button className="px-2 py-1 bg-indigo-700 text-white rounded" onClick={onPickAoiFromMap}>Pick AOI rectangle</button>
        <button
          className="px-2 py-1 bg-emerald-700 text-white rounded disabled:opacity-50"
          disabled={busy}
          onClick={() => onCompute({ west, south, east, north, observer, observerHeightM, targetHeightM, quality, showHidden, showSeen })}
        >
          Compute coverage
        </button>
        <button className="px-2 py-1 bg-red-700 text-white rounded" onClick={onClear}>Clear coverage</button>
      </div>
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1"><i className="w-3 h-3 rounded bg-[#5384ff] inline-block" />Seen area</span>
        <span className="inline-flex items-center gap-1"><i className="w-3 h-3 rounded bg-[#d22e2e] inline-block" />Hidden area</span>
      </div>
      {visiblePercent !== null && <div className="font-semibold">Result: {(visiblePercent * 100).toFixed(2)}% visible</div>}
    </div>
  );
}
