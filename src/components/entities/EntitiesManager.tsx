import React, { useState, FC } from 'react';
import { Entity } from '../../store/slices/entitiesSlice';
import { useAppSelector } from '../../hooks/useAppSelector';
import { handleCenterToEntity } from '../../utils/general';
import EntitiesButton from './EntitiesButton';
import EntitiesSidebar from './EntitiesSidebar';
import EntityEditPanel from './EntityEditPanel';
import EntityCreationPanel from './EntityCreationPanel';
import EntityMarkerCreationPanel from './EntityMarkerCreationPanel';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { setCreationForm } from '../../store/slices/entitiesSlice';
import { EntityCategoryEnum } from '../../enums/entitis.enum';

interface EntitiesManagerProps {
  map: maplibregl.Map;
  mapServiceRef?: React.MutableRefObject<any>;
}

const EntitiesManager: FC<EntitiesManagerProps> = ({ map, mapServiceRef }) => {
  const dispatch = useAppDispatch();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [isCreationPanelOpen, setIsCreationPanelOpen] = useState(false);
  const [isMarkerCreationOpen, setIsMarkerCreationOpen] = useState(false);
  const [editingEntityId, setEditingEntityId] = useState<string | null>(null);
  const entities = useAppSelector(state => state.entities.byId);
  const editingEntity = editingEntityId ? entities[editingEntityId] : null;

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleEditEntity = (entity: Entity) => {
    setEditingEntityId(entity.id);
    setIsEditPanelOpen(true);
    setIsCreationPanelOpen(false);
    setIsMarkerCreationOpen(false);
  };

  const handleCloseEditPanel = () => {
    setIsEditPanelOpen(false);
    setEditingEntityId(null);
  };

  const handleOpenAreas = () => {
    setIsCreationPanelOpen(true);
    setIsMarkerCreationOpen(false);
  };

  const handleOpenMarkers = () => {
    setIsMarkerCreationOpen(true);
    setIsCreationPanelOpen(false);
  };

  const handleOpenCreateWithCategory = (category: EntityCategoryEnum) => {
    dispatch(setCreationForm({ name: '', category, height: 0 }));
    setIsCreationPanelOpen(true);
    setIsMarkerCreationOpen(false);
    setIsEditPanelOpen(false);
    setEditingEntityId(null);
  };

  const clickToHandleCenterToEntity = (entity: Entity) => {
    handleCenterToEntity(entity, map);
  };

  return (
    <>
      <EntitiesButton onToggleSidebar={handleToggleSidebar} />
      <EntitiesSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onEditEntity={handleEditEntity}
        onCenterToEntity={clickToHandleCenterToEntity}
        onOpenCreatePanel={handleOpenAreas}
        onOpenCreatePanelWithCategory={handleOpenCreateWithCategory}
        onRequestCloseEditPanel={handleCloseEditPanel}
        onOpenCreateMarkerPanel={handleOpenMarkers}
        editingEntityId={isEditPanelOpen ? editingEntityId : null}
        mapServiceRef={mapServiceRef} />
      <EntityEditPanel
        entity={editingEntity}
        isOpen={isEditPanelOpen}
        onClose={handleCloseEditPanel}
        onCenterToEntity={clickToHandleCenterToEntity}
        mapServiceRef={mapServiceRef} />
      {isCreationPanelOpen && (
        <EntityCreationPanel
          isOpen={isCreationPanelOpen}
          onClose={() => setIsCreationPanelOpen(false)}
        />
      )}
      {isMarkerCreationOpen && (
        <EntityMarkerCreationPanel
          isOpen={isMarkerCreationOpen}
          onClose={() => setIsMarkerCreationOpen(false)}
        />
      )}
    </>
  );
};

export default EntitiesManager; 
