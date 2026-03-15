import { baseApi } from '../../../app/baseApi';
import { AuthResponse, ApiResponse } from '../../../types/api.types';

interface LoginRequest { username: string; password: string; }
interface RefreshRequest { refreshToken: string; }

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<ApiResponse<AuthResponse>, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
    refreshToken: build.mutation<ApiResponse<AuthResponse>, RefreshRequest>({
      query: (body) => ({ url: '/auth/refresh', method: 'POST', body }),
    }),
  }),
});

export const { useLoginMutation, useLogoutMutation } = authApi;
