import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Toast { id: string; message: string; type: 'success' | 'error' | 'info' | 'warning'; }
interface UiState { toasts: Toast[]; globalLoading: boolean; }

const uiSlice = createSlice({
  name: 'ui',
  initialState: { toasts: [], globalLoading: false } as UiState,
  reducers: {
    pushToast(state, action: PayloadAction<Omit<Toast, 'id'>>) {
      state.toasts.push({ ...action.payload, id: Date.now().toString() });
    },
    removeToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.globalLoading = action.payload;
    },
  },
});
export const { pushToast, removeToast, setLoading } = uiSlice.actions;
export default uiSlice.reducer;
