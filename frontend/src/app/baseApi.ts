import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from './store';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Order', 'Product', 'Category', 'Session', 'Inventory', 'Shift', 'Promo', 'Customer', 'CRM', 'Gaming', 'Menu', 'Membership', 'Tournament', 'Expense', 'Settings', 'HappyHour', 'Supplier'],
  endpoints: () => ({}),
});
