import { RadarStateE, RadarStatusE } from "../../enums/statusBar.enum";
import type { RadarValues } from "./radarModel";

/** שדות פרמטרי מכ״ם שנשלחים/מתקבלים מול השרת */
export const RADAR_PARAM_KEYS = [
  "mode",
  "missionCategory",
  "freqIndex",
  "min_elevation",
  "blanking_sectors",
] as const satisfies readonly (keyof RadarValues)[];

export type RadarParamKey = (typeof RADAR_PARAM_KEYS)[number];

export type RadarParamsPatch = Pick<
  RadarValues,
  "mode" | "missionCategory" | "freqIndex" | "min_elevation" | "blanking_sectors"
>;

function num(v: unknown): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  const n = typeof v === "number" ? v : Number.parseInt(String(v), 10);
  return Number.isFinite(n) ? n : undefined;
}

/** נרמול הודעת RADAR_PARAMS / RADAR_PARAMS_UPDATE / קטעים דומים מ-RADAR_STATUS */
export function normalizeInboundRadarParamsWire(data: unknown): Partial<RadarParamsPatch> {
  if (data == null || typeof data !== "object") return {};
  const d = data as Record<string, unknown>;
  const out: Partial<RadarParamsPatch> = {};

  const rm = d.radar_mode ?? d.radarMode;
  const nMode = num(rm);
  if (
    nMode !== undefined &&
    nMode >= RadarStateE.OFF &&
    nMode <= RadarStateE.OPERATE
  ) {
    out.mode = nMode as RadarStateE;
  }

  const mc = d.mission_category ?? d.missionCategory;
  const nMc = num(mc);
  if (nMc !== undefined) out.missionCategory = nMc;

  const fi = d.freq_index ?? d.freqIndex;
  const nFi = num(fi);
  if (nFi !== undefined) out.freqIndex = nFi;

  const me = d.min_elevation ?? d.minElevation;
  const nMe = num(me);
  if (nMe !== undefined) out.min_elevation = nMe;

  const bs = d.blanking_sectors ?? d.blankingSectors;
  const nBs = num(bs);
  if (nBs !== undefined) out.blanking_sectors = nBs;

  return out;
}

/** מצב תצוגה בסרגל (לא מצב מבצעי של המכ״ם) */
export function mapRadarWireStateToStatus(s: unknown): RadarStatusE | undefined {
  if (typeof s === "number" && Number.isInteger(s) && s >= RadarStatusE.NO_COMM && s <= RadarStatusE.OK) {
    return s as RadarStatusE;
  }
  if (typeof s === "string" && s in RadarStatusE) {
    return RadarStatusE[s as keyof typeof RadarStatusE] as unknown as RadarStatusE;
  }
  return undefined;
}

export function buildSetRadarParamsPayload(fv: RadarValues) {
  return {
    radar_mode: fv.mode,
    mission_category: fv.missionCategory,
    freq_index: fv.freqIndex,
    min_elevation: fv.min_elevation,
    blanking_sectors: fv.blanking_sectors,
  };
}
