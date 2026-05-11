import { clearTerrainCache, loadTerrainBuffer, saveTerrainBuffer } from "./terrain.cache";
import { TerrainWorkerClient } from "./terrain.workerClient";
import type { CoverageParams, CoverageWorkerResult, LosObserverTarget, LosWorkerResult, TerrainState } from "./terrain.types";

type Listener = (state: TerrainState) => void;

const INITIAL_STATE: TerrainState = {
  phase: "idle",
  source: null,
  error: null,
  terrainReady: false,
  meta: null,
};

class TerrainService {
  private worker = new TerrainWorkerClient();
  private state: TerrainState = { ...INITIAL_STATE };
  private listeners = new Set<Listener>();
  private currentJobId: string | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.worker.setInitProgressListener(() => {
      this.patch({ phase: "parsing", error: null });
    });
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private patch(partial: Partial<TerrainState>): void {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((listener) => listener(this.state));
  }

  getTerrainState(): TerrainState {
    return this.state;
  }

  getTerrainMeta() {
    return this.state.meta;
  }

  private async fetchFromPublic(): Promise<ArrayBuffer> {
    const paths = ["/DTM.TIF", "/DTM.tif"];
    for (const path of paths) {
      const response = await fetch(path, { cache: "no-cache" });
      if (response.ok) {
        return response.arrayBuffer();
      }
    }
    throw new Error("DTM file could not be loaded (expected in public as DTM.TIF)");
  }

  async initTerrain(): Promise<void> {
    if (this.state.terrainReady) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        this.patch({ phase: "loading-public", source: "public" });
        try {
          const buffer = await this.fetchFromPublic();
          await saveTerrainBuffer(buffer.slice(0), {
            fileName: "DTM.TIF",
            savedAt: Date.now(),
            byteLength: buffer.byteLength,
          });
          const meta = await this.worker.init(buffer);
          this.patch({ phase: "ready", source: "public", terrainReady: true, meta, error: null });
          return;
        } catch {
          this.patch({ phase: "loading-cache", error: null, source: null });
          const cached = await loadTerrainBuffer();
          if (cached?.buffer) {
            const meta = await this.worker.init(cached.buffer);
            this.patch({ phase: "ready", source: "cache", terrainReady: true, meta, error: null });
            return;
          }
          throw new Error("DTM file could not be loaded from public or cache");
        }
      } catch (error) {
        this.patch({
          phase: "error",
          error: error instanceof Error ? error.message : "DTM parsing failed",
          terrainReady: false,
        });
        throw error;
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  async reloadTerrainFromPublic(): Promise<void> {
    this.cancelCurrentJob();
    this.patch({ phase: "loading-public", source: "public", error: null, terrainReady: false });
    const buffer = await this.fetchFromPublic();
    await saveTerrainBuffer(buffer.slice(0), {
      fileName: "DTM.TIF",
      savedAt: Date.now(),
      byteLength: buffer.byteLength,
    });
    const meta = await this.worker.init(buffer);
    this.patch({ phase: "ready", terrainReady: true, meta, source: "public", error: null });
  }

  async ensureTerrainReady(): Promise<void> {
    if (!this.state.terrainReady) {
      await this.initTerrain();
    }
    if (!this.state.terrainReady) {
      throw new Error(this.state.error || "DTM parsing failed");
    }
  }

  async computeLos(params: LosObserverTarget): Promise<LosWorkerResult> {
    await this.ensureTerrainReady();
    this.cancelCurrentJob();
    const promise = this.worker.computeLos(params);
    this.currentJobId = this.worker.getLastJobId();
    return promise;
  }

  async computeCoverage(params: CoverageParams): Promise<CoverageWorkerResult> {
    await this.ensureTerrainReady();
    this.cancelCurrentJob();
    const promise = this.worker.computeCoverage(params);
    this.currentJobId = this.worker.getLastJobId();
    return promise;
  }

  cancelCurrentJob(): void {
    if (!this.currentJobId) return;
    this.worker.cancel(this.currentJobId);
    this.currentJobId = null;
  }

  async clearCache(): Promise<void> {
    await clearTerrainCache();
  }

  disposeTerrain(): void {
    this.cancelCurrentJob();
    this.worker.terminate();
    this.patch({ ...INITIAL_STATE });
  }
}

let singleton: TerrainService | null = null;

export function getTerrainService(): TerrainService {
  if (!singleton) {
    singleton = new TerrainService();
  }
  return singleton;
}
