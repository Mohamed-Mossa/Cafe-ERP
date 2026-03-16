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
  // If a refresh is already in flight, wait for it to complete before sending this request
  // so it picks up the new access token via prepareHeaders → getState()
  if (isRefreshing && refreshPromise) {
    await refreshPromise;
  }

  let result = await baseQuery(args, api, extraOptions);

  // Only attempt refresh on 401 (Unauthorized / token expired).
  // 403 = Forbidden (wrong role) — refreshing won't change the role, so don't retry.
  if (result.error && result.error.status === 401) {
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
          const responseData = refreshResult.data as any;
          if (responseData.data && responseData.data.accessToken) {
            // Persist rotated tokens (backend now issues a new refresh token on every refresh)
            api.dispatch(setCredentials(responseData.data));
            // Retry the original request with the new access token
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
      // Another request already triggered a refresh; wait for it, then retry
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
