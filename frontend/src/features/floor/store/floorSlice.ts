import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CafeTable, Device } from '../../../types/api.types';

interface FloorState { tables: CafeTable[]; devices: Device[]; }

const floorSlice = createSlice({
  name: 'floor',
  initialState: { tables: [], devices: [] } as FloorState,
  reducers: {
    setTables(state, action: PayloadAction<CafeTable[]>) { state.tables = action.payload; },
    setDevices(state, action: PayloadAction<Device[]>) { state.devices = action.payload; },
    updateTable(state, action: PayloadAction<CafeTable>) {
      const idx = state.tables.findIndex((t) => t.id === action.payload.id);
      if (idx !== -1) state.tables[idx] = action.payload;
    },
    updateDevice(state, action: PayloadAction<Device>) {
      const idx = state.devices.findIndex((d) => d.id === action.payload.id);
      if (idx !== -1) state.devices[idx] = action.payload;
    },
  },
});
export const { setTables, setDevices, updateTable, updateDevice } = floorSlice.actions;
export default floorSlice.reducer;
