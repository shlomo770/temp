export type TerrainLoadPhase =
  | "idle"
  | "loading-cache"
  | "loading-public"
  | "parsing"
  | "ready"
  | "error";

export type TerrainSource = "cache" | "public" | null;

export type CoverageQualityPreset = "low" | "medium" | "high";
export type LosSamplingPreset = "low" | "medium" | "high";

export interface LonLat {
  lng: number;
  lat: number;
}

export interface TerrainBBoxWgs84 {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface TerrainMeta {
  width: number;
  height: number;
  bboxWgs84: TerrainBBoxWgs84;
  nodata: number | null;
  epsg: number | null;
}

export interface LosObserverTarget {
  observer: LonLat;
  observerHeightM: number;
  target: LonLat;
  targetHeightM: number;
  stepM: number;
}

export interface LosWorkerResult {
  id: string;
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
  debugMessage?: string;
}

export interface CoverageParams {
  west: number;
  south: number;
  east: number;
  north: number;
  observer: LonLat;
  observerHeightM: number;
  targetHeightM: number;
  cellSizeM: number;
  losStepM: number;
  showHidden: boolean;
  showSeen: boolean;
}

export interface CoverageBlockedFeatureProps {
  kind: "blocked";
}

export interface CoverageWorkerResult {
  id: string;
  visibleFraction: number;
  blockedFraction: number;
  nativeResM: number;
  effectiveCellSizeM: number;
  effectiveStepM: number;
  computedCount: number;
  blockedCount: number;
  invalidCount: number;
  features: GeoJSON.Feature<GeoJSON.Polygon, CoverageBlockedFeatureProps>[];
  bboxWgs84: TerrainBBoxWgs84;
  debugMessage?: string;
}

export interface TerrainState {
  phase: TerrainLoadPhase;
  source: TerrainSource;
  error: string | null;
  terrainReady: boolean;
  meta: TerrainMeta | null;
}
