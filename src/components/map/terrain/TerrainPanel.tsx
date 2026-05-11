import { useEffect, useMemo, useRef, useState } from "react";
import type { Map, MapMouseEvent } from "maplibre-gl";
import { TerrainOverlayManager } from "../../../services/map/TerrainOverlayManager";
import { getTerrainService } from "../../../terrain/terrain.service";
import { COVERAGE_CELL_SIZE_M, COVERAGE_LOS_STEP_BY_PRESET, LOS_STEP_BY_PRESET } from "../../../terrain/terrain.sampling";
import type { LonLat, LosWorkerResult, TerrainState } from "../../../terrain/terrain.types";
import CoveragePanel from "./CoveragePanel";
import LosPanel from "./LosPanel";
import TerrainStatusBadge from "./TerrainStatusBadge";

type Mode = "los" | "coverage";
type PickMode =
  | "none"
  | "los-observer"
  | "los-target"
  | "coverage-observer"
  | "coverage-aoi-first"
  | "coverage-aoi-second";

const terrainService = getTerrainService();

interface Props {
  map: Map | null;
}

export default function TerrainPanel({ map }: Props) {
  const [state, setState] = useState<TerrainState>(terrainService.getTerrainState());
  const [mode, setMode] = useState<Mode>("los");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [losResult, setLosResult] = useState<LosWorkerResult | null>(null);
  const [coverageResult, setCoverageResult] = useState<any | null>(null);

  const [losObserver, setLosObserver] = useState<LonLat>({ lng: 34.78, lat: 32.08 });
  const [losTarget, setLosTarget] = useState<LonLat>({ lng: 34.79, lat: 32.09 });
  const [losQuality, setLosQuality] = useState<"low" | "medium" | "high">("medium");
  const [losObserverHeightM, setLosObserverHeightM] = useState(10);
  const [losTargetHeightM, setLosTargetHeightM] = useState(1.5);

  const [pickMode, setPickMode] = useState<PickMode>("none");

  const [coverageObserverForPick, setCoverageObserverForPick] = useState<LonLat>({
    lng: 34.78,
    lat: 32.08,
  });

  const [coverageAoiForPick, setCoverageAoiForPick] = useState<{
    west: number;
    south: number;
    east: number;
    north: number;
  }>({
    west: 34.73,
    south: 32.03,
    east: 34.83,
    north: 32.13,
  });

  const [coverageObserverHeightM, setCoverageObserverHeightM] = useState(10);
  const [coverageTargetHeightM, setCoverageTargetHeightM] = useState(1.5);
  const [coverageQuality, setCoverageQuality] = useState<"low" | "medium" | "high">("medium");
  const [coverageShowHidden, setCoverageShowHidden] = useState(true);
  const [coverageShowSeen, setCoverageShowSeen] = useState(true);

  const firstAoiCornerRef = useRef<LonLat | null>(null);
  const overlayRef = useRef<TerrainOverlayManager | null>(null);

  useEffect(() => terrainService.subscribe(setState), []);

  useEffect(() => {
    if (!map) return;

    overlayRef.current = new TerrainOverlayManager(map);

    terrainService.initTerrain().catch((e) => {
      setError(e instanceof Error ? e.message : "DTM parsing failed");
    });

    return () => {
      overlayRef.current?.clearAllTerrainOverlays();
    };
  }, [map]);

  const onUseMyPosition = () => {
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const point = { lng: p.coords.longitude, lat: p.coords.latitude };
        setLosObserver(point);
        setCoverageObserverForPick(point);
      },
      () => setError("Unable to read browser location")
    );
  };

  const coveragePercent = useMemo(() => coverageResult?.visibleFraction ?? null, [coverageResult]);

  const pickingLabel = useMemo(() => {
    if (pickMode === "los-observer") return "Click on map to set LOS observer";
    if (pickMode === "los-target") return "Click on map to set LOS target";
    if (pickMode === "coverage-observer") return "Click on map to set coverage observer";
    if (pickMode === "coverage-aoi-first") return "Click first AOI corner";
    if (pickMode === "coverage-aoi-second") return "Click opposite AOI corner";
    return "";
  }, [pickMode]);

  useEffect(() => {
    if (!map) return;

    const canvas = map.getCanvas();
    canvas.style.cursor = pickMode === "none" ? "" : "crosshair";

    const onClick = (e: MapMouseEvent) => {
      const p = { lng: e.lngLat.lng, lat: e.lngLat.lat };

      if (pickMode === "los-observer") {
        setLosObserver(p);
        setPickMode("none");
        return;
      }

      if (pickMode === "los-target") {
        setLosTarget(p);
        setPickMode("none");
        return;
      }

      if (pickMode === "coverage-observer") {
        setCoverageObserverForPick(p);
        setPickMode("none");
        return;
      }

      if (pickMode === "coverage-aoi-first") {
        firstAoiCornerRef.current = p;
        setPickMode("coverage-aoi-second");
        return;
      }

      if (pickMode === "coverage-aoi-second" && firstAoiCornerRef.current) {
        const first = firstAoiCornerRef.current;
        const aoi = {
          west: Math.min(first.lng, p.lng),
          south: Math.min(first.lat, p.lat),
          east: Math.max(first.lng, p.lng),
          north: Math.max(first.lat, p.lat),
        };
        setCoverageAoiForPick(aoi);
        overlayRef.current?.setCoverageOutline(aoi);
        firstAoiCornerRef.current = null;
        setPickMode("none");
      }
    };

    map.on("click", onClick);

    return () => {
      map.off("click", onClick);
      canvas.style.cursor = "";
    };
  }, [map, pickMode]);

  useEffect(() => {
    if (!overlayRef.current) return;

    if (mode === "los") {
      overlayRef.current.setLosDraft(losObserver, losTarget);
      return;
    }

    overlayRef.current.setCoverageDraft(coverageObserverForPick, coverageAoiForPick);
  }, [mode, losObserver, losTarget, coverageObserverForPick, coverageAoiForPick]);

  return (
    <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 text-slate-900 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Terrain Analysis</h3>
        <TerrainStatusBadge state={state} />
      </div>

      {!!state.error && <div className="text-xs text-red-400">{state.error}</div>}
      {!!error && <div className="text-xs text-red-400">{error}</div>}

      <div className="flex gap-2">
        <button
          className="px-2 py-1 rounded bg-blue-700 text-xs text-white"
          onClick={() => terrainService.reloadTerrainFromPublic()}
        >
          Reload DTM
        </button>

        <button
          className="px-2 py-1 rounded bg-gray-700 text-xs text-white"
          onClick={() => overlayRef.current?.clearAllTerrainOverlays()}
        >
          Clear overlays
        </button>
      </div>

      <div className="flex gap-2">
        <button
          className={`px-2 py-1 rounded text-xs text-white ${mode === "los" ? "bg-emerald-700" : "bg-gray-700"}`}
          onClick={() => setMode("los")}
        >
          LOS
        </button>

        <button
          className={`px-2 py-1 rounded text-xs text-white ${mode === "coverage" ? "bg-emerald-700" : "bg-gray-700"}`}
          onClick={() => setMode("coverage")}
        >
          Coverage
        </button>
      </div>

      {mode === "los" ? (
        <LosPanel
          observer={losObserver}
          target={losTarget}
          setObserver={setLosObserver}
          setTarget={setLosTarget}
          busy={busy}
          onUseMyPosition={onUseMyPosition}
          onPickObserverFromMap={() => setPickMode("los-observer")}
          onPickTargetFromMap={() => setPickMode("los-target")}
          result={losResult}
          quality={losQuality}
          setQuality={setLosQuality}
          observerHeightM={losObserverHeightM}
          setObserverHeightM={setLosObserverHeightM}
          targetHeightM={losTargetHeightM}
          setTargetHeightM={setLosTargetHeightM}
          pickingLabel={pickingLabel}
          onCompute={async ({ observer: obs, target, observerHeightM, targetHeightM, quality }) => {
            setBusy(true);
            setError(null);

            try {
              const result = await terrainService.computeLos({
                observer: obs,
                observerHeightM,
                target,
                targetHeightM,
                stepM: LOS_STEP_BY_PRESET[quality],
              });

              setLosResult(result);
              if (result.debugMessage) {
                console.info(result.debugMessage);
              }
              overlayRef.current?.setLos(obs, target, result.blockPoint);
            } catch (e) {
              setError(e instanceof Error ? e.message : "LOS failed");
            } finally {
              setBusy(false);
            }
          }}
          onClear={() => {
            setLosResult(null);
            overlayRef.current?.clearLos();
            overlayRef.current?.setLosDraft(losObserver, losTarget);
          }}
        />
      ) : (
        <CoveragePanel
          observer={coverageObserverForPick}
          setObserver={setCoverageObserverForPick}
          west={coverageAoiForPick.west}
          south={coverageAoiForPick.south}
          east={coverageAoiForPick.east}
          north={coverageAoiForPick.north}
          setBounds={setCoverageAoiForPick}
          busy={busy}
          visiblePercent={coveragePercent}
          onUseMyPosition={onUseMyPosition}
          onPickObserverFromMap={() => setPickMode("coverage-observer")}
          onPickAoiFromMap={() => setPickMode("coverage-aoi-first")}
          pickingLabel={pickingLabel}
          onCompute={async ({
            west,
            south,
            east,
            north,
            observer: obs,
            observerHeightM,
            targetHeightM,
            quality,
            showHidden,
            showSeen,
          }) => {
            setBusy(true);
            setError(null);
            overlayRef.current?.clearCoverage();

            try {
              const losStepM = COVERAGE_LOS_STEP_BY_PRESET[quality];

              const result = await terrainService.computeCoverage({
                west,
                south,
                east,
                north,
                observer: obs,
                observerHeightM,
                targetHeightM,
                cellSizeM: COVERAGE_CELL_SIZE_M,
                losStepM,
                showHidden,
                showSeen,
              });

              setCoverageResult(result);
              if (result.debugMessage) {
                console.info(result.debugMessage);
              }
              overlayRef.current?.setCoverageFeatures(result.features ?? [], result.bboxWgs84);
              overlayRef.current?.setCoverageOutline(result.bboxWgs84);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Coverage failed");
            } finally {
              setBusy(false);
            }
          }}
          onClear={() => {
            setCoverageResult(null);
            overlayRef.current?.clearCoverage();
            overlayRef.current?.setCoverageDraft(coverageObserverForPick, coverageAoiForPick);
          }}
          observerHeightM={coverageObserverHeightM}
          setObserverHeightM={setCoverageObserverHeightM}
          targetHeightM={coverageTargetHeightM}
          setTargetHeightM={setCoverageTargetHeightM}
          quality={coverageQuality}
          setQuality={setCoverageQuality}
          showHidden={coverageShowHidden}
          setShowHidden={setCoverageShowHidden}
          showSeen={coverageShowSeen}
          setShowSeen={setCoverageShowSeen}
        />
      )}
    </div>
  );
}
