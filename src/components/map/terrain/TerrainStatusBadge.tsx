import type { TerrainState } from "../../../terrain/terrain.types";

interface Props {
  state: TerrainState;
}

export default function TerrainStatusBadge({ state }: Props) {
  const phaseLabel: Record<TerrainState["phase"], string> = {
    idle: "Idle",
    "loading-cache": "Loading...",
    "loading-public": "Loading...",
    parsing: "Parsing...",
    ready: "Ready",
    error: "Error",
  };
  const phaseColor: Record<TerrainState["phase"], string> = {
    idle: "bg-gray-500",
    "loading-cache": "bg-blue-600",
    "loading-public": "bg-blue-600",
    parsing: "bg-amber-600",
    ready: "bg-emerald-600",
    error: "bg-red-600",
  };
  return (
    <div className="flex items-center gap-2">
      <span className={`px-2 py-1 rounded text-xs text-white ${phaseColor[state.phase]}`}>{phaseLabel[state.phase]}</span>
      <span className="px-2 py-1 rounded text-xs border border-gray-500 text-gray-200">
        {state.source ? state.source[0].toUpperCase() + state.source.slice(1) : "Source -"}
      </span>
    </div>
  );
}
