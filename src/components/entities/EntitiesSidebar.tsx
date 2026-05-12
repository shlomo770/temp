import React, { FC, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import {
  Entity,
  addEntity,
  setSelectedEntity,
  removeEntity,
  updateEntity,
  setActiveMissionName,
  upsertMissionName,
  setMissionEntityIds,
  renameMission,
} from '../../store/slices/entitiesSlice';
import { useWebSocket } from '../../hooks/useWebSocket';
import { store } from '../../store/store';
import { MARKER_ICONS } from '../../constants/MarkerIcons';
import { WsMessageName } from '../../enums/ws.enum';
import { ENTITY_CATEGORY_OPTIONS } from '../../constants/entityCategories';
import { buildSaveEntityPayload, toEntityCategoryEnum } from '../../services/webSocket/saveEntityMessage';
import { buildSaveMissionEntitiesField } from '../../services/webSocket/saveMissionPayload';
import { EntityCategoryEnum } from '../../enums/entitis.enum';
import EntitiesSidebarHome from './entitiesSidebar/EntitiesSidebarHome';
import EntitiesSidebarMissionsSection from './entitiesSidebar/EntitiesSidebarMissionsSection';
import EntitiesSidebarAreasSection from './entitiesSidebar/EntitiesSidebarAreasSection';
import EntitiesSidebarPointsSection from './entitiesSidebar/EntitiesSidebarPointsSection';
import { pickMissionCopyName, pickNewMissionName } from './entitiesSidebar/entitiesSidebarUtils';
import { setEntityVisibilityOnMap } from '../../utils/mapEntityLayerVisibility';
import type { MinimalMap } from '../../utils/mapEntityLayerVisibility';
import { swalConfirmDanger, swalInfo } from '../../utils/swalDialog';

interface EntitiesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onEditEntity: (entity: Entity) => void;
  onCenterToEntity: (entity: Entity) => void;
  onRequestCloseEditPanel?: () => void;
  onOpenCreatePanel?: () => void;
  onOpenCreatePanelWithCategory?: (category: EntityCategoryEnum) => void;
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
  onOpenCreatePanelWithCategory,
  onOpenCreateMarkerPanel,
  editingEntityId,
  mapServiceRef,
}) => {
  const dispatch = useAppDispatch();
  const entities = useAppSelector((state) => state.entities);
  const selectedEntityId = useAppSelector((state) => state.entities.selectedId);
  const missionsList = useAppSelector((state) => state.entities.missionsList);
  const activeMissionName = useAppSelector((state) => state.entities.activeMissionName);
  const missionListUiResetNonce = useAppSelector((state) => state.entities.missionListUiResetNonce);
  const [isEntityOpen, setIsEntityOpen] = useState(false);
  const [isPointsOpen, setIsPointsOpen] = useState(false);
  const [isMissionsOpen, setIsMissionsOpen] = useState(false);
  const [entityOpen, setEntityOpen] = useState<Entity | null>(null);
  const [openMarkerGroup, setOpenMarkerGroup] = useState<string | null>(null);
  const [openAreaCategory, setOpenAreaCategory] = useState<string | null>(null);
  const [openAreaTypeKey, setOpenAreaTypeKey] = useState<string | null>(null);
  const [areaSearchQuery, setAreaSearchQuery] = useState('');
  const [pointsSearchQuery, setPointsSearchQuery] = useState('');
  const [missionSearchQuery, setMissionSearchQuery] = useState('');
  const localDraftMissionNamesRef = useRef<Set<string>>(new Set());
  const [duplicateSourceEntity, setDuplicateSourceEntity] = useState<Entity | null>(null);
  const [duplicateName, setDuplicateName] = useState('');
  const [duplicateCategory, setDuplicateCategory] = useState(EntityCategoryEnum.FREE);
  const { sendMessage } = useWebSocket();

  const missionBarResetSeen = useRef(missionListUiResetNonce);
  useEffect(() => {
    if (missionListUiResetNonce === missionBarResetSeen.current) return;
    missionBarResetSeen.current = missionListUiResetNonce;
    setIsMissionsOpen(false);
  }, [missionListUiResetNonce]);

  useEffect(() => {
    if (!selectedEntityId) {
      setEntityOpen(null);
      return;
    }

    const selectedEntity = entities.allIds
      .map((id) => entities.byId[id])
      .find((entity) => entity?.id === selectedEntityId);

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
      const cat = EntityCategoryEnum[ent.category] || EntityCategoryEnum.FREE;
      const type = (ent.type || 'Other') as string;
      if (!out[cat]) out[cat] = {};
      if (!out[cat][type]) out[cat][type] = [];
      out[cat][type].push(ent);
    }
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
        const code = (e.properties && (e.properties as { iconChar?: string }).iconChar) as string | undefined;
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

  const setGroupVisibility = useCallback(
    (list: Entity[], visible: boolean) => {
      list.forEach((e) => dispatch(updateEntity({ id: e.id, visible })));
      const map = mapServiceRef?.current?.getMap?.() as MinimalMap | null | undefined;
      if (map) {
        list.forEach((e) => setEntityVisibilityOnMap(map, e.id, visible));
      }
    },
    [dispatch, mapServiceRef]
  );

  const deleteGroup = useCallback(
    async (list: Entity[], label: string) => {
      if (editingEntityId && list.some((e) => e.id === editingEntityId)) {
        await swalInfo('לא ניתן למחוק ישות שנמצאת כרגע בעריכה.', 'לא ניתן למחוק');
        return;
      }
      const ok = await swalConfirmDanger(
        `למחוק את <strong>${label}</strong> (${list.length} פריטים)?`,
        { title: 'מחיקת קבוצה', confirmText: 'מחק', cancelText: 'ביטול', richText: true }
      );
      if (!ok) return;
      list.forEach((e) => {
        sendMessage(WsMessageName.EntityDeleted, { id: e.id, type: toEntityCategoryEnum(e.type) });
        dispatch(removeEntity(e.id));
        mapServiceRef?.current?.removeEntityFromMap?.(e.id);
      });
      if (list.some((e) => e.id === selectedEntityId)) dispatch(setSelectedEntity(null));
    },
    [editingEntityId, sendMessage, dispatch, mapServiceRef, selectedEntityId]
  );

  const handleMissionMemberIdsChange = useCallback(
    (ids: string[]) => {
      if (!activeMissionName) return;
      dispatch(setMissionEntityIds({ missionName: activeMissionName, entityIds: ids }));
    },
    [activeMissionName, dispatch]
  );

  const createLocalMission = useCallback(() => {
    const list = store.getState().entities.missionsList;
    const name = pickNewMissionName(list);
    dispatch(upsertMissionName(name));
    dispatch(setMissionEntityIds({ missionName: name, entityIds: [] }));
    localDraftMissionNamesRef.current.add(name);
  }, [dispatch]);

  const handleMissionRename = useCallback(
    async (oldName: string, newName: string): Promise<boolean> => {
      const t = newName.trim();
      if (!t) return false;
      if (t === oldName) return true;
      const list = store.getState().entities.missionsList;
      if (list.some((x) => x !== oldName && x === t)) {
        await swalInfo('כבר קיימת משימה בשם זה.', 'שם כפול');
        return false;
      }
      dispatch(renameMission({ oldName, newName: t }));
      const draft = localDraftMissionNamesRef.current;
      if (draft.has(oldName)) {
        draft.delete(oldName);
        draft.add(t);
      }
      return true;
    },
    [dispatch]
  );

  const saveMissionToServer = useCallback(
    (name: string, explicitIds?: string[]) => {
      const n = String(name ?? '').trim();
      if (!n) return;
      localDraftMissionNamesRef.current.delete(n);
      const ent = store.getState().entities;
      let ids: string[];
      if (explicitIds) {
        ids = [...explicitIds];
      } else {
        const fromMission = ent.missionsByName[n]?.entityIds;
        if (fromMission && fromMission.length > 0) {
          ids = [...fromMission];
        } else {
          const active = ent.activeMissionName;
          if (active && ent.missionsByName[active]?.entityIds?.length) {
            ids = [...ent.missionsByName[active].entityIds];
          } else {
            ids = [];
          }
        }
      }
      dispatch(setMissionEntityIds({ missionName: n, entityIds: ids }));
      sendMessage(WsMessageName.SaveMission, {
        mission_name: n,
        entities: buildSaveMissionEntitiesField(ids),
      });
      dispatch(setActiveMissionName(n));
      dispatch(upsertMissionName(n));
    },
    [dispatch, sendMessage]
  );

  const saveMissionCopyToServer = useCallback(async () => {
    const ent = store.getState().entities;
    const active = ent.activeMissionName;
    if (!active) {
      await swalInfo('אין משימה פעילה — פתחו משימה מהרשימה ואז שמרו עותק.', 'אין משימה פעילה');
      return;
    }
    const ids = [...(ent.missionsByName[active]?.entityIds ?? [])];
    const newName = pickMissionCopyName(active, ent.missionsList);
    saveMissionToServer(newName, ids);
  }, [saveMissionToServer]);

  const entitys_Selected = () => {
    setIsEntityOpen((prev) => !prev);
    if (!isEntityOpen) {
      setIsPointsOpen(false);
      setOpenAreaCategory(null);
      setOpenAreaTypeKey(null);
    }
  };

  const openDuplicatePanel = (entity: Entity) => {
    setDuplicateSourceEntity(entity);
    setDuplicateName(`${entity.name} - copy`);
    setDuplicateCategory(entity.category || EntityCategoryEnum.FREE);
    onRequestCloseEditPanel?.();
    dispatch(setSelectedEntity(null));
  };

  const handleDuplicateSave = () => {
    if (!duplicateSourceEntity) return;
    const name = duplicateName.trim();
    const category = duplicateCategory || EntityCategoryEnum.FREE;
    if (!name) return;
    const nextId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const now = Date.now();
    const duplicatedEntity: Entity = {
      ...duplicateSourceEntity,
      id: nextId,
      name,
      category,
      visible: true,
      createdAt: now,
      updatedAt: now,
      coordinates: duplicateSourceEntity.coordinates
        ? JSON.parse(JSON.stringify(duplicateSourceEntity.coordinates))
        : duplicateSourceEntity.coordinates,
      geometry: duplicateSourceEntity.geometry
        ? JSON.parse(JSON.stringify(duplicateSourceEntity.geometry))
        : duplicateSourceEntity.geometry,
      properties: duplicateSourceEntity.properties
        ? JSON.parse(JSON.stringify(duplicateSourceEntity.properties))
        : duplicateSourceEntity.properties,
    };
    dispatch(addEntity(duplicatedEntity));
    const payload = buildSaveEntityPayload(
      duplicatedEntity.id,
      duplicatedEntity.category,
      duplicatedEntity.type,
      duplicatedEntity.coordinates ?? [],
      duplicatedEntity.name
    );
    if (payload) {
      payload.type = toEntityCategoryEnum(payload.type);
      sendMessage(WsMessageName.SaveEntity, payload);
    }
    setDuplicateSourceEntity(null);
    setDuplicateName('');
    setDuplicateCategory(EntityCategoryEnum.FREE);
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
    <div className="fixed left-0 top-[60px] z-50 flex h-full min-w-[280px] max-w-[340px] w-[300px] flex-col border-r border-gray-700/50 bg-[#1a1d24] shadow-xl">
      {duplicateSourceEntity && (
        <div className="fixed left-[340px] top-24 z-[1000] w-[330px] rounded border border-gray-700/70 bg-[#1f2937] p-5 shadow-lg">
          <div className="mb-4 border-b border-gray-600 pb-2 text-center">
            <h3 className="text-lg font-semibold text-white">שכפול ישות</h3>
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium text-sky-100">שם חדש</label>
            <input
              type="text"
              value={duplicateName}
              onChange={(e) => setDuplicateName(e.target.value)}
              className="input-dark w-full"
              autoFocus
            />
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-sky-100">קטגוריה</label>
            <select
              value={duplicateCategory}
              onChange={(e) => setDuplicateCategory(e.target.value as unknown as EntityCategoryEnum)}
              className="input-dark w-full"
            >
              {ENTITY_CATEGORY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setDuplicateSourceEntity(null);
                setDuplicateName('');
                setDuplicateCategory(EntityCategoryEnum.FREE);
              }}
              className="rounded-lg bg-gray-700 px-3 py-1.5 text-sm text-white hover:bg-gray-600"
            >
              ביטול
            </button>
            <button
              type="button"
              onClick={handleDuplicateSave}
              disabled={!duplicateName.trim()}
              className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              שמור שכפול
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-gray-700/50 px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-700/50 hover:text-white"
          title="סגור"
        >
          <img src="./icons/back_arrow512.png" alt="" className="h-5 w-5" />
        </button>
        <span className="text-base font-semibold text-white">
          {isMissionsOpen ? 'Missions' : isPointsOpen ? 'Points' : 'Entities'}
        </span>
        {isEntityOpen && !isPointsOpen && !isMissionsOpen && (
          <span className="text-xs text-gray-400">/ Areas</span>
        )}
      </div>

      {!isEntityOpen && !isPointsOpen && !isMissionsOpen ? (
        <EntitiesSidebarHome
          onOpenMissions={() => {
            setIsMissionsOpen(true);
            setIsEntityOpen(false);
            setIsPointsOpen(false);
          }}
          onOpenAreas={entitys_Selected}
          onOpenPoints={() => {
            setIsPointsOpen(true);
            setIsEntityOpen(false);
            setOpenMarkerGroup(null);
          }}
        />
      ) : isMissionsOpen ? (
        <EntitiesSidebarMissionsSection
          onBackToRoot={() => setIsMissionsOpen(false)}
          activeMissionName={activeMissionName}
          sortedMissionNames={sortedMissionNames}
          filteredMissionNames={filteredMissionNames}
          missionSearchQuery={missionSearchQuery}
          setMissionSearchQuery={setMissionSearchQuery}
          localDraftMissionNamesRef={localDraftMissionNamesRef}
          createLocalMission={createLocalMission}
          sendMessage={sendMessage}
          dispatch={dispatch}
          missionsByName={entities.missionsByName}
          entitiesById={entities.byId}
          onMissionMemberIdsChange={handleMissionMemberIdsChange}
          saveMissionToServer={saveMissionToServer}
          onOpenMissionSaveCopy={saveMissionCopyToServer}
          handleMissionRename={handleMissionRename}
          onOpenCreatePanelWithCategory={onOpenCreatePanelWithCategory}
          onOpenCreateMarkerPanel={onOpenCreateMarkerPanel}
          onCenterToEntity={onCenterToEntity}
        />
      ) : isEntityOpen ? (
        <EntitiesSidebarAreasSection
          onBack={entitys_Selected}
          areaSearchQuery={areaSearchQuery}
          setAreaSearchQuery={setAreaSearchQuery}
          filteredAreaByCategory={filteredAreaByCategory}
          openAreaCategory={openAreaCategory}
          setOpenAreaCategory={setOpenAreaCategory}
          openAreaTypeKey={openAreaTypeKey}
          setOpenAreaTypeKey={setOpenAreaTypeKey}
          editingEntityId={editingEntityId}
          selectedEntityId={selectedEntityId}
          activeMissionName={activeMissionName}
          mapServiceRef={mapServiceRef}
          dispatch={dispatch}
          sendMessage={sendMessage}
          setGroupVisibility={setGroupVisibility}
          deleteGroup={deleteGroup}
          onEditEntity={onEditEntity}
          onCenterToEntity={onCenterToEntity}
          onOpenCreatePanel={onOpenCreatePanel}
          entityOpen={entityOpen}
          openDuplicatePanel={openDuplicatePanel}
        />
      ) : (
        <EntitiesSidebarPointsSection
          onBack={() => {
            setIsPointsOpen(false);
            setOpenMarkerGroup(null);
          }}
          pointsSearchQuery={pointsSearchQuery}
          setPointsSearchQuery={setPointsSearchQuery}
          filteredPointsByIcon={filteredPointsByIcon}
          openMarkerGroup={openMarkerGroup}
          setOpenMarkerGroup={setOpenMarkerGroup}
          activeMissionName={activeMissionName}
          selectedEntityId={selectedEntityId}
          mapServiceRef={mapServiceRef}
          dispatch={dispatch}
          sendMessage={sendMessage}
          setGroupVisibility={setGroupVisibility}
          deleteGroup={deleteGroup}
          onEditEntity={onEditEntity}
          onCenterToEntity={onCenterToEntity}
          onOpenCreateMarkerPanel={onOpenCreateMarkerPanel}
          editingEntityId={editingEntityId}
        />
      )}
    </div>
  );
};

export default EntitiesSidebar;
