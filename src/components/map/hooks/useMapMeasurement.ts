// import { useEffect, useState } from "react";
// import { MapService } from "../../../services/map/MapService";
// import { calculateDistance, formatDistance } from "../../../utils/geometry";
// import { attachUnifiedMapClick, detachUnifiedMapClick } from "../../../utils/mapEvents";

// type UseMapMeasurementParams = {
//   mapServiceRef: React.MutableRefObject<MapService | null>;
//   isMeasuring: boolean;
//   measurePoints: { lng: number; lat: number }[];
//   setMeasurePoints: React.Dispatch<React.SetStateAction<{ lng: number; lat: number }[]>>;
// };

// export const useMapMeasurement = ({
//   mapServiceRef,
//   isMeasuring,
//   measurePoints,
//   setMeasurePoints,
// }: UseMapMeasurementParams) => {
//   const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

//   useEffect(() => {
//     if (!isMeasuring || !mapServiceRef.current) {
//       if (measurePoints.length === 2 && !isMeasuring) {
//         setMeasurePoints([]);
//       }
//       return;
//     }
//     const map = (mapServiceRef.current as any).map;
//     if (!map) return;
//     const handleClick = (e: any) => {
//       if (measurePoints.length < 2) {
//         setMeasurePoints(prev => [...prev, { lng: e.lngLat.lng, lat: e.lngLat.lat }]);
//       }
//     };
//     const wrappedClickHandler = attachUnifiedMapClick(map, handleClick);
//     return () => { detachUnifiedMapClick(map, wrappedClickHandler); };
//   }, [isMeasuring, measurePoints, setMeasurePoints, mapServiceRef]);

//   useEffect(() => {
//     if (!mapServiceRef.current) return;
//     mapServiceRef.current.renderMeasurement(measurePoints);
//   }, [mapServiceRef, measurePoints]);

//   useEffect(() => {
//     if (!isMeasuring || !mapServiceRef.current) {
//       setTooltip(null);
//       mapServiceRef.current?.clearMeasurement();
//       return;
//     }

//     const map = (mapServiceRef.current as any).map;
//     if (!map) return;

//     if (measurePoints.length === 1) {
//       const handleMove = (e: any) => {
//         const mid = {
//           lng: (measurePoints[0].lng + e.lngLat.lng) / 2,
//           lat: (measurePoints[0].lat + e.lngLat.lat) / 2
//         };
//         const pixel = map.project([mid.lng, mid.lat]);
//         const dist = calculateDistance(measurePoints[0], { lng: e.lngLat.lng, lat: e.lngLat.lat });
//         setTooltip({ x: pixel.x, y: pixel.y, text: formatDistance(dist) });
//         mapServiceRef.current?.renderMeasurementPreview(measurePoints[0], { lng: e.lngLat.lng, lat: e.lngLat.lat });
//       };
//       map.on("mousemove", handleMove);
//       return () => {
//         map.off("mousemove", handleMove);
//         mapServiceRef.current?.clearMeasurementPreview();
//         setTooltip(null);
//       };
//     }

//     if (measurePoints.length === 2) {
//       const mid = {
//         lng: (measurePoints[0].lng + measurePoints[1].lng) / 2,
//         lat: (measurePoints[0].lat + measurePoints[1].lat) / 2
//       };
//       const pixel = map.project([mid.lng, mid.lat]);
//       const dist = calculateDistance(measurePoints[0], measurePoints[1]);
//       setTooltip({ x: pixel.x, y: pixel.y, text: formatDistance(dist) });
//       mapServiceRef.current?.clearMeasurementPreview();
//     }
//     if (measurePoints.length === 0) {
//       setTooltip(null);
//       mapServiceRef.current?.clearMeasurementPreview();
//     }
//   }, [isMeasuring, measurePoints, mapServiceRef]);

//   useEffect(() => {
//     if (!isMeasuring) {
//       mapServiceRef.current?.clearMeasurement();
//     }
//   }, [isMeasuring, mapServiceRef]);

//   return { tooltip };
// };



import { useEffect, useMemo, useRef, useState } from "react";
import { MapService } from "../../../services/map/MapService";
import { calculateCenter, calculateDistance, calculatePolygonArea, formatArea, formatDistance } from "../../../utils/geometry";
import { attachUnifiedMapClick, detachUnifiedMapClick } from "../../../utils/mapEvents";

type UseMapMeasurementParams = {
  mapServiceRef: React.MutableRefObject<MapService | null>;
  measurementMode: "measure" | "measure-area" | null;
  measurePoints: { lng: number; lat: number }[];
  setMeasurePoints: React.Dispatch<React.SetStateAction<{ lng: number; lat: number }[]>>;
};

export const useMapMeasurement = ({
  mapServiceRef,
  measurementMode,
  measurePoints,
  setMeasurePoints,
}: UseMapMeasurementParams) => {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [finishedMode, setFinishedMode] = useState<"measure" | "measure-area" | null>(null);
  const [finishedPoints, setFinishedPoints] = useState<{ lng: number; lat: number }[]>([]);
  const prevModeRef = useRef<"measure" | "measure-area" | null>(null);
  const measurementUiState = useMemo(() => {
    if (!measurementMode || isFinished) return null;
    if (measurementMode === "measure" && measurePoints.length >= 2) {
      const anchor = measurePoints[measurePoints.length - 1];
      return { mode: "measure", anchor, canFinish: true };
    }
    if (measurementMode === "measure-area" && measurePoints.length >= 3) {
      const anchor = measurePoints[measurePoints.length - 1];
      return { mode: "measure-area", anchor, canFinish: true };
    }
    return { mode: measurementMode, anchor: measurePoints[0], canFinish: false };
  }, [measurementMode, measurePoints, isFinished]);

  useEffect(() => {
    if (measurementMode && prevModeRef.current !== measurementMode) {
      setMeasurePoints([]);
      setIsFinished(false);
      setFinishedMode(null);
      setFinishedPoints([]);
      mapServiceRef.current?.clearMeasurement();
      mapServiceRef.current?.clearAreaMeasurement();
      setTooltip(null);
    }
    if (!measurementMode) {
      mapServiceRef.current?.clearMeasurementPreview();
      mapServiceRef.current?.clearAreaMeasurementPreview();
      if (!isFinished) {
        setTooltip(null);
      }
    }
    prevModeRef.current = measurementMode;
  }, [measurementMode, mapServiceRef, setMeasurePoints, isFinished]);

  useEffect(() => {
    if (!measurementMode || !mapServiceRef.current || isFinished) return;
    const map = (mapServiceRef.current as any).map;
    if (!map) return;
    const handleClick = (e: any) => {
      if (measurementMode === "measure") {
        if (measurePoints.length < 2) {
          setMeasurePoints(prev => [...prev, { lng: e.lngLat.lng, lat: e.lngLat.lat }]);
        }
        return;
      }
      if (measurementMode === "measure-area") {
        setMeasurePoints(prev => [...prev, { lng: e.lngLat.lng, lat: e.lngLat.lat }]);
      }
    };
    const wrappedClickHandler = attachUnifiedMapClick(map, handleClick);
    return () => { detachUnifiedMapClick(map, wrappedClickHandler); };
  }, [measurementMode, measurePoints, setMeasurePoints, mapServiceRef, isFinished]);

  useEffect(() => {
    if (!mapServiceRef.current) return;
    if (measurementMode === "measure") {
      mapServiceRef.current.renderMeasurement(measurePoints);
      mapServiceRef.current.clearAreaMeasurement();
      return;
    }
    if (measurementMode === "measure-area") {
      mapServiceRef.current.renderAreaMeasurement(measurePoints);
      mapServiceRef.current.clearMeasurement();
      return;
    }
  }, [mapServiceRef, measurePoints, measurementMode]);

  useEffect(() => {
    if (!measurementMode || !mapServiceRef.current || isFinished) return;

    const map = (mapServiceRef.current as any).map;
    if (!map) return;

    if (measurementMode === "measure") {
      if (measurePoints.length === 1) {
        const handleMove = (e: any) => {
          const mid = {
            lng: (measurePoints[0].lng + e.lngLat.lng) / 2,
            lat: (measurePoints[0].lat + e.lngLat.lat) / 2
          };
          const pixel = map.project([mid.lng, mid.lat]);
          const dist = calculateDistance(measurePoints[0], { lng: e.lngLat.lng, lat: e.lngLat.lat });
          setTooltip({ x: pixel.x, y: pixel.y, text: formatDistance(dist) });
          mapServiceRef.current?.renderMeasurementPreview(measurePoints[0], { lng: e.lngLat.lng, lat: e.lngLat.lat });
        };
        map.on("mousemove", handleMove);
        return () => {
          map.off("mousemove", handleMove);
          mapServiceRef.current?.clearMeasurementPreview();
          setTooltip(null);
        };
      }

      if (measurePoints.length === 2) {
        const mid = {
          lng: (measurePoints[0].lng + measurePoints[1].lng) / 2,
          lat: (measurePoints[0].lat + measurePoints[1].lat) / 2
        };
        const pixel = map.project([mid.lng, mid.lat]);
        const dist = calculateDistance(measurePoints[0], measurePoints[1]);
        setTooltip({ x: pixel.x, y: pixel.y, text: formatDistance(dist) });
        mapServiceRef.current?.clearMeasurementPreview();
      }
      if (measurePoints.length === 0) {
        setTooltip(null);
        mapServiceRef.current?.clearMeasurementPreview();
      }
      return;
    }

    if (measurementMode === "measure-area") {
      if (measurePoints.length >= 2) {
        const handleMove = (e: any) => {
          const previewPoints = [...measurePoints, { lng: e.lngLat.lng, lat: e.lngLat.lat }];
          const area = calculatePolygonArea(previewPoints);
          const center = calculateCenter(previewPoints);
          const pixel = map.project([center.lng, center.lat]);
          if (previewPoints.length >= 3) {
            setTooltip({ x: pixel.x, y: pixel.y, text: formatArea(area) });
          }
          mapServiceRef.current?.renderAreaMeasurementPreview(measurePoints, { lng: e.lngLat.lng, lat: e.lngLat.lat });
        };
        map.on("mousemove", handleMove);
        return () => {
          map.off("mousemove", handleMove);
          mapServiceRef.current?.clearAreaMeasurementPreview();
        };
      }

      if (measurePoints.length >= 3) {
        const center = calculateCenter(measurePoints);
        const pixel = map.project([center.lng, center.lat]);
        const area = calculatePolygonArea(measurePoints);
        setTooltip({ x: pixel.x, y: pixel.y, text: formatArea(area) });
        mapServiceRef.current?.clearAreaMeasurementPreview();
        return;
      }

      setTooltip(null);
      mapServiceRef.current?.clearAreaMeasurementPreview();
    }
  }, [measurementMode, measurePoints, mapServiceRef, isFinished]);

  const finishMeasurement = () => {
    if (!measurementMode) return;
    setIsFinished(true);
    setFinishedMode(measurementMode);
    setFinishedPoints(measurePoints);
    mapServiceRef.current?.clearMeasurementPreview();
    mapServiceRef.current?.clearAreaMeasurementPreview();
  };

  useEffect(() => {
    if (!isFinished || !mapServiceRef.current || !finishedMode) return;
    const map = (mapServiceRef.current as any).map;
    if (!map) return;

    const updateTooltip = () => {
      if (finishedMode === "measure" && finishedPoints.length >= 2) {
        const mid = {
          lng: (finishedPoints[0].lng + finishedPoints[1].lng) / 2,
          lat: (finishedPoints[0].lat + finishedPoints[1].lat) / 2
        };
        const pixel = map.project([mid.lng, mid.lat]);
        const dist = calculateDistance(finishedPoints[0], finishedPoints[1]);
        setTooltip({ x: pixel.x, y: pixel.y, text: formatDistance(dist) });
      }
      if (finishedMode === "measure-area" && finishedPoints.length >= 3) {
        const center = calculateCenter(finishedPoints);
        const pixel = map.project([center.lng, center.lat]);
        const area = calculatePolygonArea(finishedPoints);
        setTooltip({ x: pixel.x, y: pixel.y, text: formatArea(area) });
      }
    };

    updateTooltip();
    map.on("move", updateTooltip);
    map.on("zoom", updateTooltip);
    map.on("rotate", updateTooltip);
    return () => {
      map.off("move", updateTooltip);
      map.off("zoom", updateTooltip);
      map.off("rotate", updateTooltip);
    };
  }, [isFinished, finishedMode, finishedPoints, mapServiceRef]);

  return { tooltip, measurementUiState, finishMeasurement };
};
