/// <reference lib="webworker" />

import { fromArrayBuffer } from "geotiff";
import { bearing, clamp, haversine, pointInBbox } from "./terrain.math";
import { inferEpsg, transformPoint } from "./terrain.crs";
import type { MsgIn, MsgOut } from "./terrain.workerProtocol";
import type {
  CoverageBlockedFeatureProps,
  CoverageParams,
  CoverageWorkerResult,
  LonLat,
  LosObserverTarget,
  LosWorkerResult,
  TerrainMeta,
} from "./terrain.types";

type RasterArray =
  | Float32Array
  | Float64Array
  | Int16Array
  | Int32Array
  | Uint16Array
  | Uint32Array
  | Int8Array
  | Uint8Array;

interface TerrainDataset {
  width: number;
  height: number;
  data: RasterArray;
  nodata: number | null;
  epsg: number | null;
  nativeBounds: { minX: number; minY: number; maxX: number; maxY: number };
  bboxWgs84: { west: number; south: number; east: number; north: number };
  xRes: number;
  yRes: number;
}

interface LosTraceResult {
  visible: boolean;
  blockPoint: LonLat | null;
  blockDistanceM: number | null;
  distanceM: number;
  distance3DM: number;
  azimuthDeg: number;
  elevationDeg: number;
  profileDistancesM: number[];
  profileTerrainM: number[];
  profileRayM: number[];
  observerTerrainM: number;
  targetTerrainM: number;
  observerAbsHeightM: number;
  targetAbsHeightM: number;
  firstBlockingDistanceM: number | null;
  firstBlockingTerrainM: number | null;
  firstBlockingRayM: number | null;
  debugMessage: string;
}

interface CoverageObserverContext {
  observer: LonLat;
  observerHeightM: number;
  startTerrainM: number;
  startRayM: number;
  sx: number;
  sy: number;
  workEpsg: number;
  samplingStepM: number;
  ignoreNearObserverM: number;
}

let dataset: TerrainDataset | null = null;
const cancelledJobs = new Set<string>();

const LOS_CLEARANCE_EPSILON_M = 0.3;
const LOS_IGNORE_NEAR_OBSERVER_FACTOR = 1;
const COVERAGE_DEBUG_MAX_BLOCKED_CELLS = 120;

function post(msg: MsgOut, transfer: Transferable[] = []): void {
  self.postMessage(msg, transfer);
}

function mustDataset(): TerrainDataset {
  if (!dataset) throw new Error("DTM parsing failed");
  return dataset;
}

function readRasterResult(rasters: unknown): RasterArray {
  if (Array.isArray(rasters)) {
    if (!rasters[0]) throw new Error("GeoTIFF raster is empty");
    return rasters[0] as RasterArray;
  }
  return rasters as RasterArray;
}

function toWgs84Point(epsg: number | null, x: number, y: number): [number, number] {
  return transformPoint(epsg, 4326, x, y);
}

function toNativePoint(epsg: number | null, lng: number, lat: number): [number, number] {
  return transformPoint(4326, epsg, lng, lat);
}

function buildMeta(ds: TerrainDataset): TerrainMeta {
  return {
    width: ds.width,
    height: ds.height,
    bboxWgs84: ds.bboxWgs84,
    nodata: ds.nodata,
    epsg: ds.epsg,
  };
}

function valid(value: number, nodata: number | null): boolean {
  return Number.isFinite(value) && (nodata === null || value !== nodata);
}

function nativeToPixel(ds: TerrainDataset, xNative: number, yNative: number): { xPix: number; yPix: number } {
  const xDen = Math.abs(ds.xRes) > 0 ? Math.abs(ds.xRes) : 1;
  const yDen = Math.abs(ds.yRes) > 0 ? Math.abs(ds.yRes) : 1;

  // Respect raster axis direction from GeoTIFF resolution sign.
  const xPix =
    ds.xRes >= 0
      ? (xNative - ds.nativeBounds.minX) / xDen
      : (ds.nativeBounds.maxX - xNative) / xDen;
  const yPix =
    ds.yRes < 0
      ? (ds.nativeBounds.maxY - yNative) / yDen
      : (yNative - ds.nativeBounds.minY) / yDen;

  return { xPix, yPix };
}

function sampleElevation(lng: number, lat: number): number | null {
  const ds = mustDataset();

  if (
    !pointInBbox(
      { lng, lat },
      ds.bboxWgs84.west,
      ds.bboxWgs84.south,
      ds.bboxWgs84.east,
      ds.bboxWgs84.north
    )
  ) {
    return null;
  }

  const [xNative, yNative] = toNativePoint(ds.epsg, lng, lat);
  const { xPix, yPix } = nativeToPixel(ds, xNative, yNative);

  if (!Number.isFinite(xPix) || !Number.isFinite(yPix)) return null;

  const x = clamp(xPix, 0, ds.width - 1);
  const y = clamp(yPix, 0, ds.height - 1);

  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, ds.width - 1);
  const y1 = Math.min(y0 + 1, ds.height - 1);

  const fx = x - x0;
  const fy = y - y0;

  const idx00 = y0 * ds.width + x0;
  const idx10 = y0 * ds.width + x1;
  const idx01 = y1 * ds.width + x0;
  const idx11 = y1 * ds.width + x1;

  const v00 = ds.data[idx00];
  const v10 = ds.data[idx10];
  const v01 = ds.data[idx01];
  const v11 = ds.data[idx11];

  const bilinearParts: Array<{ value: number; weight: number }> = [
    { value: v00, weight: (1 - fx) * (1 - fy) },
    { value: v10, weight: fx * (1 - fy) },
    { value: v01, weight: (1 - fx) * fy },
    { value: v11, weight: fx * fy },
  ];

  let weightedSum = 0;
  let weightSum = 0;

  for (const part of bilinearParts) {
    if (!valid(part.value, ds.nodata)) continue;
    weightedSum += part.value * part.weight;
    weightSum += part.weight;
  }

  if (weightSum > 0) {
    return weightedSum / weightSum;
  }

  const cx = Math.round(x);
  const cy = Math.round(y);

  for (let r = 0; r <= 2; r += 1) {
    let ringSum = 0;
    let ringCount = 0;

    for (let oy = -r; oy <= r; oy += 1) {
      for (let ox = -r; ox <= r; ox += 1) {
        const xx = cx + ox;
        const yy = cy + oy;
        if (xx < 0 || yy < 0 || xx >= ds.width || yy >= ds.height) continue;

        const vv = ds.data[yy * ds.width + xx];
        if (!valid(vv, ds.nodata)) continue;

        ringSum += vv;
        ringCount += 1;
      }
    }

    if (ringCount > 0) return ringSum / ringCount;
  }

  return null;
}

function sampleElevationDebug(lng: number, lat: number): {
  xNative: number;
  yNative: number;
  xPix: number;
  yPix: number;
  nearestCol: number;
  nearestRow: number;
  nearestRawM: number | null;
} | null {
  const ds = mustDataset();

  if (
    !pointInBbox(
      { lng, lat },
      ds.bboxWgs84.west,
      ds.bboxWgs84.south,
      ds.bboxWgs84.east,
      ds.bboxWgs84.north
    )
  ) {
    return null;
  }

  const [xNative, yNative] = toNativePoint(ds.epsg, lng, lat);
  const { xPix, yPix } = nativeToPixel(ds, xNative, yNative);
  if (!Number.isFinite(xPix) || !Number.isFinite(yPix)) return null;

  const cx = clamp(Math.round(xPix), 0, ds.width - 1);
  const cy = clamp(Math.round(yPix), 0, ds.height - 1);
  const raw = ds.data[cy * ds.width + cx];

  return {
    xNative,
    yNative,
    xPix,
    yPix,
    nearestCol: cx,
    nearestRow: cy,
    nearestRawM: valid(raw, ds.nodata) ? raw : null,
  };
}

function chooseGridEpsg(ds: TerrainDataset): number {
  return ds.epsg && ds.epsg !== 4326 ? ds.epsg : 3857;
}

function projectedBounds(payload: CoverageParams, epsg: number) {
  const [x1, y1] = transformPoint(4326, epsg, payload.west, payload.south);
  const [x2, y2] = transformPoint(4326, epsg, payload.east, payload.south);
  const [x3, y3] = transformPoint(4326, epsg, payload.east, payload.north);
  const [x4, y4] = transformPoint(4326, epsg, payload.west, payload.north);

  return {
    minX: Math.min(x1, x2, x3, x4),
    maxX: Math.max(x1, x2, x3, x4),
    minY: Math.min(y1, y2, y3, y4),
    maxY: Math.max(y1, y2, y3, y4),
  };
}

function estimateNativeResolutionMeters(ds: TerrainDataset, gridEpsg: number): number {
  if (!Number.isFinite(ds.xRes) || !Number.isFinite(ds.yRes)) return 1;

  const absX = Math.abs(ds.xRes);
  const absY = Math.abs(ds.yRes);

  if (ds.epsg && ds.epsg !== 4326) {
    return Math.max(absX, absY);
  }

  const centerLng = (ds.bboxWgs84.west + ds.bboxWgs84.east) * 0.5;
  const centerLat = (ds.bboxWgs84.south + ds.bboxWgs84.north) * 0.5;

  const [cx, cy] = transformPoint(4326, gridEpsg, centerLng, centerLat);
  const [xPlus] = transformPoint(4326, gridEpsg, centerLng + absX, centerLat);
  const [, yPlus2] = transformPoint(4326, gridEpsg, centerLng, centerLat + absY);

  const xResM = Math.abs(xPlus - cx);
  const yResM = Math.abs(yPlus2 - cy);

  return Math.max(xResM, yResM, 1);
}

function makeCellPolygon(
  row: number,
  col: number,
  minX: number,
  maxY: number,
  cellSizeM: number,
  gridEpsg: number
): GeoJSON.Feature<GeoJSON.Polygon, CoverageBlockedFeatureProps> {
  const x0 = minX + col * cellSizeM;
  const x1 = x0 + cellSizeM;
  const y1 = maxY - row * cellSizeM;
  const y0 = y1 - cellSizeM;

  const p1 = transformPoint(gridEpsg, 4326, x0, y1) as [number, number];
  const p2 = transformPoint(gridEpsg, 4326, x1, y1) as [number, number];
  const p3 = transformPoint(gridEpsg, 4326, x1, y0) as [number, number];
  const p4 = transformPoint(gridEpsg, 4326, x0, y0) as [number, number];

  return {
    type: "Feature",
    properties: { kind: "blocked" },
    geometry: {
      type: "Polygon",
      coordinates: [[p1, p2, p3, p4, p1]],
    },
  };
}

function traceLos(
  jobId: string,
  payload: LosObserverTarget,
  withProfile: boolean,
  collectBlockingDebug = true
): LosTraceResult {
  const ds = mustDataset();

  const observerHeightM = payload.observerHeightM;
  const targetHeightM = payload.targetHeightM;

  const startTerrain = sampleElevation(payload.observer.lng, payload.observer.lat);
  const endTerrain = sampleElevation(payload.target.lng, payload.target.lat);

  if (startTerrain === null || endTerrain === null) {
    throw new Error("No elevation data at selected point");
  }

  const distanceM = haversine(payload.observer, payload.target);
  const workEpsg = chooseGridEpsg(ds);
  const nativeResM = estimateNativeResolutionMeters(ds, workEpsg);
  const samplingStepM = Math.max(1, Number.isFinite(payload.stepM) && payload.stepM > 0 ? payload.stepM : nativeResM);
  const samples = Math.max(2, Math.ceil(distanceM / samplingStepM));
  const ignoreNearObserverM = Math.max(1, samplingStepM * LOS_IGNORE_NEAR_OBSERVER_FACTOR);

  const startRay = startTerrain + observerHeightM;
  const endRay = endTerrain + targetHeightM;

  const [sx, sy] = transformPoint(4326, workEpsg, payload.observer.lng, payload.observer.lat);
  const [tx, ty] = transformPoint(4326, workEpsg, payload.target.lng, payload.target.lat);

  let blockPoint: LonLat | null = null;
  let blockDistanceM: number | null = null;
  let visible = true;
  let firstBlockingDistanceM: number | null = null;
  let firstBlockingTerrainM: number | null = null;
  let firstBlockingRayM: number | null = null;

  const profileDistancesM: number[] = [];
  const profileTerrainM: number[] = [];
  const profileRayM: number[] = [];
  const blockingSamples: Array<{
    distanceM: number;
    terrainM: number;
    rayM: number;
    deltaM: number;
    point: LonLat;
  }> = [];

  for (let i = 0; i <= samples; i += 1) {
    if (cancelledJobs.has(jobId)) throw new Error("cancelled");

    const t = i / samples;
    const x = sx + (tx - sx) * t;
    const y = sy + (ty - sy) * t;
    const [lng, lat] = transformPoint(workEpsg, 4326, x, y);

    const terrain = sampleElevation(lng, lat);
    if (terrain === null) throw new Error("No elevation data at selected point");

    const d = distanceM * t;
    const ray = startRay + (endRay - startRay) * t;

    if (withProfile) {
      profileDistancesM.push(d);
      profileTerrainM.push(terrain);
      profileRayM.push(ray);
    }

    if (i === 0 || i === samples) continue;

    if (d <= ignoreNearObserverM) continue;

    if (terrain > ray + LOS_CLEARANCE_EPSILON_M) {
      const block = {
        distanceM: d,
        terrainM: terrain,
        rayM: ray,
        deltaM: terrain - ray,
        point: { lng, lat },
      };
      if (collectBlockingDebug) {
        blockingSamples.push(block);
      }
      if (visible) {
        visible = false;
        blockPoint = block.point;
        blockDistanceM = d;
        firstBlockingDistanceM = d;
        firstBlockingTerrainM = terrain;
        firstBlockingRayM = ray;
        // Fast path for coverage checks: we only need first blocking point.
        if (!collectBlockingDebug && !withProfile) {
          return {
            visible,
            blockPoint,
            blockDistanceM,
            distanceM,
            distance3DM: Math.sqrt(distanceM ** 2 + (endRay - startRay) ** 2),
            azimuthDeg: bearing(payload.observer, payload.target),
            elevationDeg: (Math.atan2(endRay - startRay, distanceM) * 180) / Math.PI,
            profileDistancesM,
            profileTerrainM,
            profileRayM,
            observerTerrainM: startTerrain,
            targetTerrainM: endTerrain,
            observerAbsHeightM: startRay,
            targetAbsHeightM: endRay,
            firstBlockingDistanceM,
            firstBlockingTerrainM,
            firstBlockingRayM,
            debugMessage: "",
          };
        }
      }
    }
  }

  const debugMessage = [
    `[LOS DEBUG] distanceM=${distanceM.toFixed(2)} samples=${samples} stepM~${samplingStepM.toFixed(2)}`,
    `ignoreNearObserverM=${ignoreNearObserverM.toFixed(2)}`,
    `observerLngLat=[${payload.observer.lng.toFixed(6)},${payload.observer.lat.toFixed(6)}] targetLngLat=[${payload.target.lng.toFixed(6)},${payload.target.lat.toFixed(6)}]`,
    `observerTerrainM=${startTerrain.toFixed(2)} observerHeightM=${observerHeightM.toFixed(2)} observerAbsM=${startRay.toFixed(2)}`,
    `targetTerrainM=${endTerrain.toFixed(2)} targetHeightM=${targetHeightM.toFixed(2)} targetAbsM=${endRay.toFixed(2)}`,
    `observerSampleDebug=${JSON.stringify(sampleElevationDebug(payload.observer.lng, payload.observer.lat))}`,
    `targetSampleDebug=${JSON.stringify(sampleElevationDebug(payload.target.lng, payload.target.lat))}`,
    `visible=${visible} blockedSamples=${blockingSamples.length}`,
    `blockingDetails=${JSON.stringify(
      blockingSamples.map((s, idx) => ({
        idx: idx + 1,
        distanceM: Number(s.distanceM.toFixed(2)),
        terrainM: Number(s.terrainM.toFixed(2)),
        rayM: Number(s.rayM.toFixed(2)),
        deltaM: Number(s.deltaM.toFixed(2)),
        lng: Number(s.point.lng.toFixed(6)),
        lat: Number(s.point.lat.toFixed(6)),
      }))
    )}`,
  ].join(" | ");

  return {
    visible,
    blockPoint,
    blockDistanceM,
    distanceM,
    distance3DM: Math.sqrt(distanceM ** 2 + (endRay - startRay) ** 2),
    azimuthDeg: bearing(payload.observer, payload.target),
    elevationDeg: (Math.atan2(endRay - startRay, distanceM) * 180) / Math.PI,
    profileDistancesM,
    profileTerrainM,
    profileRayM,
    observerTerrainM: startTerrain,
    targetTerrainM: endTerrain,
    observerAbsHeightM: startRay,
    targetAbsHeightM: endRay,
    firstBlockingDistanceM,
    firstBlockingTerrainM,
    firstBlockingRayM,
    debugMessage,
  };
}

function traceLosForCoverage(
  jobId: string,
  observerCtx: CoverageObserverContext,
  target: LonLat,
  targetHeightM: number
): {
  visible: boolean;
  targetTerrainM: number;
  targetAbsM: number;
  firstBlockingDistanceM: number | null;
  firstBlockingTerrainM: number | null;
  firstBlockingRayM: number | null;
} {
  const targetTerrain = sampleElevation(target.lng, target.lat);
  if (targetTerrain === null) {
    throw new Error("No elevation data at selected point");
  }

  const [tx, ty] = transformPoint(4326, observerCtx.workEpsg, target.lng, target.lat);
  const dx = tx - observerCtx.sx;
  const dy = ty - observerCtx.sy;
  const distanceM = Math.hypot(dx, dy);
  const samples = Math.max(2, Math.ceil(distanceM / observerCtx.samplingStepM));
  const endRay = targetTerrain + targetHeightM;

  for (let i = 1; i < samples; i += 1) {
    if (cancelledJobs.has(jobId)) throw new Error("cancelled");
    const t = i / samples;
    const x = observerCtx.sx + dx * t;
    const y = observerCtx.sy + dy * t;
    const [lng, lat] = transformPoint(observerCtx.workEpsg, 4326, x, y);
    const terrain = sampleElevation(lng, lat);
    if (terrain === null) throw new Error("No elevation data at selected point");

    const d = distanceM * t;
    if (d <= observerCtx.ignoreNearObserverM) continue;

    const ray = observerCtx.startRayM + (endRay - observerCtx.startRayM) * t;
    if (terrain > ray + LOS_CLEARANCE_EPSILON_M) {
      return {
        visible: false,
        targetTerrainM: targetTerrain,
        targetAbsM: endRay,
        firstBlockingDistanceM: d,
        firstBlockingTerrainM: terrain,
        firstBlockingRayM: ray,
      };
    }
  }

  return {
    visible: true,
    targetTerrainM: targetTerrain,
    targetAbsM: endRay,
    firstBlockingDistanceM: null,
    firstBlockingTerrainM: null,
    firstBlockingRayM: null,
  };
}

function computeLos(jobId: string, payload: LosObserverTarget): LosWorkerResult {
  const traced = traceLos(jobId, payload, true);
  return { id: jobId, ...traced };
}

function computeCoverage(jobId: string, payload: CoverageParams): CoverageWorkerResult {
  const ds = mustDataset();

  const observerHeightM = payload.observerHeightM;
  const targetHeightM = payload.targetHeightM;

  const gridEpsg = chooseGridEpsg(ds);
  const nativeResM = estimateNativeResolutionMeters(ds, gridEpsg);

  const effectiveCellSizeM = Math.max(
    1,
    Number.isFinite(payload.cellSizeM) && payload.cellSizeM > 0 ? payload.cellSizeM : nativeResM
  );
  const effectiveStepM = Math.max(
    1,
    Number.isFinite(payload.losStepM) && payload.losStepM > 0 ? payload.losStepM : nativeResM
  );
  const observerTerrain = sampleElevation(payload.observer.lng, payload.observer.lat);
  if (observerTerrain === null) {
    throw new Error("No elevation data at selected point");
  }
  const startRay = observerTerrain + observerHeightM;
  const [sx, sy] = transformPoint(4326, gridEpsg, payload.observer.lng, payload.observer.lat);
  const observerCtx: CoverageObserverContext = {
    observer: payload.observer,
    observerHeightM,
    startTerrainM: observerTerrain,
    startRayM: startRay,
    sx,
    sy,
    workEpsg: gridEpsg,
    samplingStepM: effectiveStepM,
    ignoreNearObserverM: Math.max(1, effectiveStepM * LOS_IGNORE_NEAR_OBSERVER_FACTOR),
  };

  const bounds = projectedBounds(payload, gridEpsg);
  const width = Math.max(1, Math.ceil((bounds.maxX - bounds.minX) / effectiveCellSizeM));
  const height = Math.max(1, Math.ceil((bounds.maxY - bounds.minY) / effectiveCellSizeM));

  let computedCount = 0;
  let blockedCount = 0;
  let invalidCount = 0;
  let minTerrainM = Number.POSITIVE_INFINITY;
  let maxTerrainM = Number.NEGATIVE_INFINITY;
  let sumTerrainM = 0;
  let terrainSampleCount = 0;
  let minBlockingDeltaM = Number.POSITIVE_INFINITY;
  let maxBlockingDeltaM = Number.NEGATIVE_INFINITY;
  const terrainDebugSamples: Array<{ lng: number; lat: number; terrainM: number }> = [];

  const features: GeoJSON.Feature<GeoJSON.Polygon, CoverageBlockedFeatureProps>[] = [];
  const blockedCellsDebug: Array<{
    row: number;
    col: number;
    lng: number;
    lat: number;
    targetTerrainM: number;
    targetAbsM: number;
    firstBlockingDistanceM: number | null;
    firstBlockingTerrainM: number | null;
    firstBlockingRayM: number | null;
    visible: boolean;
  }> = [];

  for (let row = 0; row < height; row += 1) {
    if (cancelledJobs.has(jobId)) throw new Error("cancelled");

    for (let col = 0; col < width; col += 1) {
      const cellMinX = bounds.minX + col * effectiveCellSizeM;
      const cellMaxX = Math.min(bounds.maxX, cellMinX + effectiveCellSizeM);
      const cellMaxY = bounds.maxY - row * effectiveCellSizeM;
      const cellMinY = Math.max(bounds.minY, cellMaxY - effectiveCellSizeM);

      const centerX = (cellMinX + cellMaxX) * 0.5;
      const centerY = (cellMinY + cellMaxY) * 0.5;

      const [lng, lat] = transformPoint(gridEpsg, 4326, centerX, centerY);
      const cornersProjected: Array<[number, number]> = [
        [centerX, centerY], // center
        [cellMinX, cellMinY], // SW
        [cellMinX, cellMaxY], // NW
        [cellMaxX, cellMinY], // SE
        [cellMaxX, cellMaxY], // NE
      ];
      const samplePoints = cornersProjected.map(([sx, sy]) => {
        const [plng, plat] = transformPoint(gridEpsg, 4326, sx, sy);
        return { lng: plng, lat: plat };
      });

      let validSamples = 0;
      let visibleSamples = 0;
      let firstBlockedLos: ReturnType<typeof traceLosForCoverage> | null = null;
      let representativeTargetTerrainM: number | null = null;
      let representativeTargetAbsM: number | null = null;

      for (const point of samplePoints) {
        const losCheck = traceLosForCoverage(jobId, observerCtx, point, targetHeightM);

        const terrainM = losCheck.targetTerrainM;
        validSamples += 1;
        minTerrainM = Math.min(minTerrainM, terrainM);
        maxTerrainM = Math.max(maxTerrainM, terrainM);
        sumTerrainM += terrainM;
        terrainSampleCount += 1;
        if (terrainDebugSamples.length < 10) {
          terrainDebugSamples.push({
            lng: Number(point.lng.toFixed(6)),
            lat: Number(point.lat.toFixed(6)),
            terrainM: Number(terrainM.toFixed(2)),
          });
        }

        representativeTargetTerrainM = losCheck.targetTerrainM;
        representativeTargetAbsM = losCheck.targetAbsM;

        if (losCheck.visible) {
          visibleSamples += 1;
          // Cell is visible if at least one sampled point is visible.
          break;
        } else if (!firstBlockedLos) {
          firstBlockedLos = losCheck;
        }
      }

      if (validSamples === 0) {
        invalidCount += 1;
        continue;
      }

      computedCount += 1;

      // Cell is blocked only if all sampled points are blocked.
      if (visibleSamples === 0) {
        blockedCount += 1;
        const blockedLos = firstBlockedLos;
        if (
          blockedLos &&
          blockedLos.firstBlockingTerrainM !== null &&
          blockedLos.firstBlockingRayM !== null
        ) {
          const deltaM = blockedLos.firstBlockingTerrainM - blockedLos.firstBlockingRayM;
          minBlockingDeltaM = Math.min(minBlockingDeltaM, deltaM);
          maxBlockingDeltaM = Math.max(maxBlockingDeltaM, deltaM);
        }
        if (blockedCellsDebug.length < COVERAGE_DEBUG_MAX_BLOCKED_CELLS) {
          blockedCellsDebug.push({
            row,
            col,
            lng,
            lat,
            targetTerrainM: representativeTargetTerrainM ?? 0,
            targetAbsM: representativeTargetAbsM ?? 0,
            firstBlockingDistanceM: blockedLos?.firstBlockingDistanceM ?? null,
            firstBlockingTerrainM: blockedLos?.firstBlockingTerrainM ?? null,
            firstBlockingRayM: blockedLos?.firstBlockingRayM ?? null,
            visible: false,
          });
        }

        if (payload.showHidden) {
          features.push(
            makeCellPolygon(
              row,
              col,
              bounds.minX,
              bounds.maxY,
              effectiveCellSizeM,
              gridEpsg
            )
          );
        }
      }
    }

    if (row % 4 === 0 || row === height - 1) {
      post({
        id: jobId,
        type: "coverage-progress",
        payload: { completedRows: row + 1, totalRows: height },
      });
    }
  }

  const observerAbs =
    observerTerrain === null ? null : observerTerrain + payload.observerHeightM;
  const observerInBbox = pointInBbox(
    payload.observer,
    payload.west,
    payload.south,
    payload.east,
    payload.north
  );
  const avgTerrainM = terrainSampleCount > 0 ? sumTerrainM / terrainSampleCount : null;
  const observerSampleDebug = sampleElevationDebug(payload.observer.lng, payload.observer.lat);
  const debugMessage = [
    `[COVERAGE DEBUG] bbox=[${payload.west},${payload.south},${payload.east},${payload.north}] grid=${width}x${height}`,
    `nativeResM=${nativeResM.toFixed(2)} effectiveCellSizeM=${effectiveCellSizeM.toFixed(2)} effectiveStepM=${effectiveStepM.toFixed(2)}`,
    `observerLngLat=[${payload.observer.lng.toFixed(6)},${payload.observer.lat.toFixed(6)}] observerInBbox=${observerInBbox}`,
    `observerTerrainM=${observerTerrain === null ? "null" : observerTerrain.toFixed(2)} observerHeightM=${payload.observerHeightM.toFixed(2)} observerAbsM=${observerAbs === null ? "null" : observerAbs.toFixed(2)}`,
    `observerSampleDebug=${JSON.stringify(observerSampleDebug)}`,
    `targetHeightM=${payload.targetHeightM.toFixed(2)} computedCount=${computedCount} blockedCount=${blockedCount} invalidCount=${invalidCount}`,
    `debugBlockedCellsShown=${blockedCellsDebug.length}/${blockedCount}`,
    `terrainSampleCount=${terrainSampleCount}`,
    `terrainStatsM=[min=${computedCount > 0 ? minTerrainM.toFixed(2) : "null"},max=${computedCount > 0 ? maxTerrainM.toFixed(2) : "null"},avg=${avgTerrainM === null ? "null" : avgTerrainM.toFixed(2)}]`,
    `blockingDeltaStatsM=[min=${Number.isFinite(minBlockingDeltaM) ? minBlockingDeltaM.toFixed(2) : "null"},max=${Number.isFinite(maxBlockingDeltaM) ? maxBlockingDeltaM.toFixed(2) : "null"}]`,
    `terrainDebugSamples=${JSON.stringify(terrainDebugSamples)}`,
    `blockedCells=${JSON.stringify(
      blockedCellsDebug.map((c, idx) => ({
        idx: idx + 1,
        row: c.row,
        col: c.col,
        lng: Number(c.lng.toFixed(6)),
        lat: Number(c.lat.toFixed(6)),
        targetTerrainM: Number(c.targetTerrainM.toFixed(2)),
        targetAbsM: Number(c.targetAbsM.toFixed(2)),
        firstBlockingDistanceM:
          c.firstBlockingDistanceM === null ? null : Number(c.firstBlockingDistanceM.toFixed(2)),
        firstBlockingTerrainM:
          c.firstBlockingTerrainM === null ? null : Number(c.firstBlockingTerrainM.toFixed(2)),
        firstBlockingRayM:
          c.firstBlockingRayM === null ? null : Number(c.firstBlockingRayM.toFixed(2)),
      }))
    )}`,
  ].join(" | ");

  return {
    id: jobId,
    visibleFraction: computedCount > 0 ? (computedCount - blockedCount) / computedCount : 0,
    blockedFraction: computedCount > 0 ? blockedCount / computedCount : 0,
    nativeResM,
    effectiveCellSizeM,
    effectiveStepM,
    computedCount,
    blockedCount,
    invalidCount,
    features,
    debugMessage,
    bboxWgs84: {
      west: payload.west,
      south: payload.south,
      east: payload.east,
      north: payload.north,
    },
  };
}

async function initTerrain(id: string, buffer: ArrayBuffer): Promise<void> {
  post({ id, type: "init-progress", payload: { stage: "opening-geotiff" } });

  const tiff = await fromArrayBuffer(buffer);
  const image = await tiff.getImage();

  post({ id, type: "init-progress", payload: { stage: "reading-raster" } });

  const read = await image.readRasters({ samples: [0], interleave: true });
  const data = readRasterResult(read);

  const width = image.getWidth();
  const height = image.getHeight();

  const nodataRaw = image.getGDALNoData();
  const nodata = nodataRaw === null || nodataRaw === undefined ? null : Number(nodataRaw);

  const epsg = inferEpsg(image);
  const [minX, minY, maxX, maxY] = image.getBoundingBox();
  const [west, south] = toWgs84Point(epsg, minX, minY);
  const [east, north] = toWgs84Point(epsg, maxX, maxY);

  const resolution = image.getResolution();
  const xRes = Number(resolution?.[0]) || (maxX - minX) / width;
  const yRes = Number(resolution?.[1]) || -Math.abs((maxY - minY) / height);

  dataset = {
    width,
    height,
    data,
    nodata,
    epsg,
    nativeBounds: { minX, minY, maxX, maxY },
    bboxWgs84: {
      west: Math.min(west, east),
      south: Math.min(south, north),
      east: Math.max(west, east),
      north: Math.max(south, north),
    },
    xRes,
    yRes,
  };

  post({ id, type: "init-ok", payload: { meta: buildMeta(dataset) } });
}

self.onmessage = async (ev: MessageEvent<MsgIn>) => {
  const msg = ev.data;

  try {
    if (msg.type === "cancel") {
      if (msg.payload?.jobId) cancelledJobs.add(msg.payload.jobId);
      else cancelledJobs.add(msg.id);

      post({ id: msg.id, type: "cancelled", payload: { jobId: msg.payload?.jobId } });
      return;
    }

    if (msg.type === "dispose") {
      dataset = null;
      cancelledJobs.clear();
      post({ id: msg.id, type: "cancelled", payload: {} });
      return;
    }

    if (msg.type === "init") {
      await initTerrain(msg.id, msg.payload.buffer);
      cancelledJobs.delete(msg.id);
      return;
    }

    if (msg.type === "los") {
      const result = computeLos(msg.id, msg.payload);
      post({ id: msg.id, type: "los-done", payload: result });
      cancelledJobs.delete(msg.id);
      return;
    }

    if (msg.type === "coverage") {
      const result = computeCoverage(msg.id, msg.payload);
      post({ id: msg.id, type: "coverage-done", payload: result });
      cancelledJobs.delete(msg.id);
      return;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown terrain worker error";

    if (message === "cancelled") {
      post({ id: msg.id, type: "cancelled", payload: { jobId: msg.id } });
      cancelledJobs.delete(msg.id);
      return;
    }

    if (msg.type === "init") {
      post({ id: msg.id, type: "init-error", payload: { message } });
    } else if (msg.type === "coverage") {
      post({ id: msg.id, type: "coverage-error", payload: { message } });
    } else {
      post({ id: msg.id, type: "los-error", payload: { message } });
    }

    cancelledJobs.delete(msg.id);
  }
};