import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthResponse, Role } from '../../../types/api.types';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  username: string | null;
  fullName: string | null;
  role: Role | null;
  maxDiscountPercent: number;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  username: localStorage.getItem('username'),
  fullName: localStorage.getItem('fullName'),
  role: (localStorage.getItem('role') as Role) || null,
  maxDiscountPercent: Number(localStorage.getItem('maxDiscount') || 5),
  isAuthenticated: !!localStorage.getItem('accessToken'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<AuthResponse>) {
      const { accessToken, refreshToken, username, fullName, role, maxDiscountPercent } = action.payload;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.username = username;
      state.fullName = fullName;
      state.role = role;
      state.maxDiscountPercent = maxDiscountPercent;
      state.isAuthenticated = true;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('username', username);
      localStorage.setItem('fullName', fullName);
      localStorage.setItem('role', role);
      localStorage.setItem('maxDiscount', String(maxDiscountPercent));
    },
    logout(state) {
      state.accessToken = null;
      state.refreshToken = null;
      state.username = null;
      state.fullName = null;
      state.role = null;
      state.isAuthenticated = false;
      localStorage.clear();
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
