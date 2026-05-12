import type { RadarStatusE, RadarStateE } from "../../enums/statusBar.enum";

export interface RadarValues {
  state: RadarStatusE;
  mode: RadarStateE;
  workRoom: number;
  missionCategory: number;
  freqIndex: number;
  min_elevation: number;
  blanking_sectors: number;
}

export interface RadarState {
  serverValues: RadarValues;
  formValues: RadarValues;
  mismatches: Partial<Record<keyof RadarValues, boolean>>;
  isFormOpen: boolean;
  status: RadarStatusE | null;
  radarNonCoverage: string[] | null;
  radarRange: number;
}
