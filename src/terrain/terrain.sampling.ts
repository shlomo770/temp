import type { CoverageQualityPreset, LosSamplingPreset } from "./terrain.types";

export const LOS_STEP_BY_PRESET: Record<LosSamplingPreset, number> = {
  low: 60,
  medium: 30,
  high: 12,
};

export const COVERAGE_CELL_SIZE_M = 10;

export const COVERAGE_LOS_STEP_BY_PRESET: Record<CoverageQualityPreset, number> = {
  low: 10,
  medium: 10,
  high: 10,
};

export const COVERAGE_GRID_BY_PRESET: Record<
  CoverageQualityPreset,
  { width: number; height: number; losStepM: number }
> = {
  low: { width: 160, height: 160, losStepM: COVERAGE_LOS_STEP_BY_PRESET.low },
  medium: { width: 256, height: 256, losStepM: COVERAGE_LOS_STEP_BY_PRESET.medium },
  high: { width: 384, height: 384, losStepM: COVERAGE_LOS_STEP_BY_PRESET.high },
};
