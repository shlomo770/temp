import { useEffect, useState, useRef, useCallback } from 'react';
import MapContainer from './map/MapContainer';
import ErrorBoundary from './ErrorBoundary';
import { Entity } from '../types';
import { useAppSelector } from '../hooks/useAppSelector';
import { useTargetWebSocket } from '../hooks/useTargetWebSocket';
import { TargetStatusService } from '../services/targets/TargetStatusService';
import SidebarContainer from './sidebar/SidebarContainer';
import { TargetViewer } from './targets/TargetViewer';
import { WebSocketService } from '../services/webSocket/WebSocketService';
import { store } from '../store/store';
import { WsMessageName } from '../enums/ws.enum';
import { buildSaveEntityPayload, toEntityCategoryEnum } from '../services/webSocket/saveEntityMessage';
import { buildSaveMissionEntitiesField } from '../services/webSocket/saveMissionPayload';


const MainApp = () => {
  const [measurePoints, setMeasurePoints] = useState<{ lng: number; lat: number }[]>([]);
  const drawingMode = useAppSelector(state => state.entities.drawingMode);
  const isMeasuring = drawingMode === 'measure' || drawingMode === 'measure-area';
  const [isVisible, setIsVisible] = useState(true);
  const { allocateTarget, abortTarget, setTargetInfo } = useTargetWebSocket();

  useEffect(() => {
    const handleVisibilityChange = () => {
      const newVisibility = !document.hidden;
      if (newVisibility !== isVisible) {
        setIsVisible(newVisibility);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isVisible]);

  const focusEntityRef = useRef<((entity: Entity) => void) | undefined>(undefined);
  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [clickedCoords, setClickedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const mapServiceRef = useRef<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTargetsPanelOpen, setIsTargetsPanelOpen] = useState(false);
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, []);
  const myPosition = useAppSelector(state => state.myPosition);

  useEffect(() => {
    const statusService = TargetStatusService.getInstance();
    statusService.start();
    return () => {
      statusService.stop();
    };
  }, []);

  const handleAttackTarget = useCallback((targetId: string) => {
    allocateTarget(targetId);
  }, [allocateTarget]);

  const handleAbortTarget = useCallback((targetId: string) => {
    abortTarget(targetId);
  }, [abortTarget]);

  const handleTarget_Info = useCallback((targetId: string, identity: boolean) => {
    setTargetInfo(targetId, identity);
  }, [setTargetInfo]);

  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  useEffect(() => {
    const ws = WebSocketService.getInstance();
    const unsubscribe = ws.onConnectionChange((connected) => {
      if (!connected) return;
      const entities = Object.values(store.getState().entities.byId);
      for (const entity of entities) {
        if (!entity) continue;
        if (entity.id.includes('temp')) {
          const payload = buildSaveEntityPayload(entity.id, entity.category, entity.type as any, entity.coordinates ?? [], entity.name);
          if (payload) {
            payload.type = toEntityCategoryEnum(payload.type);
            ws.sendMessage(WsMessageName.SaveEntity, payload);
          }
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const ws = WebSocketService.getInstance();

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let lastSignature = "";

    const emitMissionSaveIfNeeded = () => {
      const state = store.getState().entities;
      const missionName = String(state.activeMissionName ?? "").trim();

      if (!missionName) return;

      const ids = [...(state.missionsByName[missionName]?.entityIds ?? [])].sort((a, b) =>
        a.localeCompare(b)
      );

      const signature = JSON.stringify({
        missionName,
        ids,
      });

      if (signature === lastSignature) return;

      lastSignature = signature;

      const payload = {
        mission_name: missionName,
        entities: buildSaveMissionEntitiesField(ids),
      };

      ws.sendMessage(WsMessageName.SaveMission, payload);
    };

    const unsubscribe = store.subscribe(() => {
      if (timeoutId) clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        emitMissionSaveIfNeeded();
      }, 500);
    });

    return () => {
      unsubscribe();

      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);


  return (
    <ErrorBoundary>
      <div className="fixed inset-0 w-screen h-screen bg-white overflow-hidden">
        <div style={{ position: 'fixed', top: '20px', left: '80px', zIndex: 9999, display: 'flex', alignItems: 'center' }}>
        </div>
        <MapContainer
          isMeasuring={isMeasuring}
          measurementMode={drawingMode === 'measure' || drawingMode === 'measure-area' ? drawingMode : null}
          measurePoints={measurePoints}
          setIsMeasuring={() => { }}
          setMeasurePoints={setMeasurePoints}
          focusEntityRef={focusEntityRef}
          mouseCoords={mouseCoords}
          setMouseCoords={setMouseCoords}
          clickedCoords={clickedCoords}
          setClickedCoords={setClickedCoords}
          mapServiceRef={mapServiceRef}
          myPosition={myPosition}
          onAbortTarget={handleAbortTarget}
          handleTargetInfo={handleTarget_Info}
          onHamburgerClick={() => setIsSidebarOpen(!isSidebarOpen)}
          onTargetsClick={() => setIsTargetsPanelOpen(!isTargetsPanelOpen)}
        />
        <SidebarContainer
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
        />
        <TargetViewer
          mapServiceRef={mapServiceRef}
          onAttackTarget={handleAttackTarget}
          onAbortTarget={handleAbortTarget}
          isOpen={true}
          onToggle={() => setIsTargetsPanelOpen(!isTargetsPanelOpen)}
        />
      </div>
    </ErrorBoundary>
  );
}

export default MainApp;
