import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Order, OrderLine, OrderSource } from '../../../types/api.types';

interface PosState {
  currentOrder: Order | null;
  selectedSource: OrderSource;
  selectedTableId: string | null;
  selectedTableName: string | null;
  selectedDeviceId: string | null;
  openOrders: Order[];
  isLoading: boolean;
}

const initialState: PosState = {
  currentOrder: null,
  selectedSource: 'TABLE',
  selectedTableId: null,
  selectedTableName: null,
  selectedDeviceId: null,
  openOrders: [],
  isLoading: false,
};

const posSlice = createSlice({
  name: 'pos',
  initialState,
  reducers: {
    setCurrentOrder(state, action: PayloadAction<Order>) {
      state.currentOrder = action.payload;
    },
    clearCurrentOrder(state) {
      state.currentOrder = null;
      state.selectedTableId = null;
      state.selectedTableName = null;
      state.selectedDeviceId = null;
    },
    setSource(state, action: PayloadAction<OrderSource>) {
      state.selectedSource = action.payload;
    },
    setSelectedTable(state, action: PayloadAction<{ id: string; name: string }>) {
      state.selectedTableId = action.payload.id;
      state.selectedTableName = action.payload.name;
    },
    setOpenOrders(state, action: PayloadAction<Order[]>) {
      state.openOrders = action.payload;
    },
    updateOrderFromSocket(state, action: PayloadAction<Order>) {
      const updated = action.payload;
      const idx = state.openOrders.findIndex((o) => o.id === updated.id);
      if (idx !== -1) state.openOrders[idx] = updated;
      if (state.currentOrder?.id === updated.id) state.currentOrder = updated;
    },
  },
});

export const { setCurrentOrder, clearCurrentOrder, setSource, setSelectedTable, setOpenOrders, updateOrderFromSocket } = posSlice.actions;
export default posSlice.reducer;
