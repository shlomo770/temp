import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MyPosition, Coordinates } from '../../types';
import { CaliModeE } from '../../enums/general.enum';

const initialState: MyPosition = {
  coordinates: {
    lng: 0,
    lat: 0,
    alt: 0
  },
  heading: 0,
  gps_pos: {
    lat: 0,
    lng: 0,
    alt: 0
  },
  tmaps_pos: {
    lat: 0,
    lng: 0,
    alt: 0
  },
  manual_pos: {
    lat: 0,
    lng: 0,
    alt: 0,
    heading: 0
  },
  use_gps: false,
  use_manual: false,
  zone: 0,
  fig_of_merit: 0,
  pitch: 0,
  roll: 0,
  distance_travelled: 0,
  odo_cali_finished: CaliModeE.NA,
  clickCord: { lat: 0, lng: 0 },
  gunAzimut: 0
};

const myPositionSlice = createSlice({
  name: 'myPosition',
  initialState,
  reducers: {
    setMyPosition: (state, action: PayloadAction<MyPosition>) => {
      state.coordinates = action.payload.coordinates;
      state.heading = action.payload.heading;
      state.gps_pos = action.payload.gps_pos;
      state.manual_pos = action.payload.manual_pos;
      state.tmaps_pos = action.payload.tmaps_pos;
      state.use_gps = action.payload.use_gps;
      state.use_manual = action.payload.use_manual;
      state.zone = action.payload.zone;
      state.fig_of_merit = action.payload.fig_of_merit;
      state.pitch = action.payload.pitch;
      state.roll = action.payload.roll;
      state.distance_travelled = action.payload.distance_travelled;
    },

    updateMyPosition: (state, action: PayloadAction<MyPosition>) => {
      if (state.coordinates) {
        state.coordinates = action.payload.coordinates;
      }
    },

    updateGunAzimut: (state, action: PayloadAction<{ sight_azimuth: number }>) => {
        state.gunAzimut = action.payload.sight_azimuth;
    },

    updateClickCord: (state, action: PayloadAction<{ lat: number, lng: number }>) => {
      if (state.clickCord) {
        state.clickCord = action.payload;
      }
    },

    updateMyCoordinates: (state, action: PayloadAction<Coordinates>) => {
      if (state.coordinates) {
        state.coordinates = action.payload;
      }
    },

    updateMyCali: (state, action: PayloadAction<CaliModeE>) => {
      state.odo_cali_finished = action.payload;
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


  }
});

export const {
  setMyPosition,
  updateMyPosition,
  updateMyCoordinates,
  updateClickCord,
  updateMyHeading,
  clearMyPosition,
  updateGunAzimut,
  updateMyCali
} = myPositionSlice.actions;

export default myPositionSlice.reducer; 