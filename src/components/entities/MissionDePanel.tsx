import React, { FC, useMemo, useState, useEffect, useCallback } from "react";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { setPreviewEntityId } from "../../store/slices/entitiesSlice";
import type { Entity } from "../../store/slices/entitiesSlice";
import type { MissionDePanelProps, DisplayFilter } from "./missionDe/MissionDePanelTypes";
export type { MissionDePanelProps, DisplayFilter } from "./missionDe/MissionDePanelTypes";
import {
  buildMissionTreeBuckets,
  buildTableRows,
  creationCategoryForFilter,
  missionFilterLabel,
} from "./missionDe/missionDePanelModel";
import MissionDeNameSection from "./missionDe/MissionDeNameSection";
import MissionDeTreeSection from "./missionDe/MissionDeTreeSection";
import MissionDeSelectionSection from "./missionDe/MissionDeSelectionSection";
import MissionDeFooter from "./missionDe/MissionDeFooter";

const MissionDePanel: FC<MissionDePanelProps> = ({
  missionName,
  memberIds,
  allById,
  onMemberIdsChange,
  onSaveMissionServer,
  onOpenMissionSaveCopy,
  onMissionRename,
  onCreateNewInCategory,
  onOpenCreateMarkerPanel,
  onCenterToEntity,
  showFooter = true,
}) => {
  const dispatch = useAppDispatch();
  const [selectionOpen, setSelectionOpen] = useState(false);
  const [displayFilter, setDisplayFilter] = useState<DisplayFilter>("ALL");
  const [searchQ, setSearchQ] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [treeSelectedIds, setTreeSelectedIds] = useState<Set<string>>(new Set());
  const [editMissionName, setEditMissionName] = useState(missionName);

  useEffect(() => {
    setEditMissionName(missionName);
  }, [missionName]);

  useEffect(() => {
    const ms = new Set(memberIds);
    setTreeSelectedIds((prev) => {
      const n = new Set<string>();
      prev.forEach((id) => {
        if (ms.has(id)) n.add(id);
      });
      return n;
    });
  }, [memberIds]);

  useEffect(() => {
    if (!selectionOpen) dispatch(setPreviewEntityId(null));
  }, [selectionOpen, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(setPreviewEntityId(null));
    };
  }, [dispatch]);

  const memberSet = useMemo(() => new Set(memberIds), [memberIds]);

  const allEntities = useMemo(
    () => Object.values(allById).filter((e): e is Entity => Boolean(e)),
    [allById]
  );

  const missionTreeBuckets = useMemo(
    () => buildMissionTreeBuckets(memberIds, allById),
    [memberIds, allById]
  );

  const removeOneFromMission = useCallback(
    (id: string) => {
      onMemberIdsChange(memberIds.filter((x) => x !== id));
      setSelectedIds((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
      setTreeSelectedIds((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    },
    [memberIds, onMemberIdsChange]
  );

  const toggleTreeSelect = useCallback((id: string) => {
    setTreeSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }, []);

  const clearTreeSelection = useCallback(() => setTreeSelectedIds(new Set()), []);

  const deleteTreeSelectedFromMission = useCallback(() => {
    if (treeSelectedIds.size === 0) return;
    const drop = treeSelectedIds;
    onMemberIdsChange(memberIds.filter((id) => !drop.has(id)));
    setTreeSelectedIds(new Set());
  }, [treeSelectedIds, memberIds, onMemberIdsChange]);

  const tableRows = useMemo(
    () => buildTableRows(allEntities, displayFilter, searchQ),
    [allEntities, displayFilter, searchQ]
  );

  /** בחירה בטבלה — גם תצוגה במפה (preview) + מרכוז, כמו בסרגל ישויות */
  const handleSelectionTableToggle = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        const was = prev.has(id);
        if (was) next.delete(id);
        else next.add(id);

        const previewId = !was ? id : next.size > 0 ? [...next][0]! : null;
        queueMicrotask(() => {
          dispatch(setPreviewEntityId(previewId));
          if (!was) {
            const e = allById[id];
            if (e) onCenterToEntity(e);
          }
        });

        return next;
      });
    },
    [allById, dispatch, onCenterToEntity]
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    dispatch(setPreviewEntityId(null));
  }, [dispatch]);

  const selectAllInView = useCallback(() => {
    const ids = new Set(tableRows.map((e) => e.id));
    setSelectedIds(ids);
    const first = tableRows[0];
    if (first) {
      dispatch(setPreviewEntityId(first.id));
      onCenterToEntity(first);
    } else {
      dispatch(setPreviewEntityId(null));
    }
  }, [tableRows, dispatch, onCenterToEntity]);

  const addSelectedToMission = useCallback(() => {
    if (selectedIds.size === 0) return;
    const next = new Set(memberIds);
    selectedIds.forEach((id) => next.add(id));
    onMemberIdsChange(Array.from(next));
    setSelectedIds(new Set());
    dispatch(setPreviewEntityId(null));
  }, [selectedIds, memberIds, onMemberIdsChange, dispatch]);

  const removeSelectedFromMission = useCallback(() => {
    if (selectedIds.size === 0) return;
    const drop = selectedIds;
    onMemberIdsChange(memberIds.filter((id) => !drop.has(id)));
    setSelectedIds(new Set());
    dispatch(setPreviewEntityId(null));
  }, [selectedIds, memberIds, onMemberIdsChange, dispatch]);

  const canAdd = [...selectedIds].some((id) => !memberSet.has(id));
  const canRemove = [...selectedIds].some((id) => memberSet.has(id));

  const handleNewClick = useCallback(() => {
    if (displayFilter === "MARKERS") {
      onOpenCreateMarkerPanel?.();
      return;
    }
    onCreateNewInCategory(creationCategoryForFilter(displayFilter));
  }, [displayFilter, onCreateNewInCategory, onOpenCreateMarkerPanel]);

  const filterLabel = missionFilterLabel(displayFilter);
  const otherCount = missionTreeBuckets.OTHER?.length ?? 0;

  const commitMissionRename = useCallback(async () => {
    const t = editMissionName.trim();
    if (!t) {
      setEditMissionName(missionName);
      return;
    }
    if (t === missionName) return;
    const ok = await onMissionRename(missionName, t);
    if (!ok) setEditMissionName(missionName);
  }, [editMissionName, missionName, onMissionRename]);

  return (
    <div className="flex flex-col gap-3">
      <MissionDeNameSection
        editMissionName={editMissionName}
        onEditChange={setEditMissionName}
        onCommitRename={commitMissionRename}
        onEnterBlur={(el) => el.blur()}
      />

      <MissionDeTreeSection
        memberIds={memberIds}
        missionTreeBuckets={missionTreeBuckets}
        otherCount={otherCount}
        treeSelectedIds={treeSelectedIds}
        onToggleTreeSelect={toggleTreeSelect}
        onClearTreeSelection={clearTreeSelection}
        onDeleteTreeSelected={deleteTreeSelectedFromMission}
        onRemoveOne={removeOneFromMission}
        onCenterToEntity={onCenterToEntity}
      />

      <MissionDeSelectionSection
        selectionOpen={selectionOpen}
        onToggleSelectionOpen={() => setSelectionOpen((v) => !v)}
        displayFilter={displayFilter}
        onDisplayFilterChange={setDisplayFilter}
        searchQ={searchQ}
        onSearchQChange={setSearchQ}
        onNewClick={handleNewClick}
        canAdd={canAdd}
        canRemove={canRemove}
        onAddSelected={addSelectedToMission}
        onRemoveSelected={removeSelectedFromMission}
        onSelectAllInView={selectAllInView}
        onClearSelection={clearSelection}
        selectedCount={selectedIds.size}
        filterLabel={filterLabel}
        tableRows={tableRows}
        memberSet={memberSet}
        selectedIds={selectedIds}
        onToggleSelect={handleSelectionTableToggle}
        onCenterToEntity={onCenterToEntity}
      />

      {showFooter ? (
        <MissionDeFooter
          onSaveMissionServer={onSaveMissionServer}
          onOpenMissionSaveCopy={onOpenMissionSaveCopy}
        />
      ) : null}
    </div>
  );
};

export default MissionDePanel;
