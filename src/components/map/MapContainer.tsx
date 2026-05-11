import { FC, useMemo, Dispatch, SetStateAction, MutableRefObject, useRef, memo, useState, useCallback, useEffect } from 'react';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { LatLng } from "../../utils/geometry";
import { attachUnifiedMapClick, detachUnifiedMapClick } from '../../utils/mapEvents';
import { SystemModeE, InsStatusE, RadarStatusE } from '../../enums/statusBar.enum';
import { Entity, mapTypes, MyPosition } from '../../types';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useTargetWebSocket } from '../../hooks/useTargetWebSocket';
import { MapService } from '../../services/map/MapService';
import { convertStoreEntityToEditable } from './MapHelpers';
import { isTaboozoneEntity } from '../entities/entitiesSidebar/entitiesSidebarUtils';
import ContextMenu from '../ui/ContextMenu';
import ConfirmPromptInsLocation from '../ui/ConfirmPromptInsLocation';
import TargetSelectionMenu from '../ui/TargetSelectionMenu';
import TargetsLayer from './layers/targets/TargetsLayer';
import MyPositionMarker from './layers/myPosition/MyPositionMarker';
import RealtimeDeckOverlay from './deck/RealtimeDeckOverlay';
import { pickRealtimeTargetIdsAtPoint } from './deck/pickRealtimeTargets';
import CompassNeedle from './tools/CompassNeedle';
import StatusBar from '../layout/statusBar/StatusBar';
import MapControls from './tools/MapControls';
import VideoWinButton from './tools/VideoWinButton';
import VideoWindow from './tools/VideoWindow';
import EntitiesManager from '../entities/EntitiesManager';
import MapDimmerAuto from './tools/MapDimmerAuto';
import RadarNonCoverageLayer from './layers/radar/RadarNonCoverageLayer';
import ToastHost from "../ui/ToastHost";
import TabozoonLayer from './layers/tabozoon/TabozoonLayer';
import MissileLayer from './layers/missiles/MissileLayer';
import GunLosLayer from './layers/gun/GunLosLayer';
import { useMapEntities } from './hooks/useMapEntities';
import { useMapDrawing } from './hooks/useMapDrawing';
import { useMapMeasurement } from './hooks/useMapMeasurement';
import { WebSocketService } from '../../services/webSocket/WebSocketService';
import { WsMessageName } from '../../enums/ws.enum';
import { validateOutboundMessage } from '../../services/webSocket/wsValidators';
import { store } from '../../store/store';

interface MapContainerProps {
  isMeasuring: boolean;
  measurementMode: "measure" | "measure-area" | null;
  measurePoints: { lng: number; lat: number }[];
  setIsMeasuring: Dispatch<SetStateAction<boolean>>;
  setMeasurePoints: Dispatch<SetStateAction<{ lng: number; lat: number }[]>>;
  focusEntityRef?: MutableRefObject<((entity: Entity) => void) | undefined>;
  mouseCoords: { lat: number; lng: number } | null;
  setMouseCoords: Dispatch<SetStateAction<{ lat: number; lng: number } | null>>;
  mapServiceRef?: MutableRefObject<any>;
  clickedCoords: { lat: number; lng: number } | null;
  setClickedCoords: Dispatch<SetStateAction<{ lat: number; lng: number } | null>>;
  systemMode?: SystemModeE;
  gpsStatus?: InsStatusE;
  radarStatus?: RadarStatusE;
  myPosition?: MyPosition;
  onHamburgerClick?: () => void;
  onAbortTarget: (targetId: string) => void;
  handleTargetInfo: (targetId: string, identity: boolean) => void;
  onTargetsClick?: () => void;
}

const MapContainer: FC<MapContainerProps> = memo((props) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapServiceRef = useRef<MapService | null>(null);
  const { allocateTarget } = useTargetWebSocket();
  const dispatch = useAppDispatch();
  const entitiesState = useAppSelector(state => state.entities);
  const targetsState = useAppSelector(state => state.targets, (left, right) => { return left.byId === right.byId && left.allIds.length === right.allIds.length });
  const mapState = useAppSelector(state => state.map);
  const radarState = useAppSelector(state => state.radar);
  const myPositionState = useAppSelector(s => s.myPosition);
  const myPosition = myPositionState.coordinates;
  const { radarNonCoverage, radarRange } = radarState;
  const byId = useMemo(() => entitiesState.byId, [entitiesState.byId]);
  const drawingMode = useMemo(() => entitiesState.drawingMode, [entitiesState.drawingMode]);
  const brightness = useMemo(() => mapState.brightness, [mapState.brightness]);
  const selectedMapType = useMemo(() => mapState.selectedMapType, [mapState.selectedMapType]);
  const selectedMapTypeObj = useMemo(() => mapTypes.find(mt => mt.id === selectedMapType) || mapTypes[0], [selectedMapType]);
  const [contextMenu, setContextMenu] = useState<{ entityId: string; x: number; y: number; isTarget: boolean; coordinates?: LatLng } | null>(null);
  const realtimeDeckOverlayRef = useRef<MapboxOverlay | null>(null);
  const [drawUiState, setDrawUiState] = useState<{
    mode: "create" | "edit";
    type: "circle" | "ellipse" | "polygon";
    anchor: { lng: number; lat: number };
    entityId?: string;
    canFinish: boolean;
  } | null>(null);
  const [drawUiPos, setDrawUiPos] = useState<{ x: number; y: number } | null>(null);
  const [targetSelectionMenu, setTargetSelectionMenu] = useState<{ targets: Array<{ id: string; type: string; friend: boolean }>; x: number; y: number; } | null>(null);
  const [myPositionMarkerReady, setMyPositionMarkerReady] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [bearing, setBearing] = useState(0);
  const { handleEntityDrawn } = useMapDrawing({ mapServiceRef });
  const { handleEntityUpdated, handleEntityDeleted } = useMapEntities({ mapServiceRef });
  const { tooltip, measurementUiState, finishMeasurement } = useMapMeasurement({
    mapServiceRef,
    measurementMode: props.measurementMode,
    measurePoints: props.measurePoints,
    setMeasurePoints: props.setMeasurePoints
  });
  const [measureUiPos, setMeasureUiPos] = useState<{ x: number; y: number } | null>(null);

  const safePreventDefault = (e: any) => {
    const ev = e?.originalEvent || e;
    if (ev && typeof ev.preventDefault === 'function' && ev.cancelable) {
      ev.preventDefault();
    }
  };


  useEffect(() => {
    if (mapContainerRef.current && !mapServiceRef.current) {
      const mapService = new MapService();
      mapServiceRef.current = mapService;
      mapService.initialize(
        mapContainerRef.current,
        handleEntityDrawn,
        handleEntityUpdated,
        handleEntityDeleted,
        selectedMapType,
        mapState.center,
        mapState.zoom
      );
      mapService.setDrawingUiListener((state: any) => {
        setDrawUiState(state);
      });
      if (props.mapServiceRef) props.mapServiceRef.current = mapService;
    }

    return () => {
      if (mapServiceRef.current) {
        mapServiceRef.current.destroy();
        mapServiceRef.current = null;
      }
      if (props.mapServiceRef) {
        props.mapServiceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapServiceRef.current) {
      mapServiceRef.current.setDrawingCallbacks(
        handleEntityDrawn,
        handleEntityUpdated,
        handleEntityDeleted
      );
    }
  }, [handleEntityDrawn, handleEntityUpdated, handleEntityDeleted]);

  useEffect(() => {
    const map = mapServiceRef.current?.getMap();
    if (!map || !drawUiState?.anchor) {
      setDrawUiPos(null);
      return;
    }

    const updatePos = () => {
      const p = map.project([drawUiState.anchor.lng, drawUiState.anchor.lat]);
      setDrawUiPos({ x: p.x, y: p.y });
    };

    updatePos();
    map.on("move", updatePos);
    map.on("zoom", updatePos);
    map.on("rotate", updatePos);
    return () => {
      map.off("move", updatePos);
      map.off("zoom", updatePos);
      map.off("rotate", updatePos);
    };
  }, [drawUiState?.anchor?.lng, drawUiState?.anchor?.lat]);

  useEffect(() => {
    const map = mapServiceRef.current?.getMap();
    if (!map || !measurementUiState?.anchor) {
      setMeasureUiPos(null);
      return;
    }
    const updatePos = () => {
      const p = map.project([measurementUiState.anchor.lng, measurementUiState.anchor.lat]);
      setMeasureUiPos({ x: p.x, y: p.y });
    };
    updatePos();
    map.on("move", updatePos);
    map.on("zoom", updatePos);
    map.on("rotate", updatePos);
    return () => {
      map.off("move", updatePos);
      map.off("zoom", updatePos);
      map.off("rotate", updatePos);
    };
  }, [measurementUiState?.anchor?.lng, measurementUiState?.anchor?.lat]);

  useEffect(() => {
    if (mapServiceRef.current) {
      const modeForDrawing = drawingMode === 'measure-area' ? null : drawingMode;
      mapServiceRef.current.setDrawingMode(modeForDrawing);
    }
  }, [drawingMode]);

  useEffect(() => {
    if (mapServiceRef.current) {
      const currentMapType = mapServiceRef.current.getCurrentMapType?.() || 'vector-global';
      if (currentMapType !== selectedMapTypeObj.id) {
        mapServiceRef.current.setMapType(selectedMapTypeObj.id);
      }
    }
  }, [selectedMapTypeObj.id, selectedMapTypeObj.type]);

  useEffect(() => {
    if (!mapServiceRef.current) return;

    const map = mapServiceRef.current.getMap();
    if (!map) return;

    if (map.isStyleLoaded()) {
      setMyPositionMarkerReady(true);
    } else {
      const handleStyleData = () => {
        setMyPositionMarkerReady(true);
        map.off('styledata', handleStyleData);
      };
      map.on('styledata', handleStyleData);
    }

    const updateBearing = () => {
      const newBearing = map.getBearing();
      setBearing(newBearing);
    };
    map.on('rotate', updateBearing);
    map.on('move', updateBearing);
    updateBearing();
    return () => {
      map.off('rotate', updateBearing);
      map.off('move', updateBearing);
    };
  }, []);

  const mapObject = useMemo(() => {
    if (!myPositionMarkerReady || !mapServiceRef.current) {
      return null;
    }
    const map = mapServiceRef.current.getMap();
    return map;
  }, [myPositionMarkerReady]);

  useEffect(() => {
    if (!mapServiceRef.current) return;
    const map = (mapServiceRef.current as any).map;
    if (!map) return;

    const handleContextMenu = (e: any) => {
      const entityLayers = Object.keys(byId)
        .map(id => `entity-layer-${id}`)
        .filter(layerId => {
          const exists = map.getLayer(layerId);
          return exists;
        });

      const entityFeatures =
        entityLayers.length > 0
          ? map.queryRenderedFeatures(e.point, { layers: entityLayers })
          : [];

      if (entityFeatures.length > 0) {
        const feature = entityFeatures[0];
        const layerId = feature.layer.id;
        if (layerId.startsWith('entity-layer-')) {
          const entityId = layerId.replace('entity-layer-', '');
          const entity = byId[entityId];

          if (entity) {
            setContextMenu({
              entityId,
              x: e.originalEvent.clientX,
              y: e.originalEvent.clientY,
              isTarget: false
            });
            safePreventDefault(e);
            return;
          }
        }
      }

      const pickedIds = pickRealtimeTargetIdsAtPoint(
        realtimeDeckOverlayRef.current,
        e.point.x,
        e.point.y
      );
      if (pickedIds.length > 0) {
        const byTarget = store.getState().targets.byId;
        const uniqueTargets = pickedIds
          .map((id: string) => {
            const target = byTarget[id];
            return target
              ? {
                  id: target.id,
                  type: target.type,
                  friend: false,
                }
              : null;
          })
          .filter(Boolean);

        if (uniqueTargets.length > 1) {
          setTargetSelectionMenu({
            targets: uniqueTargets as Array<{ id: string; type: string; friend: boolean }>,
            x: e.originalEvent.clientX,
            y: e.originalEvent.clientY,
          });
        } else if (uniqueTargets.length === 1) {
          setContextMenu({
            entityId: (uniqueTargets[0] as { id: string }).id,
            x: e.originalEvent.clientX,
            y: e.originalEvent.clientY,
            isTarget: true,
          });
        }

        safePreventDefault(e);
        return;
      }

      setContextMenu(null);
    };

    const handleMapClick = (e: any) => {
      if (!drawingMode && !props.isMeasuring) {
        const existingButton = document.getElementById('marker-button');
        if (existingButton) existingButton.remove();
      }
      props.setClickedCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng });

      const pickedIds = pickRealtimeTargetIdsAtPoint(
        realtimeDeckOverlayRef.current,
        e.point.x,
        e.point.y
      );

      if (pickedIds.length > 0) {
        const byTarget = store.getState().targets.byId;
        const uniqueTargets = pickedIds
          .map((id: string) => {
            const target = byTarget[id];
            return target
              ? {
                  id: target.id,
                  type: target.type,
                  friend: false,
                }
              : null;
          })
          .filter(Boolean);

        if (uniqueTargets.length > 1) {
          setTargetSelectionMenu({
            targets: uniqueTargets as Array<{ id: string; type: string; friend: boolean }>,
            x: e.originalEvent.clientX,
            y: e.originalEvent.clientY,
          });
          return;
        } else if (uniqueTargets.length === 1) {
          setContextMenu({
            entityId: (uniqueTargets[0] as { id: string }).id,
            x: e.originalEvent.clientX,
            y: e.originalEvent.clientY,
            isTarget: true,
          });
          return;
        }
      }

      setContextMenu((prev) => (prev ? null : prev));
      setTargetSelectionMenu((prev) => (prev ? null : prev));
    };

    map.on('contextmenu', handleContextMenu);
    let touchTimeout: number | null = null;
    let touchStartPoint: { x: number; y: number } | null = null;

    const handleTouchStart = (e: any) => {
      touchStartPoint = { x: e.point.x, y: e.point.y };
      touchTimeout = window.setTimeout(() => {
        // Long press detected - trigger context menu
        const contextMenuEvent = {
          ...e,
          originalEvent: {
            clientX: e.point.x,
            clientY: e.point.y
          }
        };
        handleContextMenu(contextMenuEvent);
      }, 500); // 500ms for long press
    };

    const handleTouchEnd = () => {
      if (touchTimeout) {
        clearTimeout(touchTimeout);
        touchTimeout = null;
      }
      touchStartPoint = null;
    };

    const handleTouchMove = (e: any) => {
      if (touchStartPoint) {
        const distance = Math.sqrt(
          Math.pow(e.point.x - touchStartPoint.x, 2) +
          Math.pow(e.point.y - touchStartPoint.y, 2)
        );
        if (distance > 10) { // Cancel if moved more than 10px
          handleTouchEnd();
        }
      }
    };

    if (!drawingMode) {
      map.on('touchstart', handleTouchStart);
      map.on('touchend', handleTouchEnd);
      map.on('touchmove', handleTouchMove);
    }
    const wrappedClickHandler = attachUnifiedMapClick(map, handleMapClick);

    return () => {
      map.off('contextmenu', handleContextMenu);
      // Only remove touch handlers if not in drawing mode
      if (!drawingMode) {
        map.off('touchstart', handleTouchStart);
        map.off('touchend', handleTouchEnd);
        map.off('touchmove', handleTouchMove);
      }
      detachUnifiedMapClick(map, wrappedClickHandler);
    };
  }, [byId, drawingMode, props.isMeasuring, props.setClickedCoords]);

  if (props.focusEntityRef) {
    props.focusEntityRef.current = (entity: Entity) => {
      if (mapServiceRef.current) {
        mapServiceRef.current.focusOnEntity(entity);
      }
    };
  }

  const settings = useAppSelector(state => state.settings);
  useEffect(() => {
    if (mapServiceRef.current) {
      mapServiceRef.current.updateEntityColors();
    }
  }, [settings]);

  const handleAbortAction = (targetId: string): void => {
    props.onAbortTarget(targetId);
  }

  const handleTargetInfoAction = (targetId: string, identity: boolean): void => {
    props.handleTargetInfo(targetId, identity);
  }

  return (
    <div className="relative w-full h-full min-h-0 overflow-hidden flex">
      <ContextMenu
        open={contextMenu !== null && !contextMenu.isTarget}
        x={contextMenu ? contextMenu.x : 0}
        y={contextMenu ? contextMenu.y : 0}
        onClose={() => setContextMenu(null)}
        entityId={contextMenu ? contextMenu.entityId : ''}
        entityName={contextMenu && contextMenu.entityId ?
          (byId[contextMenu.entityId]?.properties?.name || targetsState.byId[contextMenu.entityId]?.type || `Target ${contextMenu.entityId}`) : ''}
        isTarget={false}
        onEdit={() => {
          if (!contextMenu || !contextMenu.entityId || !mapServiceRef.current) return;
          const storeEntity = byId[contextMenu.entityId];
          if (storeEntity && isTaboozoneEntity(storeEntity)) {
            setContextMenu(null);
            return;
          }
          const converted = convertStoreEntityToEditable(storeEntity);
          if (converted) mapServiceRef.current.setEditMode(contextMenu.entityId, converted);
          setContextMenu(null);
        }}
        onDelete={() => {
          if (contextMenu && contextMenu.entityId) {
            import('../../store/slices/entitiesSlice').then(({ removeEntity }) => {
              const entityToDelete = byId[contextMenu.entityId];
              if (entityToDelete) {
                const payload = { entityId: contextMenu.entityId };
                if (validateOutboundMessage(WsMessageName.EntityDeleted, payload)) {
                  WebSocketService.getInstance().sendMessage(WsMessageName.EntityDeleted, payload);
                }
              }
              dispatch(removeEntity(contextMenu.entityId));
            });
            if (mapServiceRef.current) mapServiceRef.current.removeEntityFromMap(contextMenu.entityId);;
            setContextMenu(null);
          }
        }}
        onDesignateTarget={() => {
          if (contextMenu && contextMenu.entityId) {
            const target = targetsState.byId[contextMenu.entityId];
            if (target) {
              import('../../store/slices/targetsSlice').then(({ updateTarget }) => {
                dispatch(updateTarget({ ...target, status: 'designated' }));
              });
            }
            setContextMenu(null);
          }
        }}
        onToggleFriend={() => {
          if (contextMenu && contextMenu.entityId) {
            const target = targetsState.byId[contextMenu.entityId];
            if (target) {
              handleTargetInfoAction(target.id, false)
            }
            setContextMenu(null);
          }
        }}
        onAttackTarget={() => {
          if (contextMenu && contextMenu.entityId) {
            const target = targetsState.byId[contextMenu.entityId];
            if (target) {
              allocateTarget(contextMenu.entityId);
            }
          }
          setContextMenu(null);
        }}
      />
      {contextMenu?.isTarget && contextMenu.entityId && (
        <div
          className="fixed z-[10001] flex gap-2 rounded-lg border border-slate-500/50 bg-gray-800/90 p-2 shadow-xl pointer-events-auto"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            transform: 'translate(-50%, 6px)',
          }}
        >
          <button
            type="button"
            className="flex min-h-[80px] min-w-[80px] cursor-pointer flex-col items-center justify-center rounded-lg border border-indigo-300/60 bg-gray-900/60 text-xs font-bold text-indigo-300"
            onClick={() => {
              allocateTarget(contextMenu.entityId);
              setContextMenu(null);
            }}
          >
            <img src="/icons/targets/Target_Point.png" alt="" className="mb-1 w-11" />
            Allocat
          </button>
          <button
            type="button"
            className="flex min-h-[80px] min-w-[80px] cursor-pointer flex-col items-center justify-center rounded-lg border border-indigo-300/60 bg-gray-900/60 text-xs font-bold text-indigo-300"
            onClick={() => {
              handleTargetInfoAction(contextMenu.entityId, false);
              setContextMenu(null);
            }}
          >
            Friend
          </button>
        </div>
      )}
      {drawUiState && drawUiPos && drawUiState.canFinish && (
        <button
          type="button"
          onClick={() => mapServiceRef.current?.finishEdit()}
          className="absolute z-[1000] flex h-9 w-9 items-center justify-center rounded-full bg-green-500 text-white shadow-lg"
          style={{
            left: drawUiPos.x + 12,
            top: drawUiPos.y - 12,
          }}
        >
          ✓
        </button>
      )}
      {measurementUiState &&
        measureUiPos &&
        measurementUiState.mode === "measure-area" &&
        measurementUiState.canFinish && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            finishMeasurement();
            import('../../store/slices/entitiesSlice').then(({ setDrawingMode }) => {
              dispatch(setDrawingMode(null));
            });
          }}
          className="absolute z-[1000] flex h-9 w-9 items-center justify-center rounded-full bg-green-500 text-white shadow-lg"
          style={{
            left: measureUiPos.x + 12,
            top: measureUiPos.y - 12,
          }}
        >
          ✓
        </button>
      )}
      <TargetSelectionMenu
        open={targetSelectionMenu !== null}
        x={targetSelectionMenu ? targetSelectionMenu.x : 0}
        y={targetSelectionMenu ? targetSelectionMenu.y : 0}
        targets={targetSelectionMenu ? targetSelectionMenu.targets : []}
        onClose={() => setTargetSelectionMenu(null)}
        onSelectTarget={(targetId) => {
          setTargetSelectionMenu(null);
          setContextMenu({
            entityId: targetId,
            x: targetSelectionMenu?.x || 0,
            y: targetSelectionMenu?.y || 0,
            isTarget: true
          });
        }}
      />
      <div
        ref={mapContainerRef}
        className="w-full h-full min-h-0 rounded-lg shadow-lg map-container overflow-hidden"
      />
      {tooltip && (
        <div
          className="pointer-events-none z-[100] select-none px-3 py-1 rounded shadow-lg border border-gray-300 bg-white/95 text-xs font-mono absolute"
          style={{
            left: tooltip.x,
            top: tooltip.y - 32,
            transform: 'translate(-50%, -100%)',
            whiteSpace: 'nowrap',
          }}
        >
          {tooltip.text}
        </div>
      )}
      {mapObject && (
        <RealtimeDeckOverlay
          map={mapObject}
          overlayRef={realtimeDeckOverlayRef}
          onAbortTarget={handleAbortAction}
        />
      )}
      {mapObject && <MyPositionMarker map={mapObject} />}
      {mapObject && <TargetsLayer map={mapObject} showLabels={false} />}
      {mapObject && <MissileLayer map={mapObject} />}
      {mapObject && (
        <GunLosLayer
          map={mapObject}
          position={myPosition}
          gunAzimut={myPositionState.gunAzimut}
        />
      )}
      {mapObject && <MapDimmerAuto map={mapObject} opacity={brightness} />}
      {mapObject && <RadarNonCoverageLayer map={mapObject} center={[myPosition.lng, myPosition.lat]} radiusMeters={radarRange} angles={radarNonCoverage} lineWidth={2} />}
      {mapObject && <TabozoonLayer map={mapObject} center={[myPosition.lng, myPosition.lat]} />}
      {mapObject && <CompassNeedle bearing={bearing} />}
      {mapObject && <EntitiesManager map={mapObject} mapServiceRef={mapServiceRef} />}
      <MapControls mapServiceRef={mapServiceRef} myPosition={props.myPosition} />
      <VideoWinButton onOpen={() => setIsVideoOpen(!isVideoOpen)} />
      <VideoWindow isOpen={isVideoOpen} onClose={() => setIsVideoOpen(false)} />
      <ConfirmPromptInsLocation />
      <ToastHost />
      <div className="fixed top-0 left-0 right-0 z-[9999999]">
        <StatusBar
          systemMode={props.systemMode}
          insStatus={props.gpsStatus}
          radarStatus={props.radarStatus}
          clickedCoords={props.clickedCoords}
          myPosition={props.myPosition}
          onCenterToPosition={(coordinates) => {
            if (mapServiceRef.current) {
              const map = mapServiceRef.current.getMap();
              if (map) {
                map.panTo([coordinates.lng, coordinates.lat], { duration: 800 });
              }
            }
          }}
          onHamburgerClick={props.onHamburgerClick}
          onTargetsClick={props.onTargetsClick}
        />
      </div>
    </div>
  );
});

export default MapContainer;