import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/store/authSlice';
import posReducer from '../features/pos/store/posSlice';
import floorReducer from '../features/floor/store/floorSlice';
import shiftReducer from '../features/shift/store/shiftSlice';
import uiReducer from '../features/ui/uiSlice';
import { baseApi } from './baseApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    pos: posReducer,
    floor: floorReducer,
    shift: shiftReducer,
    ui: uiReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefault) => getDefault().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
