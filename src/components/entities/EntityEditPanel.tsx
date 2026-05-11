import React, { useState, useEffect, FC } from 'react';
import { FaTimes, FaTrashAlt } from 'react-icons/fa';
import { RiImageEditLine } from "react-icons/ri";
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { Entity, updateEntity, setSelectedEntity } from '../../store/slices/entitiesSlice';
import { ENTITY_CATEGORY_OPTIONS } from '../../constants/entityCategories';
import { EntityFormCategory, parseEntityFormCategory } from '../../enums/entityCategory.enum';
import { createCirclePolygon, createEllipsePolygon, createSectorPolygon } from '../../utils/geometry';
import { closePolygonCoordinates, openPolygonCoordinates } from '../../services/entities/EntityGeometryService';
import { useWebSocket } from '../../hooks/useWebSocket';
import { WsMessageName } from '../../enums/ws.enum';
import { buildUpdateEntityPayload } from '../../services/webSocket/saveEntityMessage';

interface EntityEditPanelProps {
  entity: Entity | null;
  isOpen: boolean;
  onClose: () => void;
  onCenterToEntity: (entity: Entity) => void;
  mapServiceRef?: React.MutableRefObject<any>;
}

const EntityEditPanel: FC<EntityEditPanelProps> = ({
  entity,
  isOpen,
  onClose,
  mapServiceRef
}) => {
  const dispatch = useAppDispatch();
  const { sendMessage } = useWebSocket();
  const [showCoordinates, setShowCoordinates] = useState(false);
  const [editingCoords, setEditingCoords] = useState<Array<{ lng: number, lat: number }>>([]);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [heightMeters, setHeightMeters] = useState<number>(0);

  const sendUpdatedEntity = (nextEntity: Entity) => {
    const payload = buildUpdateEntityPayload(
      nextEntity.id,
      nextEntity.category,
      nextEntity.type,
      nextEntity.coordinates ?? []
    );
    if (!payload) return;
    sendMessage(WsMessageName.UpdateEntity, payload);
  };

  useEffect(() => {
    if (entity?.coordinates && showCoordinates) {
      let coords = [...entity.coordinates];
      // For polygon, strip duplicate closing point so form shows real vertices (3 created → 3 in form)
      if (entity.type === 'polygon') {
        coords = openPolygonCoordinates(coords);
      }
      setEditingCoords(coords);
    }
  }, [entity?.id, entity?.type, showCoordinates, entity?.coordinates]);

  useEffect(() => {
    const alt = Number(entity?.coordinates?.[0]?.alt ?? 0);
    setHeightMeters(Number.isFinite(alt) ? alt : 0);
  }, [entity?.id, entity?.coordinates]);

  const applyCoordinateChanges = () => {
    if (!entity || !mapServiceRef?.current) return;

    // Polygon must have at least 3 points
    if (entity.type === 'polygon' && editingCoords.length < 3) {
      alert('פוליגון חייב לכלול לפחות 3 נקודות.');
      return;
    }

    let geoJsonCoordinates;
    let nextCoordinates = [...editingCoords];
    if (entity.type === 'polygon') {
      // GeoJSON Polygon ring must be closed (first position = last position)
      const closedCoords = closePolygonCoordinates(editingCoords);
      nextCoordinates = closedCoords;
      geoJsonCoordinates = [closedCoords.map(c => [c.lng, c.lat])];
    } else if (entity.type === 'line') {
      geoJsonCoordinates = editingCoords.map(c => [c.lng, c.lat]);
    } else if (entity.type === 'circle' && editingCoords.length >= 2) {
      const polygonPoints = createCirclePolygon(editingCoords[0], editingCoords[1], 64);
      geoJsonCoordinates = [polygonPoints.map(c => [c.lng, c.lat])];
    } else if (entity.type === 'ellipse' && editingCoords.length >= 2) {
      const polygonPoints = createEllipsePolygon(editingCoords[0], editingCoords[1], 64);
      geoJsonCoordinates = [polygonPoints.map(c => [c.lng, c.lat])];
    } else if (entity.type === 'sector' && editingCoords.length >= 3) {
      const polygonPoints = createSectorPolygon(editingCoords[0], editingCoords[1], editingCoords[2], 32);
      geoJsonCoordinates = [polygonPoints.map(c => [c.lng, c.lat])];
    } else {
      geoJsonCoordinates = editingCoords.length > 0 ? [editingCoords[0].lng, editingCoords[0].lat] : [0, 0];
    }

    dispatch(updateEntity({
      id: entity.id,
      coordinates: nextCoordinates,
      geometry: { type: entity.geometry.type, coordinates: geoJsonCoordinates }
    }));
  };

  const handleFormChange = (updates: Partial<Entity>) => {
    if (!entity) return;
    dispatch(updateEntity({
      id: entity.id,
      ...updates
    }));
  };

  const handleHeightChange = (next: number) => {
    if (!entity) return;
    const safeHeight = Number.isFinite(next) ? next : 0;
    setHeightMeters(safeHeight);
    const nextCoords = (entity.coordinates ?? []).map((c: any) => ({ ...c, alt: safeHeight }));
    handleFormChange({ coordinates: nextCoords });
  };

  const handleCancel = () => {
    dispatch(setSelectedEntity(null));
    setShowCoordinates(false);
    onClose();
  };

  const finishEdit = () => {
    if (mapServiceRef?.current) {
      mapServiceRef.current.triggerFinishEdit();
      setEditMode(false);
    }
  };

  const handleSubmit = () => {
    if (!entity) return;
    sendUpdatedEntity(entity);
  };

  const handleWaypointsClick = () => {
    if (!entity) return;
    // נקודה (marker) – אין עריכה גאומטרית בכלל
    if (entity.type === 'marker') {
      return;
    }
    if (entity && mapServiceRef?.current) {
      let coordinates: Array<{ lng: number; lat: number }> = [];
      if ((entity.type === 'polygon' || entity.type === 'sector' || entity.type === 'line') && entity.coordinates && entity.coordinates.length > 0) {
        coordinates = entity.type === 'polygon' ? openPolygonCoordinates(entity.coordinates) : entity.coordinates;
      } else if ((entity.type === 'circle' || entity.type === 'ellipse') && entity.coordinates) {
        coordinates = entity.coordinates;
      }

      const mapEntity = {
        id: entity.id,
        type: entity.type,
        coordinates: coordinates,
        properties: {
          name: entity.name,
          category: entity.category
        },
        style: {
          fillColor: entity.color,
          fillOpacity: entity.transparency
        }
      };

      mapServiceRef.current.setEditMode(entity.id, mapEntity);
      setEditMode(true);
    }
  };

  if (!isOpen || !entity) return null;

  return (
    <div className="fixed left-[340px] top-24 max-h-1/2 w-[340px] bg-[#1f2937] shadow-lg z-[1000] p-4">
      <button
        onClick={handleCancel}
        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 z-50">
        <FaTimes size={24} />
      </button>

      <div className="h-full overflow-y-auto">
        <div className="w-full p-4 font-sans flex flex-col">
          <div className="text-center border-b border-gray-600 pb-2 mb-2">
            <h3 className="text-xl font-semibold text-white">Editing Entity</h3>
          </div>
          <div className="mb-1.5 flex space-x-3 items-center">
            <label className="block text-xs text-sky-100 font-medium min-w-12">Name</label>
            <input
              type="text"
              value={entity?.name || ''}
              onChange={(e) => handleFormChange({ name: e.target.value })}
              className="w-full px-2 py-1 bg-gray-800 text-white border border-gray-600 rounded text-xs focus:outline-none focus:border-sky-500 transition-colors text-right" />
          </div>
          <div className="mb-1.5 flex space-x-3 items-center">
            <label className="block text-xs text-sky-100 font-medium min-w-12">Height</label>
            <input
              type="number"
              value={heightMeters}
              onChange={(e) => handleHeightChange(Number(e.target.value))}
              className="w-full px-2 py-1 bg-gray-800 text-white border border-gray-600 rounded text-xs focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          <div className="mb-1.5 flex space-x-3 items-center">
            <label className="block text-xs text-sky-100 font-medium min-w-12">Type</label>
            <select
              value={entity?.category || EntityFormCategory.FREE}
              onChange={(e) => handleFormChange({ category: parseEntityFormCategory(e.target.value) })}
              className="w-full px-2 py-1 bg-gray-800 text-white border border-gray-600 rounded text-xs focus:outline-none focus:border-sky-500 transition-colors">
              {ENTITY_CATEGORY_OPTIONS.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>

            <input
              type="color"
              value={entity?.color || '#3b82f6'}
              onChange={(e) => handleFormChange({ color: e.target.value })}
              className="w-[42%] h-7 bg-gray-800 border border-gray-600 rounded cursor-pointer" />
          </div>

          <div className="mb-1.5 mt-2.5 flex space-x-3 items-center">
            <label className="block text-xs text-sky-100 font-medium textright min-w-12">
              Opacity {entity?.transparency ?? 0}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={entity?.transparency ?? 0}
              onChange={(e) => handleFormChange({ transparency: Number(e.target.value) })}
              className="h-2 w-full bg-gray-700 rounded-lg appearance-none cursor-pointer mt-1" />
          </div>

          <div>
            <button
              onClick={() => handleWaypointsClick()}
              className="w-full flex items-center justify-center space-x-2 bg-gray-700 text-white px-2 py-1 rounded mb-2">
              <RiImageEditLine className='w-6 h-6' color='white' />
            </button>
            {editMode &&
              <button
                id="finish-edit-btn"
                className="w-full flex items-center justify-center space-x-2 bg-gray-700 text-white px-2 py-1 rounded mb-2"
                onClick={finishEdit}
              >End </button>
            }
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full flex items-center justify-center space-x-2 bg-sky-700 hover:bg-sky-600 text-white px-2 py-1 rounded mb-2"
            >
              שליחה
            </button>
            <button
              onClick={() => setShowCoordinates(!showCoordinates)}
              className="w-full flex items-center justify-center space-x-2 bg-gray-700 text-white px-2 py-1 rounded mb-2">
              <span className='text-xs'>{showCoordinates ? 'Hibe' : 'Show'} Points </span>
            </button>

            {showCoordinates && entity?.coordinates && (
              <div className="bg-gray-800 rounded p-3 max-h-[450px] overflow-y-auto scrollbar-hide">
                {editingCoords.map((coord, index) => {
                  const minPoints =
                    entity.type === 'polygon' ? 3 :
                      entity.type === 'line' ? 2 :
                        entity.type === 'sector' ? 3 :
                          2;
                  const canDelete =
                    (entity.type === 'polygon' || entity.type === 'line' || entity.type === 'sector') &&
                    editingCoords.length > minPoints;
                  return (
                    <div key={index} className="pb-1">
                      <div className="grid grid-cols-[1fr_1fr_auto] gap-1.5 items-center">
                        <div>
                          <input
                            step="0.000001"
                            value={coord.lng}
                            onChange={(e) => {
                              const newCoords = [...editingCoords];
                              newCoords[index] = { ...newCoords[index], lng: parseFloat(e.target.value) || 0 };
                              setEditingCoords(newCoords);
                            }}
                            className="w-full px-2 py-1 bg-gray-700 text-white text-xs border border-gray-600 rounded focus:outline-none focus:border-sky-500"
                          />
                        </div>
                        <div>
                          <input
                            step="0.000001"
                            value={coord.lat}
                            onChange={(e) => {
                              const newCoords = [...editingCoords];
                              newCoords[index] = { ...newCoords[index], lat: parseFloat(e.target.value) || 0 };
                              setEditingCoords(newCoords);
                            }}
                            className="w-full px-2 py-1 bg-gray-700 text-white text-xs border border-gray-600 rounded focus:outline-none focus:border-sky-500"
                          />
                        </div>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => {
                              const newCoords = editingCoords.filter((_, i) => i !== index);
                              setEditingCoords(newCoords);
                            }}
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/40 rounded"
                            title="מחק נקודה"
                          >
                            <FaTrashAlt className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div className="flex items-center justify-center text-white space-x-4 mt-6">
                  <div onClick={applyCoordinateChanges} className='flex items-center justify-center'>
                    <img src="./icons/check_ok_512.png" alt="" className='m-2 h-8 w-8' />
                    <span className="text-lg font-bold text-[#98a5db]" >Ok </span>
                  </div>
                  <div className='flex items-center justify-center'>
                    <img src="./icons/back_arrow512.png" alt="" className='m-2 h-8 w-8' onClick={onClose} />
                    <span className="text-lg font-bold text-[#98a5db]">Cancel </span>
                  </div>
                </div>
              </div>)}
          </div>
        </div>
      </div>
    </div>
  )
};

export default EntityEditPanel;
