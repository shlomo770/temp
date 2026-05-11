import type {
  CoverageParams,
  CoverageWorkerResult,
  LosObserverTarget,
  LosWorkerResult,
  TerrainMeta,
} from "./terrain.types";

export type MsgIn =
  | { id: string; type: "init"; payload: { buffer: ArrayBuffer } }
  | { id: string; type: "los"; payload: LosObserverTarget }
  | { id: string; type: "coverage"; payload: CoverageParams }
  | { id: string; type: "cancel"; payload?: { jobId?: string } }
  | { id: string; type: "dispose" };

export type MsgOut =
  | { id: string; type: "init-progress"; payload: { stage: string } }
  | { id: string; type: "init-ok"; payload: { meta: TerrainMeta } }
  | { id: string; type: "init-error"; payload: { message: string } }
  | { id: string; type: "los-done"; payload: LosWorkerResult }
  | { id: string; type: "los-error"; payload: { message: string } }
  | { id: string; type: "coverage-progress"; payload: { completedRows: number; totalRows: number } }
  | { id: string; type: "coverage-done"; payload: CoverageWorkerResult }
  | { id: string; type: "coverage-error"; payload: { message: string } }
  | { id: string; type: "cancelled"; payload: { jobId?: string } };
