export type Device = string;
export type UiSeverity = "CRITICAL" | "NON_CRITICAL";

export type CodebookEntry = {
  description: string;
  severity: UiSeverity;
  masterCaution?: boolean;
  category?: string;
};

export type Codebook = Record<Device, Record<string, CodebookEntry>>;

let cache: Codebook | null = null;

export async function loadCodebook(url = "/fault-codebook.json"): Promise<Codebook> {
  if (cache) return cache;
  const res = await fetch(url);
  if (!res.ok) throw new Error("failed to load codebook");
  cache = (await res.json()) as Codebook;
  return cache;
}

export function lookup(cb: Codebook, device: Device, code: number | string): CodebookEntry | null {  
  return cb[device]?.[String(code)] ?? null;
}

