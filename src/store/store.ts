import { configureStore } from '@reduxjs/toolkit';
import entitiesReducer from './slices/entitiesSlice';
import mapReducer from './slices/mapSlice';
import filterReducer from './slices/filterSlice';
import targetsReducer from './slices/targetsSlice';
import radarReducer from './slices/radarSlice';
import gunReducer from './slices/gunSlice';
import insReducer from './slices/insSlice';
import myPositionReducer from './slices/myPositionSlice';
import coordinatesReducer from './slices/coordinatesSlice';
import losReducer from './slices/losSlice';
import settingsReducer from './slices/settingsSlice';
import elevationReducer from './slices/elevationSlice';
import systemStateSlice from './slices/systemSlice';
import faultsReducer from "./slices/faultsSlice";
import confirmReducer from "./slices/confirmSlice";
import tabozoonReducer from "./slices/TabozoonSlice";
import wsInboundReducer from "./slices/wsInboundSlice";


export const store = configureStore({
  reducer: {
    entities: entitiesReducer,
    map: mapReducer,
    filter: filterReducer,
    targets: targetsReducer,
    radar: radarReducer,
    gun: gunReducer,
    ins: insReducer,
    myPosition: myPositionReducer,
    coordinates: coordinatesReducer,
    los: losReducer,
    settings: settingsReducer,
    elevation: elevationReducer,
    systemState: systemStateSlice,
    faults: faultsReducer,
    confirm: confirmReducer,
    tabozoon: tabozoonReducer,
    wsInbound: wsInboundReducer,
  }
});


export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 