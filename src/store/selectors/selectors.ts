import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Base selectors
const selectEntitiesState = (state: RootState) => state.entities;
const selectMapState = (state: RootState) => state.map;
const selectFilterState = (state: RootState) => state.filter;
const selectSettingsState = (state: RootState) => state.settings;

// Memoized entity selectors
export const selectEntitiesById = createSelector(
  [selectEntitiesState],
  (entitiesState) => entitiesState.byId
);

export const selectEntitiesArray = createSelector(
  [selectEntitiesById],
  (byId) => Object.values(byId || {})
);

export const selectDrawingMode = createSelector(
  [selectEntitiesState],
  (entitiesState) => entitiesState.drawingMode
);

// Memoized entity changes for optimized updates
export const selectEntityIds = createSelector(
  [selectEntitiesById],
  (byId) => new Set(Object.keys(byId || {}))
);

// Memoized map selectors
export const selectMapRotation = createSelector(
  [selectMapState],
  (mapState) => mapState.rotation
);

export const selectMapBrightness = createSelector(
  [selectMapState],
  (mapState) => mapState.brightness
);

export const selectSelectedMapType = createSelector(
  [selectMapState],
  (mapState) => mapState.selectedMapType
);

export const selectMapCenter = createSelector(
  [selectMapState],
  (mapState) => mapState.center
);

export const selectMapZoom = createSelector(
  [selectMapState],
  (mapState) => mapState.zoom
);

// // Memoized target selectors
// export const selectTargetsArray = createSelector(
//   [selectTargetsState],
//   (targetsState) => targetsState.items || []
// );

// export const selectAllTargets = createSelector(
//   [selectTargetsArray],
//   (targets) => targets
// );

// export const selectServerTargets = createSelector(
//   [selectTargetsArray],
//   (targets) => targets.filter((target: { isTestTarget: any; }) => !target.isTestTarget)
// );

// Memoized filter selectors
export const selectIsFilterPanelOpen = createSelector(
  [selectFilterState],
  (filterState) => filterState.isFilterPanelOpen
);

export const selectCategoryFilters = createSelector(
  [selectFilterState],
  (filterState) => filterState.categories
);

export const selectTargetFilters = createSelector(
  [selectFilterState],
  (filterState) => filterState.targets
);

// Memoized settings selectors
export const selectCategoryVisuals = createSelector(
  [selectSettingsState],
  (settingsState) => settingsState.categoryVisuals
);

// Complex derived selectors
export const selectEntitiesForMapUpdate = createSelector(
  [selectEntitiesById, selectEntityIds],
  (byId, entityIds) => ({
    byId,
    entityIds,
    timestamp: Date.now() // For change detection
  })
);

// Memoized selector for my position
export const selectMyPosition = createSelector(
  (state: RootState) => state.myPosition.coordinates,
  (position) => position
);

// Memoized selector for coordinates settings
export const selectIsUTM = createSelector(
  (state: RootState) => state.coordinates.isUTM,
  (isUTM) => isUTM
);

export const selectUtmZone = createSelector(
  (state: RootState) => state.coordinates.utmZone,
  (utmZone) => utmZone
);

// Memoized selector for elevation data
export const selectElevationData = createSelector(
  (state: RootState) => state.elevation,
  (elevation) => elevation
);

// Memoized selector for radar state
export const selectRadarState = createSelector(
  (state: RootState) => state.radar,
  (radar) => radar
);

// Memoized selector for gun state
export const selectGunState = createSelector(
  (state: RootState) => state.gun,
  (gun) => gun
);

// Memoized selector for auth mode
// export const selectAuthMode = createSelector(
//   (state: RootState) => state.auth.mode,
//   (mode) => mode
// );

// Selector for entities grouped by category (useful for filtering)
export const selectEntitiesByCategory = createSelector(
  [selectEntitiesArray],
  (entities) => {
    const grouped: { [key: string]: typeof entities } = {};
    entities.forEach(entity => {
      const category = entity.properties?.category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(entity);
    });
    return grouped;
  }
);

// Selector for visible entities based on filters
export const selectVisibleEntities = createSelector(
  [selectEntitiesArray, selectCategoryFilters],
  (entities, categoryFilters) => {
    const activeCategories = new Set(
      Object.entries(categoryFilters)
        .filter(([_, visible]) => visible)
        .map(([category, _]) => category)
    );
    
    return entities.filter(entity => {
      const category = entity.properties?.category || 'Other';
      return activeCategories.has(category);
    });
  }
);

// Memoized selector for entity changes (optimized for MapContainer)
// export const selectEntityChanges = createSelector(
//   [selectEntitiesById],
//   (byId, prevById = {}) => {
//     const safeById = byId || {};
//     const safePrevById = prevById || {};
//     const currentIds = new Set(Object.keys(safeById));
//     const prevIds = new Set(Object.keys(safePrevById));
    
//     const added = Array.from(currentIds).filter(id => !prevIds.has(id));
//     const removed = Array.from(prevIds).filter(id => !currentIds.has(id));
//     const updated = Array.from(currentIds).filter(id => 
//       prevIds.has(id) && safeById[id] !== safePrevById[id]
//     );
    
//     return {
//       added: added.map(id => safeById[id]),
//       removed,
//       updated: updated.map(id => safeById[id]),
//       hasChanges: added.length > 0 || removed.length > 0 || updated.length > 0
//     };
//   }
// );

// Performance-optimized selector for map operations
export const selectMapOperationData = createSelector(
  [
    selectMapRotation,
    selectMapBrightness,
    selectSelectedMapType,
    selectDrawingMode
  ],
  (rotation, brightness, selectedMapType, drawingMode) => ({
    rotation,
    brightness,
    selectedMapType,
    drawingMode
  })
);
