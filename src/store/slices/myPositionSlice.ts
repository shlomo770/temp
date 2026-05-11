import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MyPosition, Coordinates } from '../../types';

const initialState: MyPosition = {
  coordinates: {
    lng: 0,
    lat: 0,
    alt:0
  },
  heading: 0,
  gunAzimut: 0,
  los: {
    rangeKM: 0,
    angleDEG: 0,
  }
};

const myPositionSlice = createSlice({
  name: 'myPosition',
  initialState,
  reducers: {
    setMyPosition: (state, action: PayloadAction<MyPosition>) => {
      state.coordinates = action.payload.coordinates;
      state.heading = action.payload.heading;
      state.gunAzimut = action.payload.gunAzimut;
      state.los = action.payload.los;
    },

    updateMyPosition: (state, action: PayloadAction<MyPosition>) => {
      if (state.coordinates) {
        state.coordinates = action.payload.coordinates;
      }
    },

    updateMyCoordinates: (state, action: PayloadAction<Coordinates>) => {
      if (state.coordinates) {
        state.coordinates = action.payload;
      }
    },

    updateMyHeading: (state, action: PayloadAction<number>) => {
      if (state.heading) {
        state.heading = action.payload;
      }
    },

    clearMyPosition: (state) => {
      state.coordinates = {
        lng: 0,
        lat: 0
      };
    },

    setMyPositionActive: (_state, _action: PayloadAction<boolean>) => {

    }
  }
});

export const {
  setMyPosition,
  updateMyPosition,
  updateMyCoordinates,
  updateMyHeading,
  clearMyPosition,
  setMyPositionActive
} = myPositionSlice.actions;

export default myPositionSlice.reducer; 