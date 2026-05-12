import { useEffect } from "react";
import type { Map } from "maplibre-gl";
import { useAppSelector } from "../../../../hooks/useAppSelector";
import { drawLOS } from "./MapSectorLosManager";


type Props = {
  map: Map | null;
};

export default function AdvancedLineOfSightLayer({ map }: Props) {
  const los = useAppSelector((s: any) => s.los);

  useEffect(() => {
    if (!map) return;
    drawLOS(map, los);
  }, [map, los]);

  return null;
}