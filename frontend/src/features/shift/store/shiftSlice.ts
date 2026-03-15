import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ShiftState { shiftId: string | null; isShiftOpen: boolean; openedAt: string | null; cashierId: string | null; }

const shiftSlice = createSlice({
  name: 'shift',
  initialState: { shiftId: null, isShiftOpen: false, openedAt: null, cashierId: null } as ShiftState,
  reducers: {
    openShift(state, action: PayloadAction<{ shiftId: string; cashierId: string; openedAt: string }>) {
      state.shiftId = action.payload.shiftId;
      state.isShiftOpen = true;
      state.openedAt = action.payload.openedAt;
      state.cashierId = action.payload.cashierId;
    },
    closeShift(state) {
      state.shiftId = null; state.isShiftOpen = false; state.openedAt = null; state.cashierId = null;
    },
  },
});
export const { openShift, closeShift } = shiftSlice.actions;
export default shiftSlice.reducer;
