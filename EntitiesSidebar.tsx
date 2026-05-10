import React, { FC, useState, useEffect, useMemo, useRef } from 'react';
import { FaEye, FaEyeSlash, FaCrosshairs, FaTrashAlt, FaPlus, FaCircleNotch, FaEllipsisH, FaMinus, FaRegSquare, FaChartPie, FaCopy } from 'react-icons/fa';
import { PiPolygonFill } from 'react-icons/pi';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import {
  Entity,
  addEntity,
  setSelectedEntity,
  toggleEntityVisibility,
  removeEntity,
  updateEntity,
  setActiveMissionName,
  upsertMissionName,
  setMissionEntityIds,
  removeMissionMetadata,
  addEntityToMission,
  setPreviewEntityId,
} from '../../store/slices/entitiesSlice';
import { useWebSocket } from '../../hooks/useWebSocket';
import { store } from '../../store/store';
import { MARKER_ICONS, getMarkerIconChar } from '../../constants/markerIcons';
import { ENTITY_CATEGORY_OPTIONS } from '../../constants/entityCategories';
import MissionSavePanel from './MissionSavePanel';
import { buildSaveEntityPayload } from '../../services/webSocket/saveEntityMessage';
import { buildSaveMissionEntitiesField } from '../../services/webSocket/saveMissionPayload';

interface EntitiesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onEditEntity: (entity: Entity) => void;
  onCenterToEntity: (entity: Entity) => void;
  onRequestCloseEditPanel?: () => void;
  onOpenCreatePanel?: () => void;
  onOpenCreateMarkerPanel?: () => void;
  editingEntityId?: string | null;
  mapServiceRef?: React.MutableRefObject<any>;
}

const EntitiesSidebar: FC<EntitiesSidebarProps> = ({
  isOpen,
  onClose,
  onEditEntity,
  onCenterToEntity,
  onRequestCloseEditPanel,
  onOpenCreatePanel,
  onOpenCreateMarkerPanel,
  editingEntityId,
  mapServiceRef
}) => {
  const dispatch = useAppDispatch();
  const entities = useAppSelector(state => state.entities);
  const selectedEntityId = useAppSelector(state => state.entities.selectedId);
  const missionsList = useAppSelector(state => state.entities.missionsList);
  const activeMissionName = useAppSelector(state => state.entities.activeMissionName);
  const [isEntityOpen, setIsEntityOpen] = useState(false);
  const [isPointsOpen, setIsPointsOpen] = useState(false);
  const [isMissionsOpen, setIsMissionsOpen] = useState(false);
  const [entityOpen, setEntityOpen] = useState<Entity | null>(null);
  const [openMarkerGroup, setOpenMarkerGroup] = useState<string | null>(null);
  const [openAreaCategory, setOpenAreaCategory] = useState<string | null>(null);
  const [openAreaTypeKey, setOpenAreaTypeKey] = useState<string | null>(null);
  const [areaSearchQuery, setAreaSearchQuery] = useState('');
  const [pointsSearchQuery, setPointsSearchQuery] = useState('');
  const [missionSaveFormOpen, setMissionSaveFormOpen] = useState(false);
  const [missionSaveFormMode, setMissionSaveFormMode] = useState<'create' | 'newCopy'>('create');
  const [missionSearchQuery, setMissionSearchQuery] = useState('');
  const [duplicateSourceEntity, setDuplicateSourceEntity] = useState<Entity | null>(null);
  const [duplicateName, setDuplicateName] = useState('');
  const [duplicateCategory, setDuplicateCategory] = useState('FREE');
  const { sendMessage } = useWebSocket();
  const missionsListRequestedRef = useRef(false);
  const isTabbozonEntity = (entity: Entity) => {
    const category = String(entity.category || '').trim().toUpperCase();
    const name = String(entity.name || '').trim().toUpperCase();
    return entity.type === 'sector' && (category === 'TABBOZON' || name === 'TABBOZON');
  };

  useEffect(() => {
    if (!isMissionsOpen) return;
    if (missionsListRequestedRef.current) return;
    // Load mission list only once per open cycle to avoid duplicate requests.
    sendMessage("GET_MISSIONS_LIST", {});
    missionsListRequestedRef.current = true;
  }, [isMissionsOpen, sendMessage]);

  useEffect(() => {
    if (!isMissionsOpen) {
      missionsListRequestedRef.current = false;
    }
  }, [isMissionsOpen]);

  useEffect(() => {
    if (!selectedEntityId) {
      setEntityOpen(null);
      return;
    }

    const selectedEntity = entities.allIds
      .map(id => entities.byId[id])
      .find(entity => entity?.id === selectedEntityId);

    if (selectedEntity) {
      setEntityOpen(selectedEntity);
    } else {
      setEntityOpen(null);
    }
  }, [entities, selectedEntityId]);

  const areaEntities = useMemo(() => {
    return entities.allIds
      .map((id) => entities.byId[id])
      .filter((e): e is Entity => Boolean(e) && e.type !== 'marker');
  }, [entities.allIds, entities.byId]);

  const areaByCategory = useMemo(() => {
    const out: Record<string, Record<string, Entity[]>> = {};
    for (const ent of areaEntities) {
      const cat = (ent.category || 'Other') as string;
      const type = (ent.type || 'Other') as string;
      if (!out[cat]) out[cat] = {};
      if (!out[cat][type]) out[cat][type] = [];
      out[cat][type].push(ent);
    }
    // deterministic order
    for (const cat of Object.keys(out)) {
      const types = out[cat];
      for (const type of Object.keys(types)) {
        types[type].sort((a, b) => a.name.localeCompare(b.name));
      }
    }
    return out;
  }, [areaEntities]);

  const areaSearchLower = areaSearchQuery.trim().toLowerCase();
  const filteredAreaByCategory = useMemo(() => {
    if (!areaSearchLower) return areaByCategory;
    const out: Record<string, Record<string, Entity[]>> = {};
    for (const [cat, types] of Object.entries(areaByCategory)) {
      const filteredTypes: Record<string, Entity[]> = {};
      for (const [type, list] of Object.entries(types)) {
        const filtered = list.filter((e) => e.name.toLowerCase().includes(areaSearchLower));
        if (filtered.length > 0) filteredTypes[type] = filtered;
      }
      if (Object.keys(filteredTypes).length > 0) out[cat] = filteredTypes;
    }
    return out;
  }, [areaByCategory, areaSearchLower]);

  const pointsByIcon = useMemo(() => {
    return entities.allIds
      .map((id) => entities.byId[id])
      .filter((e): e is Entity => Boolean(e) && e.type === 'marker')
      .reduce((acc: Record<string, Entity[]>, e) => {
        const code = (e.properties && (e.properties as any).iconChar) as string | undefined;
        const def = MARKER_ICONS.find((m) => m.code === code);
        const key = def?.label || 'Other';
        if (!acc[key]) acc[key] = [];
        acc[key].push(e);
        return acc;
      }, {});
  }, [entities.allIds, entities.byId]);

  const pointsSearchLower = pointsSearchQuery.trim().toLowerCase();
  const filteredPointsByIcon = useMemo(() => {
    if (!pointsSearchLower) return pointsByIcon;
    const out: Record<string, Entity[]> = {};
    for (const [icon, list] of Object.entries(pointsByIcon)) {
      const filtered = list.filter((e) => e.name.toLowerCase().includes(pointsSearchLower));
      if (filtered.length > 0) out[icon] = filtered;
    }
    return out;
  }, [pointsByIcon, pointsSearchLower]);

  const setGroupVisibility = (list: Entity[], visible: boolean) => {
    list.forEach((e) => dispatch(updateEntity({ id: e.id, visible })));
    if (mapServiceRef?.current) {
      const map = mapServiceRef.current.getMap();
      if (map) {
        list.forEach((e) => {
          const layerId = `entity-layer-${e.id}`;
          const iconLayerId = `entity-icon-layer-${e.id}`;
          const labelLayerId = `entity-label-layer-${e.id}`;
          const vis = visible ? 'visible' : 'none';
          if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', vis);
          if (map.getLayer(iconLayerId)) map.setLayoutProperty(iconLayerId, 'visibility', vis);
          if (map.getLayer(labelLayerId)) map.setLayoutProperty(labelLayerId, 'visibility', vis);
        });
      }
    }
  };

  const deleteGroup = (list: Entity[], label: string) => {
    if (editingEntityId && list.some((e) => e.id === editingEntityId)) {
      alert('לא ניתן למחוק ישות שנמצאת כרגע בעריכה.');
      return;
    }
    if (!window.confirm(`למחוק את ${label} (${list.length} פריטים)?`)) return;
    list.forEach((e) => {
      sendMessage("ENTITY_DELETED", { entityId: e.id });
      dispatch(removeEntity(e.id));
      mapServiceRef?.current?.removeEntityFromMap(e.id);
    });
    if (list.some((e) => e.id === selectedEntityId)) dispatch(setSelectedEntity(null));
  };

  const getEntityTypeLabel = (type: string) => {
    switch (type) {
      case 'circle':
        return 'מעגל';
      case 'ellipse':
        return 'אליפסה';
      case 'polygon':
        return 'פוליגון';
      case 'line':
        return 'קו';
      case 'sector':
        return 'מגזר (Tabbozon)';
      case 'rectangle':
        return 'מלבן';
      case 'target':
        return 'Target';
      default:
        return type;
    }
  };

  const getEntityCategoryIcon = (cat: string) => {
    const short = String(cat || '?').trim().slice(0, 3);
    const normalized = short ? short.toUpperCase() : '?';
    return (
      <span
        className="inline-flex items-center justify-center min-w-[24px] h-6 rounded bg-sky-500/20 text-sky-300 font-semibold text-[11px] px-1"
      >
        {normalized}
      </span>
    );
  };

  const getEntityTypeIcon = (type: string) => {
    const common = "w-3 h-3";
    switch (type) {
      case 'circle':
        return <FaCircleNotch className={common} />;
      case 'ellipse':
        return <FaEllipsisH className={common} />;
      case 'polygon':
      case 'rectangle':
        return <PiPolygonFill className={common} />;
      case 'line':
        return <FaMinus className={common} />;
      case 'sector':
        return <FaChartPie className={common} />;
      default:
        return <FaRegSquare className={common} />;
    }
  };

  const handleEntityClick = (entity: Entity) => {
    // נקודות (marker) – לא פותחות טופס עריכה בכלל
    if (entity.type === 'marker' || isTabbozonEntity(entity)) {
      dispatch(setSelectedEntity(entity.id));
      return;
    }
    dispatch(setSelectedEntity(entity.id));
    onEditEntity(entity);
  };

  const handleDeleteEntity = (e: React.MouseEvent, entity: Entity) => {
    e.stopPropagation();
    if (editingEntityId === entity.id) {
      alert('לא ניתן למחוק ישות שנמצאת כרגע בעריכה.');
      return;
    }
    if (!window.confirm(`למחוק את "${entity.name}"?`)) return;
    sendMessage("ENTITY_DELETED", { entityId: entity.id });
    dispatch(removeEntity(entity.id));
    if (mapServiceRef?.current) mapServiceRef.current.removeEntityFromMap(entity.id);
    if (selectedEntityId === entity.id) dispatch(setSelectedEntity(null));
  };

  const entitys_Selected = () => {
    setIsEntityOpen(prev => !prev);
    if (!isEntityOpen) {
      setIsPointsOpen(false);
      setOpenAreaCategory(null);
      setOpenAreaTypeKey(null);
    }
  };

  const saveToServer = (name: string) => {
    const n = String(name ?? '').trim();
    if (!n) return;
    const ent = store.getState().entities;
    let ids = ent.missionsByName[n]?.entityIds;
    if (!ids || ids.length === 0) {
      const active = ent.activeMissionName;
      if (active && ent.missionsByName[active]?.entityIds?.length) {
        ids = [...ent.missionsByName[active].entityIds];
      } else {
        ids = [];
      }
    }
    dispatch(setMissionEntityIds({ missionName: n, entityIds: ids }));
    sendMessage("SAVE_MISSION", {
      mission_name: n,
      entities: buildSaveMissionEntitiesField(ids, () => store.getState().entities.byId),
    });
    dispatch(setActiveMissionName(n));
    dispatch(upsertMissionName(n));
    sendMessage("GET_MISSIONS_LIST", {});
  };

  const openDuplicatePanel = (entity: Entity) => {
    setDuplicateSourceEntity(entity);
    setDuplicateName(`${entity.name} - copy`);
    setDuplicateCategory(entity.category || 'FREE');
    // Close edit panel while duplicating.
    onRequestCloseEditPanel?.();
    dispatch(setSelectedEntity(null));
  };

  const handleDuplicateSave = () => {
    if (!duplicateSourceEntity) return;
    const name = duplicateName.trim();
    const category = duplicateCategory.trim() || 'FREE';
    if (!name) return;
    const nextId = `entity_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const now = Date.now();
    const duplicatedEntity: Entity = {
      ...duplicateSourceEntity,
      id: nextId,
      name,
      category,
      visible: true,
      createdAt: now,
      updatedAt: now,
      coordinates: duplicateSourceEntity.coordinates ? JSON.parse(JSON.stringify(duplicateSourceEntity.coordinates)) : duplicateSourceEntity.coordinates,
      geometry: duplicateSourceEntity.geometry ? JSON.parse(JSON.stringify(duplicateSourceEntity.geometry)) : duplicateSourceEntity.geometry,
      properties: duplicateSourceEntity.properties ? JSON.parse(JSON.stringify(duplicateSourceEntity.properties)) : duplicateSourceEntity.properties,
    };
    dispatch(addEntity(duplicatedEntity));
    const payload = buildSaveEntityPayload(
      duplicatedEntity.id,
      duplicatedEntity.category,
      duplicatedEntity.type,
      duplicatedEntity.coordinates ?? []
    );
    if (payload) {
      sendMessage("SAVE_ENTITY", payload);
    }
    setDuplicateSourceEntity(null);
    setDuplicateName('');
    setDuplicateCategory('FREE');
  };

  const sortedMissionNames = useMemo(
    () => [...missionsList].sort((a, b) => a.localeCompare(b, 'he')),
    [missionsList]
  );
  const missionSearchLower = missionSearchQuery.trim().toLowerCase();
  const filteredMissionNames = useMemo(() => {
    if (!missionSearchLower) return sortedMissionNames;
    return sortedMissionNames.filter((m) => m.toLowerCase().includes(missionSearchLower));
  }, [sortedMissionNames, missionSearchLower]);

  if (!isOpen) return null;
  return (
    <div className="fixed left-0 top-[60px] h-full w-[300px] min-w-[280px] max-w-[340px] bg-[#1a1d24] shadow-xl z-50 flex flex-col border-r border-gray-700/50">
      <MissionSavePanel
        isOpen={missionSaveFormOpen}
        onClose={() => setMissionSaveFormOpen(false)}
        title={missionSaveFormMode === 'newCopy' ? 'שמירה כמשימה חדשה' : 'משימה חדשה'}
        subtitle={
          missionSaveFormMode === 'newCopy'
            ? 'כל הישויות שאינן FREE יישמרו תחת שם חדש. המשימה הפעילה תעודכן לשם שנבחר.'
            : 'רק ישויות שאינן FREE נשמרות בשרת כחלק מהמשימה.'
        }
        onSave={(missionName) => saveToServer(missionName)}
      />
      {duplicateSourceEntity && (
        <div className="fixed left-[340px] top-24 w-[330px] bg-[#1f2937] shadow-lg z-[1000] p-5 border border-gray-700/70 rounded">
          <div className="text-center border-b border-gray-600 pb-2 mb-4">
            <h3 className="text-lg font-semibold text-white">שכפול ישות</h3>
          </div>
          <div className="mb-3">
            <label className="block text-sm text-sky-100 font-medium mb-1">שם חדש</label>
            <input
              type="text"
              value={duplicateName}
              onChange={(e) => setDuplicateName(e.target.value)}
              className="input-dark w-full"
              autoFocus
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm text-sky-100 font-medium mb-1">קטגוריה</label>
            <select
              value={duplicateCategory}
              onChange={(e) => setDuplicateCategory(e.target.value)}
              className="input-dark w-full"
            >
              {ENTITY_CATEGORY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setDuplicateSourceEntity(null);
                setDuplicateName('');
                setDuplicateCategory('FREE');
              }}
              className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm"
            >
              ביטול
            </button>
            <button
              type="button"
              onClick={handleDuplicateSave}
              disabled={!duplicateName.trim()}
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium"
            >
              שמור שכפול
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700/50">
        <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700/50 transition-colors" title="סגור">
          <img src="./icons/back_arrow512.png" alt="" className="w-5 h-5 invert opacity-80" />
        </button>
        <span className="text-base font-semibold text-white">
          {isMissionsOpen ? 'Missions' : isPointsOpen ? 'Points' : 'Entities'}
        </span>
        {isEntityOpen && !isPointsOpen && !isMissionsOpen && <span className="text-xs text-gray-400">/ Areas</span>}
      </div>

      {!isEntityOpen && !isPointsOpen && !isMissionsOpen ? (
        <div className="flex-1 overflow-y-auto flex flex-col gap-1 p-3">
          <button
            type="button"
            onClick={() => {
              setIsMissionsOpen(true);
              setIsEntityOpen(false);
              setIsPointsOpen(false);
            }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 text-left text-white transition-colors">
            <img src="./icons/task_512.png" alt="" className="w-8 h-8 opacity-90" />
            <div className="flex flex-col">
              <span className="font-medium">Missions</span>
              <span className="text-xs text-gray-400">שמירה</span>
            </div>
          </button>
          <button
            type="button"
            onClick={entitys_Selected}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 text-left text_white transition-colors">
            <img src="./icons/polygon_512.png" alt="" className="w-8 h-8 opacity-90" />
            <div className="flex flex-col">
              <span className="font-medium">Areas</span>
              <span className="text-xs text-gray-400">אזורים וישויות</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsPointsOpen(true);
              setIsEntityOpen(false);
              setOpenMarkerGroup(null);
            }}
            className="mt-2 flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 text-left text-white transition-colors">
            <img src="./icons/pointing_center_512.png" alt="" className="w-8 h-8 opacity-90" />
            <div className="flex flex-col">
              <span className="font-medium">Points</span>
              <span className="text-xs text-gray-400">נקודות (markers)</span>
            </div>
          </button>
        </div>
      ) : isMissionsOpen ? (
        <div className="flex-1 overflow-y-auto flex flex-col p-3">
          <button
            type="button"
            onClick={() => setIsMissionsOpen(false)}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-3 text-sm"
          >
            <img src="./icons/back_arrow512.png" alt="" className="w-4 h-4 invert opacity-70" />
            חזרה
          </button>

          <div className="flex flex-col gap-2 mb-3 rounded-lg bg-gray-800/40 border border-gray-700/50 px-3 py-2">
            <p className="text-[11px] text-gray-400 leading-snug">
              <span className="text-gray-300 font-medium">טעינה:</span> ישויות משימה קודמות מוחלפות בישויות המשימה שנבחרה, וישויות שאינן חלק מהמשימה נשארות על המפה.
              {' '}
              <span className="text-gray-300 font-medium">עריכה:</span> אפשר להוסיף/לשנות ישויות, לשמור לאותה משימה או לשמור כמשימה חדשה.
            </p>
            {activeMissionName ? (
              <div className="text-xs text-sky-300 font-medium truncate" title={activeMissionName}>
                משימה פעילה: {activeMissionName}
              </div>
            ) : (
              <div className="text-xs text-gray-500">אין משימה פעילה — טען מהרשימה או צור משימה חדשה</div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wide px-1">כל המשימות</p>
            <div className="flex flex-wrap items-center justify-end gap-1.5">
              {activeMissionName ? (
                <>
                  <button
                    type="button"
                    onClick={() => saveToServer(activeMissionName)}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium"
                    title="שמירה לאותה משימה (כל הישויות על המפה)"
                  >
                    שמור
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMissionSaveFormMode('newCopy');
                      setMissionSaveFormOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium"
                    title="שמירה כמשימה חדשה (שם אחר)"
                  >
                    חדשה
                  </button>
                </>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setMissionSaveFormMode('create');
                  setMissionSaveFormOpen(true);
                }}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-600 hover:bg-sky-500 text-white shadow transition-colors"
                title="משימה חדשה"
              >
                <FaPlus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <input
            type="text"
            value={missionSearchQuery}
            onChange={(e) => setMissionSearchQuery(e.target.value)}
            placeholder="חיפוש בשם משימה..."
            className="w-full mb-2 px-3 py-1.5 rounded-lg bg-gray-800 text-white text-sm border border-gray-600 placeholder-gray-400 focus:outline-none focus:border-sky-500"
          />

          <div className="space-y-1.5">
            {filteredMissionNames.length === 0 ? (
              <div className="text-xs text-gray-400">
                {sortedMissionNames.length === 0 ? 'אין משימות להצגה' : 'אין תוצאות לחיפוש'}
              </div>
            ) : (
              filteredMissionNames.map((mName) => (
                <div
                  key={mName}
                  className={`group flex items-center justify-between gap-2 px-3 py-2 rounded-lg transition-colors
                    ${activeMissionName === mName ? 'bg-sky-600/25 border border-sky-500/40' : 'bg-gray-800/60 hover:bg-gray-700/70'}`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      dispatch(setActiveMissionName(mName));
                      setIsMissionsOpen(false);
                      setIsEntityOpen(true);
                      setIsPointsOpen(false);
                      setOpenAreaCategory(null);
                      setOpenAreaTypeKey(null);
                      sendMessage("LOAD_MISSION", { mission_name: mName });
                    }}
                    className="flex-1 text-left min-w-0 text-sm font-medium text-gray-100 truncate"
                    title="טען משימה לעריכה (מחליף את המפה)"
                  >
                    {mName}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!window.confirm(`למחוק את המשימה "${mName}"?`)) return;
                      sendMessage("DELETE_MISSION", { mission_name: mName });
                      dispatch(removeMissionMetadata(mName));
                    }}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded"
                    title="מחק מהרשימה (מקומי)"
                  >
                    <FaTrashAlt className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : isEntityOpen ? (
        <div className="flex-1 overflow-y-auto flex flex-col p-3">
          <button type="button" onClick={entitys_Selected} className="flex items-center gap-2 text-gray-400 hover:text-white mb-3 text-sm">
            <img src="./icons/back_arrow512.png" alt="" className="w-4 h-4 invert opacity-70" />
            חזרה
          </button>
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wide px-1">Existing areas</p>
            <button
              type="button"
              onClick={() => onOpenCreatePanel?.()}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-600 hover:bg-sky-500 text-white shadow transition-colors"
              title="יצירת ישות חדשה"
            >
              <FaPlus className="w-4 h-4" />
            </button>
          </div>
          <input
            type="text"
            value={areaSearchQuery}
            onChange={(e) => setAreaSearchQuery(e.target.value)}
            placeholder="חיפוש לפי שם ישות..."
            className="w-full mb-2 px-3 py-1.5 rounded-lg bg-gray-800 text-white text-sm border border-gray-600 placeholder-gray-400 focus:outline-none focus:border-sky-500"
          />
          <div className="space-y-2">
            {Object.entries(filteredAreaByCategory).map(([cat, types]) => {
              const catList = Object.values(types).flat();
              const catCount = catList.length;
              const isCatOpen = openAreaCategory === cat;
              const allHidden = catList.length > 0 && catList.every((e) => !e.visible);
              const hasEditingInCategory = !!editingEntityId && catList.some((e) => e.id === editingEntityId);
              return (
                <div key={cat}>
                  <div className="flex items-center gap-1 rounded-lg bg-gray-800/60 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenAreaCategory(isCatOpen ? null : cat);
                        setOpenAreaTypeKey(null);
                      }}
                      className="flex-1 flex items-center justify-between min-w-0 px-3 py-2 hover:bg-gray-700/70 text-sm text-gray-100 transition-colors text-right"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        {getEntityCategoryIcon(cat)}
                        <span className="inline-flex items-center justify-center min-w-[24px] h-6 rounded bg-sky-500/20 text-sky-300 font-semibold text-xs">
                          {catCount}
                        </span>
                        <span className="font-medium truncate">{cat}</span>
                      </span>
                      <span className="text-gray-400 text-xs shrink-0">{isCatOpen ? '▲' : '▼'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setGroupVisibility(catList, allHidden); }}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/70 rounded"
                      title={allHidden ? 'הצג כולם' : 'הסתר כולם'}
                    >
                      {allHidden ? <FaEye className="w-3.5 h-3.5" /> : <FaEyeSlash className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); deleteGroup(catList, `קטגוריה ${cat}`); }}
                      disabled={hasEditingInCategory}
                      className={`p-2 rounded ${hasEditingInCategory ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-red-400 hover:bg-red-900/20'}`}
                      title={hasEditingInCategory ? 'לא ניתן למחוק קטגוריה כשישות בתוכה בעריכה' : 'מחק קטגוריה'}
                    >
                      <FaTrashAlt className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {isCatOpen && (
                    <div className="mt-1 space-y-1 pl-2 border-l border-gray-700/60">
                      {Object.entries(types).map(([type, list]) => {
                        const typeKey = `${cat}:${type}`;
                        const isTypeOpen = openAreaTypeKey === typeKey;
                        const typeCount = list.length;
                        const typeLabel = getEntityTypeLabel(type);
                        const typeAllHidden = list.length > 0 && list.every((e) => !e.visible);
                        const hasEditingInType = !!editingEntityId && list.some((e) => e.id === editingEntityId);
                        return (
                          <div key={typeKey}>
                            <div className="flex items-center gap-1 rounded-lg bg-gray-900/20 overflow-hidden">
                              <button
                                type="button"
                                onClick={() => setOpenAreaTypeKey(isTypeOpen ? null : typeKey)}
                                className="flex-1 flex items-center justify-between min-w-0 px-3 py-2 hover:bg-gray-800/40 text-sm text-gray-100 transition-colors text-right"
                              >
                                <span className="flex items-center gap-2 min-w-0">
                                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-gray-800/60 text-gray-300">
                                    {getEntityTypeIcon(type)}
                                  </span>
                                  <span className="inline-flex items-center justify-center min-w-[18px] h-5 rounded bg-gray-800/60 text-gray-300 font-semibold text-[11px]">
                                    {typeCount}
                                  </span>
                                  <span className="truncate">{typeLabel}</span>
                                </span>
                                <span className="text-gray-400 text-xs shrink-0">{isTypeOpen ? '▲' : '▼'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setGroupVisibility(list, typeAllHidden); }}
                                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800/60 rounded"
                                title={typeAllHidden ? 'הצג כולם' : 'הסתר כולם'}
                              >
                                {typeAllHidden ? <FaEye className="w-3 h-3" /> : <FaEyeSlash className="w-3 h-3" />}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); deleteGroup(list, `סוג ${typeLabel}`); }}
                                disabled={hasEditingInType}
                                className={`p-1.5 rounded ${hasEditingInType ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-red-400 hover:bg-red-900/20'}`}
                                title={hasEditingInType ? 'לא ניתן למחוק סוג כשישות בתוכו בעריכה' : 'מחק סוג'}
                              >
                                <FaTrashAlt className="w-3 h-3" />
                              </button>
                            </div>

                            {isTypeOpen && (
                              <ul
                                className="mt-1 space-y-1.5"
                                onMouseLeave={() => {
                                  if (activeMissionName) dispatch(setPreviewEntityId(null));
                                }}
                              >
                                {list.map((entity) => {
                                  const isSelected = selectedEntityId === entity.id;
                                  return (
                                    <li
                                      key={entity.id}
                                      onMouseEnter={() => {
                                        if (activeMissionName) dispatch(setPreviewEntityId(entity.id));
                                      }}
                                      onClick={() => handleEntityClick(entity)}
                                      className={`group flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all cursor-pointer
                                        ${isSelected ? 'bg-sky-600/30 border border-sky-500/50 text-white' : 'bg-gray-700/40 hover:bg-gray-600/50 text-gray-200 border border-transparent'}
                                        ${!entity.visible ? 'opacity-60' : ''}`}
                                    >
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate">{entity.name}</div>
                                      </div>
                                      <div className={`flex items-center gap-0.5 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                        {activeMissionName ? (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              dispatch(
                                                addEntityToMission({
                                                  missionName: activeMissionName,
                                                  entityId: entity.id,
                                                })
                                              );
                                            }}
                                            className="p-1.5 text-sky-400 hover:text-white hover:bg-sky-900/40 rounded"
                                            title="הוסף למשימה הפעילה"
                                          >
                                            <FaPlus className="w-4 h-4" />
                                          </button>
                                        ) : null}
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onCenterToEntity(entity);
                                          }}
                                          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded"
                                          title="מרכז למפה"
                                        >
                                          <FaCrosshairs className="w-4 h-4" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const nextVisible = !entity.visible;
                                            dispatch(toggleEntityVisibility(entity.id));
                                            if (mapServiceRef?.current) {
                                              const map = mapServiceRef.current.getMap();
                                              if (map) {
                                                const layerId = `entity-layer-${entity.id}`;
                                                if (map.getLayer(layerId)) {
                                                  map.setLayoutProperty(layerId, 'visibility', nextVisible ? 'visible' : 'none');
                                                }
                                                const iconLayerId = `entity-icon-layer-${entity.id}`;
                                                if (map.getLayer(iconLayerId)) {
                                                  map.setLayoutProperty(iconLayerId, 'visibility', nextVisible ? 'visible' : 'none');
                                                }
                                                const labelLayerId = `entity-label-layer-${entity.id}`;
                                                if (map.getLayer(labelLayerId)) {
                                                  map.setLayoutProperty(labelLayerId, 'visibility', nextVisible ? 'visible' : 'none');
                                                }
                                              }
                                            }
                                          }}
                                          className={`p-1.5 rounded ${entity.visible ? 'text-green-400 hover:bg-green-900/30' : 'text-red-400 hover:bg-red-900/30'}`}
                                          title={entity.visible ? 'הסתר' : 'הצג'}
                                        >
                                          {entity.visible ? <FaEye className="w-4 h-4" /> : <FaEyeSlash className="w-4 h-4" />}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => handleDeleteEntity(e, entity)}
                                          disabled={editingEntityId === entity.id}
                                          className={`p-1.5 rounded ${editingEntityId === entity.id ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-red-400 hover:bg-red-900/30'}`}
                                          title={editingEntityId === entity.id ? 'לא ניתן למחוק ישות שנמצאת בעריכה' : 'מחק'}
                                        >
                                          <FaTrashAlt className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {entityOpen && selectedEntityId === entityOpen.id && (
            <div className="mt-3 px-3 py-2 rounded-lg bg-gray-700/30 text-sm text-gray-300 border border-gray-600/50">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-gray-500">נבחר: </span>
                  <span className="font-medium">{entityOpen.name}</span>
                  {entityOpen.category && <span className="text-gray-400"> · {entityOpen.category}</span>}
                </div>
                <button
                  type="button"
                  onClick={() => openDuplicatePanel(entityOpen)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-sky-700/40 hover:bg-sky-600/50 text-sky-200 text-xs"
                  title="שכפל ישות"
                >
                  <FaCopy className="w-3 h-3" />
                  שכפל
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Points (markers) view – separate window
        <div className="flex-1 overflow-y-auto flex flex-col p-3">
          <button
            type="button"
            onClick={() => { setIsPointsOpen(false); setOpenMarkerGroup(null); }}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-3 text-sm">
            <img src="./icons/back_arrow512.png" alt="" className="w-4 h-4 invert opacity-70" />
            חזרה
          </button>
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wide px-1">Points tree</p>
            <button
              type="button"
              onClick={() => onOpenCreateMarkerPanel?.()}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-600 hover:bg-sky-500 text-white shadow transition-colors"
              title="יצירת נקודה חדשה"
            >
              <FaPlus className="w-4 h-4" />
            </button>
          </div>
          <input
            type="text"
            value={pointsSearchQuery}
            onChange={(e) => setPointsSearchQuery(e.target.value)}
            placeholder="חיפוש לפי שם נקודה..."
            className="w-full mb-2 px-3 py-1.5 rounded-lg bg-gray-800 text-white text-sm border border-gray-600 placeholder-gray-400 focus:outline-none focus:border-sky-500"
          />
          {Object.entries(filteredPointsByIcon).map(([group, list]) => {
            const isOpenGroup = openMarkerGroup === group;
            const allHidden = list.length > 0 && list.every((e) => !e.visible);
            return (
              <div key={group} className="mb-1.5">
                <div className="flex items-center gap-1 rounded-lg bg-gray-800/70 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenMarkerGroup(isOpenGroup ? null : group)}
                    className="flex-1 flex items-center justify-between min-w-0 px-3 py-2 hover:bg-gray-700/80 text-sm text-gray-100 transition-colors text-right">
                    <span className="flex items-center gap-2 truncate">
                      {(() => {
                        const anyEntity = list[0];
                        const code = (anyEntity.properties && (anyEntity.properties as any).iconChar) as string | undefined;
                        const def = MARKER_ICONS.find(m => m.code === code);
                        if (!def) return null;
                        return (
                          <span
                            className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-900/80 text-lg shrink-0"
                            style={{ fontFamily: `${def.font}, sans-serif` }}
                          >
                            {getMarkerIconChar(def.code)}
                          </span>
                        );
                      })()}
                      <span className="font-medium truncate">{group}</span>
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-300 shrink-0">
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 rounded-full bg-sky-500/20 text-sky-300 font-semibold">
                        {list.length}
                      </span>
                      <span className="text-gray-400">{isOpenGroup ? '▲' : '▼'}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setGroupVisibility(list, allHidden); }}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/70 rounded"
                    title={allHidden ? 'הצג כולם' : 'הסתר כולם'}
                  >
                    {allHidden ? <FaEye className="w-3.5 h-3.5" /> : <FaEyeSlash className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); deleteGroup(list, group); }}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded"
                    title="מחק קבוצה"
                  >
                    <FaTrashAlt className="w-3.5 h-3.5" />
                  </button>
                </div>
                {isOpenGroup && (
                  <ul
                    className="mt-1 space-y-0.5 pl-3 border-l border-gray-700/70"
                    onMouseLeave={() => {
                      if (activeMissionName) dispatch(setPreviewEntityId(null));
                    }}
                  >
                    {list.map((entity) => {
                      const isSelected = selectedEntityId === entity.id;
                      return (
                        <li
                          key={entity.id}
                          onMouseEnter={() => {
                            if (activeMissionName) dispatch(setPreviewEntityId(entity.id));
                          }}
                          className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs cursor-pointer
                            ${isSelected ? 'bg-sky-600/30 text-white' : 'bg-gray-700/40 hover:bg-gray-600/50 text-gray-200'}`}
                          onClick={() => handleEntityClick(entity)}
                        >
                          {activeMissionName ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                dispatch(
                                  addEntityToMission({
                                    missionName: activeMissionName,
                                    entityId: entity.id,
                                  })
                                );
                              }}
                              className="p-1 text-sky-400 hover:text-white hover:bg-sky-900/40 rounded"
                              title="הוסף למשימה הפעילה"
                            >
                              <FaPlus className="w-3 h-3" />
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onCenterToEntity(entity); }}
                            className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded"
                            title="מרכז למפה"
                          >
                            <FaCrosshairs className="w-3 h-3" />
                          </button>
                          <span className="flex-1 truncate text-right">{entity.name}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const nextVisible = !entity.visible;
                              dispatch(toggleEntityVisibility(entity.id));
                              if (mapServiceRef?.current) {
                                const map = mapServiceRef.current.getMap();
                                if (map) {
                                  const iconLayerId = `entity-icon-layer-${entity.id}`;
                                  if (map.getLayer(iconLayerId)) {
                                    map.setLayoutProperty(iconLayerId, 'visibility', nextVisible ? 'visible' : 'none');
                                  }
                                }
                              }
                            }}
                            className={`p-1 rounded ${entity.visible ? 'text-green-400 hover:bg-green-900/30' : 'text-red-400 hover:bg-red-900/30'}`}
                            title={entity.visible ? 'הסתר' : 'הצג'}
                          >
                            {entity.visible ? <FaEye className="w-3 h-3" /> : <FaEyeSlash className="w-3 h-3" />}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteEntity(e, entity)}
                            className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded"
                            title="מחק"
                          >
                            <FaTrashAlt className="w-3 h-3" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EntitiesSidebar; 