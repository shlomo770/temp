const DB_NAME = "terrain-cache-db";
const STORE = "terrain";
const KEY = "dtm-buffer-v1";
const CACHE_VERSION = 2;

export interface TerrainCacheMeta {
  fileName: string;
  savedAt: number;
  byteLength: number;
  cacheVersion: number;
  checksum?: string;
}

interface TerrainCacheRecord {
  key: string;
  buffer: ArrayBuffer;
  meta: TerrainCacheMeta;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveTerrainBuffer(
  buffer: ArrayBuffer,
  meta: Omit<TerrainCacheMeta, "cacheVersion">
): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const record: TerrainCacheRecord = {
      key: KEY,
      buffer,
      meta: { ...meta, cacheVersion: CACHE_VERSION },
    };
    store.put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadTerrainBuffer(): Promise<{ buffer: ArrayBuffer; meta: TerrainCacheMeta } | null> {
  const db = await openDb();
  const record = await new Promise<TerrainCacheRecord | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(KEY);
    req.onsuccess = () => resolve((req.result as TerrainCacheRecord | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  if (!record || record.meta.cacheVersion !== CACHE_VERSION) {
    return null;
  }
  return { buffer: record.buffer, meta: record.meta };
}

export async function clearTerrainCache(): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
