import { FC, useMemo, Dispatch, SetStateAction, MutableRefObject, useRef, memo, useState, useCallback, useEffect } from 'react';
import { LatLng } from "../../utils/geometry";
import { attachUnifiedMapClick, detachUnifiedMapClick } from '../../utils/mapEvents';
import { SystemModeE, InsStatusE, RadarStatusE } from '../../enums/statusBar.enum';
import { Entity, mapTypes, MyPosition } from '../../types';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useTargetWebSocket } from '../../hooks/useTargetWebSocket';
import { MapService } from '../../services/map/MapService';
import { convertStoreEntityToEditable } from './MapHelpers';
import ContextMenu from '../ui/ContextMenu';
import ConfirmPromptInsLocation from '../ui/ConfirmPromptInsLocation';
import TargetSelectionMenu from '../ui/TargetSelectionMenu';
import TargetsLayerManager from './layers/targets/TargetsLayerManager';
import MyPositionMarker from './layers/myPosition/MyPositionMarker';
import CompassNeedle from './tools/CompassNeedle';
import StatusBar from '../layout/statusBar/StatusBar';
import MapControls from './tools/MapControls';
import VideoWinButton from './tools/VideoWinButton';
import VideoPlayer from './tools/VideoWindow';
import EntitiesManager from '../entities/EntitiesManager';
import MapDimmerAuto from './tools/MapDimmerAuto';
import RadarNonCoverageLayer from './layers/radar/RadarNonCoverageLayer';
import ToastHost from "../ui/ToastHost";
import TabozoonLayer from './layers/tabozoon/TabozoonLayer';
import { useMapEntities } from './hooks/useMapEntities';
import { selectDisplayedEntitiesOnMap } from '../../store/selectors/entitiesSelectors';
import { useMapDrawing } from './hooks/useMapDrawing';
import { useMapMeasurement } from './hooks/useMapMeasurement';
import { updateClickCord } from '../../store/slices/myPositionSlice';
import GunLosLayer from './layers/gun/GunLosLayer';


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
  onHamburgerClick: () => void;
  onAbortTarget: (targetId: string) => void;
  handleTargetInfo: (targetId: string, identity: boolean) => void;
  onTargetsClick?: () => void;
}

const MapContainer: FC<MapContainerProps> = memo((props) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapServiceRef = useRef<MapService | null>(null);
  const { allocateTarget } = useTargetWebSocket();
  const dispatch = useAppDispatch();
  const entitiesState = useAppSelector((state) => state.entities);
  const entitiesForMap = useAppSelector(selectDisplayedEntitiesOnMap);
  const targetsState = useAppSelector(state => state.targets, (left, right) => { return left.byId === right.byId && left.allIds.length === right.allIds.length });
  const mapState = useAppSelector(state => state.map);
  const radarState = useAppSelector(state => state.radar);
  const myPosition = useAppSelector(s => s.myPosition.coordinates);
  const gunAzimut = useAppSelector(s => s.myPosition.gunAzimut);
  const { radarNonCoverage, radarRange } = radarState;
  const byId = useMemo(() => entitiesState.byId, [entitiesState.byId]);
  const drawingMode = useMemo(() => entitiesState.drawingMode, [entitiesState.drawingMode]);
  const brightness = useMemo(() => mapState.brightness, [mapState.brightness]);
  const selectedMapType = useMemo(() => mapState.selectedMapType, [mapState.selectedMapType]);
  const selectedMapTypeObj = useMemo(() => mapTypes.find(mt => mt.id === selectedMapType) || mapTypes[0], [selectedMapType]);
  const [contextMenu, setContextMenu] = useState<{ entityId: string; x: number; y: number; isTarget: boolean; coordinates?: LatLng } | null>(null);
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
  const [openSider, setOpenSider] = useState(false);
  const { handleEntityDrawn } = useMapDrawing({ mapServiceRef });
  const { handleEntityUpdated, handleEntityDeleted } = useMapEntities({ mapServiceRef, entitiesById: entitiesForMap });
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
      mapServiceRef.current.setDrawingMode(drawingMode);
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


  const handleClick = useCallback((e: any) => {
    if (!drawingMode && !props.isMeasuring) {
      const existingButton = document.getElementById('marker-button');
      if (existingButton) existingButton.remove();
    }
    props.setClickedCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    dispatch(updateClickCord({ lat: e.lngLat.lat, lng: e.lngLat.lng }));
  }, [drawingMode, props.isMeasuring, props.setClickedCoords]);

  useEffect(() => {
    if (!mapServiceRef.current) return;
    const map = (mapServiceRef.current as any).map;
    if (!map) return;

    const wrappedClickHandler = attachUnifiedMapClick(map, handleClick);
    return () => { detachUnifiedMapClick(map, wrappedClickHandler); };
  }, [handleClick]);

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

      const targetLayers = ['targets-layer', 'targets-circle-layer']
        .filter(layerId => {
          const exists = map.getLayer(layerId);
          return exists;
        });

      const availableLayers = [...entityLayers, ...targetLayers];

      if (availableLayers.length === 0) {
        setContextMenu(null);
        return;
      }

      const features = map.queryRenderedFeatures(e.point, { layers: availableLayers });

      if (features.length > 0) {
        const feature = features[0];
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

        if (layerId === 'targets-layer' || layerId === 'targets-circle-layer') {
          const targetFeatures = features.filter((f: any) =>
            (f.layer.id === 'targets-layer' || f.layer.id === 'targets-circle-layer') &&
            f.properties?.id
          );

          const uniqueTargets = targetFeatures
            .map((f: any) => f.properties?.id)
            .filter((id: any, index: number, arr: any[]) => id && arr.indexOf(id) === index)
            .map((id: string) => {
              const target = targetsState.byId[id];
              return target ? {
                id: target.id,
                type: target.type,
                friend: target.friend
              } : null;
            })
            .filter(Boolean);

          if (uniqueTargets.length > 1) {
            setTargetSelectionMenu({
              targets: uniqueTargets,
              x: e.originalEvent.clientX,
              y: e.originalEvent.clientY
            });
          } else if (uniqueTargets.length === 1) {
            setContextMenu({
              entityId: uniqueTargets[0].id,
              x: e.originalEvent.clientX,
              y: e.originalEvent.clientY,
              isTarget: true
            });
          }

          safePreventDefault(e);
          return;
        }
      } else {
        setContextMenu(null);
      }
    };

    const handleMapClick = (e: any) => {
      const targetLayers = ['targets-layer', 'targets-circle-layer']
        .filter(layerId => map.getLayer(layerId));
      if (targetLayers.length === 0) {
        return;
      }
      const features = map.queryRenderedFeatures(e.point, { layers: targetLayers });

      if (features.length > 0) {
        const uniqueTargets = features
          .map((f: any) => f.properties?.id)
          .filter((id: any, index: number, arr: any[]) => id && arr.indexOf(id) === index)
          .map((id: string) => {
            const target = targetsState.byId[id];
            return target ? {
              id: target.id,
              type: target.type,
              friend: target.friend
            } : null;
          })
          .filter(Boolean);

        if (uniqueTargets.length > 1) {
          setTargetSelectionMenu({
            targets: uniqueTargets,
            x: e.originalEvent.clientX,
            y: e.originalEvent.clientY
          });
          return;
        } else if (uniqueTargets.length === 1) {
          setContextMenu({
            entityId: uniqueTargets[0].id,
            x: e.originalEvent.clientX,
            y: e.originalEvent.clientY,
            isTarget: true
          });
          return;
        }
      }

      if (contextMenu) {
        setContextMenu(null)
      }
      if (targetSelectionMenu) {
        setTargetSelectionMenu(null);
      }
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
  }, [byId, contextMenu, targetsState.byId]);


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
        open={contextMenu !== null}
        x={contextMenu ? contextMenu.x : 0}
        y={contextMenu ? contextMenu.y : 0}
        onClose={() => setContextMenu(null)}
        entityId={contextMenu ? contextMenu.entityId : ''}
        entityName={contextMenu && contextMenu.entityId ?
          (byId[contextMenu.entityId]?.properties?.name || targetsState.byId[contextMenu.entityId]?.type || `Target ${contextMenu.entityId}`) : ''}
        isTarget={contextMenu ? contextMenu.isTarget : false}
        targetIsFriend={
          Boolean(
            contextMenu?.isTarget &&
              contextMenu.entityId &&
              targetsState.byId[contextMenu.entityId]?.friend
          )
        }
        onEdit={() => {
          if (!contextMenu || !contextMenu.entityId || !mapServiceRef.current) return;
          const storeEntity = byId[contextMenu.entityId];
          const isTABOOZONEEntity =
            storeEntity?.type === 'sector' &&
            (String(storeEntity?.category || '').trim().toUpperCase() === 'TABOOZONE' ||
              String(storeEntity?.name || '').trim().toUpperCase() === 'TABOOZONE');
          if (isTABOOZONEEntity) {
            setContextMenu(null);
            return;
          }
          const converted = convertStoreEntityToEditable(storeEntity);
          if (converted) mapServiceRef.current.setEditMode(contextMenu.entityId, converted);
          setContextMenu(null);
        }}

        onDelete={() => {
          if (contextMenu && contextMenu.entityId) {
          }
        }}

        onDesignateTarget={() => {
          if (contextMenu && contextMenu.entityId) {
            const target = targetsState.byId[contextMenu.entityId];
            if (target) {
              const updatedTarget = {
                ...target,
                isAssigned: true,
                status: 'designated'
              };
              import('../../store/slices/targetsSlice').then(({ updateTarget }) => {
                dispatch(updateTarget(updatedTarget));
              });
            }
            setContextMenu(null);
          }
        }}
        onToggleFriend={() => {
          if (contextMenu && contextMenu.entityId) {
            const target = targetsState.byId[contextMenu.entityId];
            if (target) {
              handleTargetInfoAction(target.id, !target.friend)
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
      {drawUiState && drawUiPos && drawUiState.canFinish && (
        <button
          type="button"
          onClick={() => mapServiceRef.current?.finishEdit()}
          className="absolute z-[1000] flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white shadow-lg"
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
            className="absolute z-[1000] flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white shadow-lg"
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
      {mapObject && mapServiceRef.current && (<TargetsLayerManager map={mapObject} onAbort={handleAbortAction} />)}
      {mapObject && <MyPositionMarker map={mapObject} />}
      {mapObject && <GunLosLayer map={mapObject} position={myPosition} gunAzimut={gunAzimut} />}
      {mapObject && <MapDimmerAuto map={mapObject} opacity={brightness} />}
      {mapObject && <RadarNonCoverageLayer map={mapObject} center={[myPosition.lng, myPosition.lat]} radiusMeters={radarRange} angles={radarNonCoverage} lineWidth={2} />}
      {mapObject && <TabozoonLayer map={mapObject} center={[myPosition.lng, myPosition.lat]} />}
      {mapObject && <CompassNeedle bearing={bearing} />}
      {mapObject && !openSider && <EntitiesManager map={mapObject} mapServiceRef={mapServiceRef} />}

      {(!openSider) &&
        <div>
          <MapControls mapServiceRef={mapServiceRef} myPosition={props.myPosition} />
          <VideoWinButton onOpen={() => setIsVideoOpen(!isVideoOpen)} />
        </div>
      }

      {/* {mapObject && <TacticalCompassWidget/>} */}
      <VideoPlayer isOpen={isVideoOpen} />
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
          openSider={() => setOpenSider(!openSider)}
          onHamburgerClick={props.onHamburgerClick}
          onTargetsClick={props.onTargetsClick}
        />
      </div>
    </div>
  );
});

export default MapContainer;