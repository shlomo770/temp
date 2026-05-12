import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type TabozoonState = {
    radiusMeters: number;
    angles: string[] | null;
};

const initialState: TabozoonState = {
    radiusMeters: 0,
    angles: null,
};

const slice = createSlice({
    name: "Tabozoon",
    initialState,
    reducers: {
        setTabozoonSector(
            state,
            action: PayloadAction<{
                radiusMeters: number ;
                minAngle: number | "";
                maxAngle: number | "";
            }>
        ) {
            state.radiusMeters = action.payload.radiusMeters;
            state.angles = [
                `${action.payload.minAngle}-${action.payload.maxAngle}`,
            ];
        },
        clearTabozoonSector(state) {
            state.angles = null;
        },
    },
});

export const { setTabozoonSector, clearTabozoonSector } = slice.actions;
export default slice.reducer;
