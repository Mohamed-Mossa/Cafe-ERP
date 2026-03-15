import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from './store';
import { setCredentials, logout } from '../features/auth/store/authSlice';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

const baseQuery = fetchBaseQuery({
  baseUrl: '/api/v1',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  // Wait until the mutex is available without locking it
  if (isRefreshing && refreshPromise) {
    await refreshPromise;
  }

  let result = await baseQuery(args, api, extraOptions);

  if (result.error && (result.error.status === 401 || result.error.status === 403)) {
    if (!isRefreshing) {
      isRefreshing = true;
      const { auth } = api.getState() as RootState;
      const refreshToken = auth.refreshToken;

      if (refreshToken) {
        refreshPromise = Promise.resolve(baseQuery(
          {
            url: '/auth/refresh',
            method: 'POST',
            body: { refreshToken },
          },
          api,
          extraOptions
        ));

        const refreshResult = await refreshPromise;

        if (refreshResult && refreshResult.data) {
          // Assuming backend returns ApiResponse<AuthResponse> which has a 'data' property
          const responseData = refreshResult.data as any;
          if (responseData.data && responseData.data.accessToken) {
            api.dispatch(setCredentials(responseData.data));
            // Retry the initial query
            result = await baseQuery(args, api, extraOptions);
          } else {
            api.dispatch(logout());
          }
        } else {
          api.dispatch(logout());
        }
      } else {
        api.dispatch(logout());
      }
      isRefreshing = false;
      refreshPromise = null;
    } else {
      // wait for the current refresh to finish, then retry
      if (refreshPromise) {
        await refreshPromise;
        result = await baseQuery(args, api, extraOptions);
      }
    }
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Order', 'Product', 'Category', 'Session', 'Inventory', 'Shift', 'Promo', 'Customer', 'CRM', 'Gaming', 'Menu', 'Membership', 'Tournament', 'Expense', 'Settings', 'HappyHour', 'Supplier'],
  endpoints: () => ({}),
});
