import React, { useEffect, useRef, useState } from "react";
import { TbZoomPan, TbMapStar } from "react-icons/tb";
import { useAppSelector } from '../../../hooks/useAppSelector';
import { useAppDispatch } from '../../../hooks/useAppDispatch';
import { setBrightness, setZoom } from '../../../store/slices/mapSlice';
import { setDrawingMode } from '../../../store/slices/entitiesSlice';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { WsMessageName } from "../../../enums/ws.enum";
import { MyPosition } from '../../../types';
import maplibregl, { Map } from "maplibre-gl";
import FlyoutMenu from '../../ui/FlyoutMenu';
import BaseMapSelector from '../../ui/BaseMapSelector';

interface MapControlsProps {
  mapServiceRef?: React.MutableRefObject<any>;
  myPosition?: MyPosition;
}

const MapControls: React.FC<MapControlsProps> = ({ mapServiceRef }) => {
  const dispatch = useAppDispatch();
  const { sendMessage } = useWebSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenBrightnes, setIsOpenBrightnes] = useState(false);
  const [isMapSelectorOpen, setIsMapSelectorOpen] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLosMode, setIsLosMode] = useState(false);
  const losMarkersRef = useRef<any[]>([]);
  const losPointsRef = useRef<{ lat: number, lng: number }[]>([]);
  const brightness = useAppSelector(state => state.map.brightness);
  const drawingMode = useAppSelector(state => state.entities.drawingMode);
  const isMeasuringDistance = drawingMode === 'measure';
  // const isMeasuringArea = drawingMode === 'measure-area';

  useEffect(() => {
    if (!mapServiceRef?.current) return;
    setIsOpen(false);
    const map = mapServiceRef.current.getMap();
    if (!map) return;
    const handlePoint = (lngLat: { lat: any; lng: any; }) => {
      if (!isLosMode) return;
      const { lat, lng } = lngLat;
      losPointsRef.current.push({ lat, lng });
      addTempMarker(map, lat, lng);
      if (losPointsRef.current.length === 2) {
        const [p1, p2] = losPointsRef.current;

        losPointsRef.current = [];
        setTimeout(() => {
          clearTempMarkers();
        }, 500);
        setIsLosMode(false);
      }
    };

    const handleClick = (e: { lngLat: { lat: any; lng: any; }; }) => handlePoint(e.lngLat);
    const handleTouch = (e: { point: any; }) => {
      if (!e.point) return;
      const lngLat = map.unproject(e.point);
      handlePoint(lngLat);
    };

    map.on("click", handleClick);
    map.on("touchstart", handleTouch);

    return () => {
      map.off("click", handleClick);
      map.off("touchstart", handleTouch);
    };
  }, [isLosMode]);

  const addTempMarker = (map: Map, lat: number, lng: number) => {
    const el = document.createElement("div");
    el.className = "w-8 h-8 rounded-full border border-2 border-white"
    const marker = new maplibregl.Marker(el).setLngLat([lng, lat]).addTo(map);
    losMarkersRef.current.push(marker);
  }

  const clearTempMarkers = () => {
    losMarkersRef.current.forEach(m => m.remove());
    losMarkersRef.current = [];
  }

  const handleZoomReset = () => {
    dispatch(setZoom(10));
    if (mapServiceRef?.current) {
      const map = mapServiceRef.current.getMap();
      if (map) {
        map.setZoom(10, { duration: 300 });
      }
    }
    setIsOpen(false);
  };

  const handleBrightnessChange = (value: number) => {
    dispatch(setBrightness(value));
  };

  const handleRulerToggle = () => {
    const newMode = isMeasuringDistance ? null : 'measure';
    dispatch(setDrawingMode(newMode));
    setIsOpen(false);
  };

  // const handleAreaToggle = () => {
  //   const newMode = isMeasuringArea ? null : 'measure-area';
  //   dispatch(setDrawingMode(newMode));
  //   setIsOpen(false);
  // };

  const handleMapTypeToggle = () => {
    setIsMapSelectorOpen(!isMapSelectorOpen);
  };

  const handleJsonFilePick = () => {
    fileInputRef.current?.click();
  };

  const normalizePoints = (raw: any): Array<{ lng: number; lat: number; alt?: number }> => {
    if (!Array.isArray(raw)) return [];
    const points: Array<{ lng: number; lat: number; alt?: number }> = [];
    raw.forEach((p) => {
      if (Array.isArray(p) && p.length >= 2) {
        const lng = Number(p[0]);
        const lat = Number(p[1]);
        const alt = p.length >= 3 ? Number(p[2]) : undefined;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        points.push({ lat, lng, alt: Number.isFinite(alt as number) ? (alt as number) : undefined });
        return;
      }
      if (p && typeof p === "object") {
        const lat = Number((p as any).lat ?? (p as any).latitude);
        const lng = Number((p as any).lng ?? (p as any).lon ?? (p as any).longitude);
        const alt = Number((p as any).alt ?? (p as any).altitude ?? (p as any).height);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        points.push({ lat, lng, alt: Number.isFinite(alt) ? alt : undefined });
      }
    });
    return points;
  };

  const normalizePaths = (raw: any): Array<{ id?: string; name?: string; points: Array<{ lng: number; lat: number; alt?: number }> }> => {
    if (Array.isArray(raw)) {
      if (raw.length === 0) return [];
      const first = raw[0];
      const looksLikePathObject =
        first && typeof first === "object" && (
          Array.isArray(first.points) ||
          Array.isArray(first.path) ||
          Array.isArray(first.coordinates)
        );
      if (looksLikePathObject) {
        const paths: Array<{ id?: string; name?: string; points: Array<{ lng: number; lat: number; alt?: number }> }> = [];
        raw.forEach((p) => {
          const pts = normalizePoints(p?.points ?? p?.path ?? p?.coordinates ?? []);
          if (pts.length >= 2) {
            paths.push({ id: p?.id, name: p?.name, points: pts });
          }
        });
        return paths;
      }
      const points = normalizePoints(raw);
      return points.length ? [{ points }] : [];
    }
    const fromObj = raw?.paths ?? raw?.routes ?? raw?.lines;
    if (Array.isArray(fromObj)) return normalizePaths(fromObj);
    const pts = normalizePoints(raw?.points ?? raw?.path ?? raw?.coordinates ?? []);
    return pts.length ? [{ points: pts }] : [];
  };

  const handleJsonFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !mapServiceRef?.current) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const paths = normalizePaths(parsed);
      if (paths.length === 0) {
        console.warn("JSON must include at least one path with 2+ points.");
        return;
      }
      mapServiceRef.current.renderJsonPaths(paths);
    } catch (err) {
      console.error("Failed to parse JSON path file:", err);
    } finally {
      e.target.value = "";
    }
  };

  return (
    <>
      <div
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-14 left-[80px] z-30 p-4 transition-all bg-[#1f2937d6] mt-4 rounded-full"
        title="Map Controls">
        <img src="./icons/Map_512.png" alt="" className='w-10' />
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleJsonFileChange}
      />

      <FlyoutMenu
        anchorRef={buttonRef}
        isOpen={isOpenBrightnes}
        placement="bottom"
        top={260}
        left={240}
        arow={55}
        onClose={() => setIsOpenBrightnes(false)}>
        <div
          className="bg-zinc-800 text-white text-sm p-1 rounded shadow-lg"
          onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <img src="./icons/brightness_512.png" className="w-6 h-6" alt="" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={brightness}
              onChange={(e) => handleBrightnessChange(Number(e.target.value))}
              onClick={(e) => e.stopPropagation()}
              className="brightness appearance-none w-32 h-4 rounded-full cursor-pointer outline-none"
              style={{ background: `linear-gradient(to right, #2F67FF 0%, #2F67FF ${((brightness - 0) / (1 - 0)) * 100}%, #C9CDD3 ${((brightness - 0) / (1 - 0)) * 100}%, #C9CDD3 100%)` }} />
          </div>
        </div>
      </FlyoutMenu>

      <FlyoutMenu
        anchorRef={buttonRef}
        isOpen={isOpen}
        placement="bottom"
        top={155}
        left={285}
        arow={25}
        onClose={() => !isOpenBrightnes && setIsOpen(false)}>
        <div className=" text-white text-sm p-1 rounded shadow-lg min-w-[200px]" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-center gap-4">
            <div
              className="flex flex-col items-center gap-1 p-1 rounded hover:bg-zinc-700 cursor-pointer transition-colors"
              onClick={(e) => { e.stopPropagation(); handleZoomReset(); }}
              title="Zoom 1:1">
              <TbZoomPan size={25} className="text-white" />
              <span className="text-sm font-bold text-[#98a5db]  whitespace-pre-line mt-2">{"זום  1:1"}</span>
            </div>

            <div className="flex flex-col items-center gap-1 p- rounded hover:bg-zinc-700 transition-colors" onClick={() => setIsOpenBrightnes(!isOpenBrightnes)}>
              <img src="./icons/brightness_512.png" alt="" className='w-8' />
              <span className="text-sm font-bold text-[#98a5db]  whitespace-pre-line mt-0">בהירות</span>
            </div>

            <div
              className={`flex flex-col items-center gap-1 p-1 rounded hover:bg-zinc-700 cursor-pointer transition-colors ${isMeasuringDistance ? 'bg-zinc-600' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleRulerToggle();
              }}
              title="Ruler">
              <img src="./icons/ruler_512.png" alt="" className='w-8' />
              <span className="text-sm font-bold text-[#98a5db]  whitespace-pre-line ">מדידות</span>
              {isMeasuringDistance && (
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              )}
            </div>

            {/* <div
              className={`flex flex-col items-center gap-1 p-1 rounded hover:bg-zinc-700 cursor-pointer transition-colors ${isMeasuringArea ? 'bg-zinc-600' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleAreaToggle();
              }}
              title="Area">
              <img src="./icons/ruler_512.png" alt="" className='w-8' />
              <span className="text-sm font-bold text-[#98a5db]  whitespace-pre-line ">שטח</span>
              {isMeasuringArea && (
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              )}
            </div> */}
            
            <div
              className="flex flex-col items-center gap-1 p-1 rounded hover:bg-zinc-700 cursor-pointer transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleJsonFilePick();
                setIsOpen(false);
              }}
              title="Load JSON Path">
              <img src="./icons/endpoints.png" alt="" className='w-8'  />
              <span className="text-sm font-bold text-[#98a5db]  whitespace-pre-line ">LOS</span>
            </div>

            <div
              className="flex flex-col items-center gap-1 p- rounded hover:bg-zinc-700 transition-colors"
              onClick={(e) => { e.stopPropagation(); setIsLosMode(!isLosMode); losPointsRef.current = []; }}
              title="LOS Request">
              <img src="/icons/los.png" className="w-8 h-8" />
              <span className="text-sm font-bold text-[#98a5db]  whitespace-pre-line ">כסוי</span>
            </div>

            <div className="relative">
              <div
                className="flex flex-col items-center gap-1 p-1 rounded hover:bg-zinc-700 cursor-pointer transition-colors"
                onClick={(e) => { e.stopPropagation(); handleMapTypeToggle(); }}
                title="Map Type">
                <TbMapStar size={25} className="text-white" />
                <span className="text-sm font-bold text-[#98a5db]  whitespace-pre-line mt-2">החלף</span>
              </div>

              {isMapSelectorOpen && (
                <div className="absolute top-full left-0 mt-1 z-50">
                  <BaseMapSelector
                    isOpen={isMapSelectorOpen}
                    onToggle={() => setIsMapSelectorOpen(false)} />
                </div>
              )}
            </div>

            {/* <div className="relative">
              <div
                ref={buttonTaboRef}
                className="flex flex-col items-center gap-1 p-1 rounded hover:bg-zinc-700 cursor-pointer transition-colors"
                onClick={(e) => { e.stopPropagation(); setIsOpenTabo(!isOpenTabo) }}
                title="Tabo">
                <TbMapStar size={25} className="text-white" />
                <span className="text-sm font-bold text-[#98a5db]  whitespace-pre-line mt-2">TABZON</span>
              </div>
            </div> */}
          </div>
        </div>
      </FlyoutMenu>

     
    </>
  );
};

export default MapControls; 
