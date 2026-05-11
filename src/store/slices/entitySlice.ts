import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { nanoid } from 'nanoid';
import { Entity, EntityState, EntityType, Coordinates } from '../../types';
import type { RootState } from '../store';

const initialState: EntityState = {
  byId: {},
  allIds: [],
  groupedByType: {
    polygon: [],
    line: [],
    rectangle: [],
    circle: [],
    marker: [],
    target: [],
    ellipse: [],
    measure: [],
    sector: []
  },
  selectedEntityId: null,
  drawingMode: null
};

const entitySlice = createSlice({
  name: 'entities',
  initialState,
  reducers: {
    addEntity: (state, action: PayloadAction<any>) => {
      const id = nanoid();
      const entity: Entity = {
        ...action.payload,
        id,
        properties: action.payload.properties || {},
        style: action.payload.style || {
          fillColor: '#3b82f6',
          strokeColor: '#1e40af',
          strokeWidth: 2,
          fillOpacity: 0.3,
          strokeOpacity: 1
        }
      };
      state.byId[id] = entity;
      state.allIds.push(id);
      if (!state.groupedByType[entity.type]) {
        state.groupedByType[entity.type] = [];
      }
      state.groupedByType[entity.type].push(id);
    },

    updateEntity: (state, action: PayloadAction<{ id: string; updates: Partial<Entity> }>) => {
      const { id, updates } = action.payload;
      if (state.byId[id]) {
        state.byId[id] = { ...state.byId[id], ...updates };
      }
    },

    updateEntityCoordinates: (state, action: PayloadAction<{ id: string; coordinates: Coordinates[] }>) => {
      const { id, coordinates } = action.payload;
      if (state.byId[id]) {
        state.byId[id].coordinates = coordinates;
      }
    },

    deleteEntity: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const entity = state.byId[id];

      if (entity) {
        delete state.byId[id];
        state.allIds = state.allIds.filter(entityId => entityId !== id);
        state.groupedByType[entity.type] = state.groupedByType[entity.type].filter(entityId => entityId !== id);

        if (state.selectedEntityId === id) {
          state.selectedEntityId = null;
        }
      }
    },

    selectEntity: (state, action: PayloadAction<string | null>) => {
      state.selectedEntityId = action.payload;
    },

    setDrawingMode: (state, action: PayloadAction<EntityType | null>) => {
      state.drawingMode = action.payload;
    },

    clearAllEntities: (state) => {
      state.byId = {};
      state.allIds = [];
      state.groupedByType = {
        polygon: [],
        line: [],
        rectangle: [],
        circle: [],
        marker: [],
        target: [],
        ellipse: [],
        measure: [],
        sector: []
      };
      state.selectedEntityId = null;
      state.drawingMode = null;
    }
  }
});

export const {
  addEntity,
  updateEntity,
  updateEntityCoordinates,
  deleteEntity,
  selectEntity,
  setDrawingMode,
  clearAllEntities
} = entitySlice.actions;

// Memoized selector for entities as array
export const selectEntitiesArray = createSelector(
  (state: RootState) => state.entities.byId,
  byId => Object.values(byId)
);

export default entitySlice.reducer; 