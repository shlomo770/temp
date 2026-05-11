import { useEffect, useState, useRef, useCallback } from 'react';
import MapContainer from './map/MapContainer';
import ErrorBoundary from './ErrorBoundary';
import { Entity } from '../types';
import { useAppSelector } from '../hooks/useAppSelector';
import { useTargetWebSocket } from '../hooks/useTargetWebSocket';
import { TargetStatusService } from '../services/targets/TargetStatusService';
import SidebarContainer from './sidebar/SidebarContainer';
import { LaunchersBar } from './ammo/LaunchersBar';
import { RightCommandsPanel } from './rightPanel';
import { LogsPanel } from './logs/LogsPanel';
import { getTerrainService } from '../terrain/terrain.service';

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
  const [isLogsOpen, setIsLogsOpen] = useState(false);
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
  const openLogsFromSidebar = useCallback(() => setIsLogsOpen(true), []);
  useEffect(() => {
    getTerrainService().initTerrain().catch(() => {});
  }, []);

  return (
    <ErrorBoundary>
      <div className="fixed inset-0 w-screen h-screen bg-white overflow-hidden">
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
          onOpenLogs={openLogsFromSidebar}
          mapServiceRef={mapServiceRef}
          clickedCoords={isSidebarOpen ? clickedCoords : null}
        />
        <LaunchersBar />
        <RightCommandsPanel
          mapServiceRef={mapServiceRef}
          onAttackTarget={handleAttackTarget}
          onAbortTarget={handleAbortTarget}
        />
        <LogsPanel isOpen={isLogsOpen} onClose={() => setIsLogsOpen(false)} />
      </div>
    </ErrorBoundary>
  );
}

export default MainApp;



