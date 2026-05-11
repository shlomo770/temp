import type { MsgIn, MsgOut } from "./terrain.workerProtocol";
import type { CoverageParams, CoverageWorkerResult, LosObserverTarget, LosWorkerResult, TerrainMeta } from "./terrain.types";

type Pending = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  kind: "init" | "los" | "coverage";
};

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export class TerrainWorkerClient {
  private worker: Worker;
  private pending = new Map<string, Pending>();
  private onInitProgress?: (stage: string) => void;
  private onCoverageProgress?: (completedRows: number, totalRows: number) => void;
  private lastJobId: string | null = null;

  constructor() {
    this.worker = new Worker(new URL("./terrain.worker.ts", import.meta.url), { type: "module" });
    this.worker.onmessage = (ev: MessageEvent<MsgOut>) => {
      const msg = ev.data;
      if (msg.type === "init-progress") {
        this.onInitProgress?.(msg.payload.stage);
        return;
      }
      if (msg.type === "coverage-progress") {
        this.onCoverageProgress?.(msg.payload.completedRows, msg.payload.totalRows);
        return;
      }

      const pending = this.pending.get(msg.id);
      if (!pending) return;

      if (msg.type === "init-ok") {
        this.pending.delete(msg.id);
        pending.resolve(msg.payload.meta);
        return;
      }
      if (msg.type === "los-done") {
        this.pending.delete(msg.id);
        pending.resolve(msg.payload);
        return;
      }
      if (msg.type === "coverage-done") {
        this.pending.delete(msg.id);
        pending.resolve(msg.payload);
        return;
      }
      if (msg.type === "cancelled") {
        this.pending.delete(msg.id);
        pending.reject(new Error("cancelled"));
        return;
      }
      this.pending.delete(msg.id);
      pending.reject(new Error(msg.payload.message));
    };
  }

  getLastJobId(): string | null {
    return this.lastJobId;
  }

  setInitProgressListener(listener: (stage: string) => void): void {
    this.onInitProgress = listener;
  }

  setCoverageProgressListener(listener: (completedRows: number, totalRows: number) => void): void {
    this.onCoverageProgress = listener;
  }

  init(buffer: ArrayBuffer): Promise<TerrainMeta> {
    const id = nextId("init");
    this.lastJobId = id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, kind: "init" });
      const msg: MsgIn = { id, type: "init", payload: { buffer } };
      this.worker.postMessage(msg, [buffer]);
    }) as Promise<TerrainMeta>;
  }

  computeLos(payload: LosObserverTarget): Promise<LosWorkerResult> {
    const id = nextId("los");
    this.lastJobId = id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, kind: "los" });
      this.worker.postMessage({ id, type: "los", payload } satisfies MsgIn);
    }) as Promise<LosWorkerResult>;
  }

  computeCoverage(payload: CoverageParams): Promise<CoverageWorkerResult> {
    const id = nextId("coverage");
    this.lastJobId = id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, kind: "coverage" });
      this.worker.postMessage({ id, type: "coverage", payload } satisfies MsgIn);
    }) as Promise<CoverageWorkerResult>;
  }

  cancel(jobId?: string): void {
    this.worker.postMessage({
      id: nextId("cancel"),
      type: "cancel",
      payload: { jobId },
    } satisfies MsgIn);
  }

  terminate(): void {
    this.pending.forEach((pending) => pending.reject(new Error("terminated")));
    this.pending.clear();
    this.worker.terminate();
  }
}
