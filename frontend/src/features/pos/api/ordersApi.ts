import { baseApi } from '../../../app/baseApi';
import { Order, ApiResponse } from '../../../types/api.types';

interface CreateOrderReq { source: string; tableId?: string; tableName?: string; deviceId?: string; customerId?: string; }
interface AddLineReq { productId: string; quantity: number; notes?: string; }
interface PaymentEntry { method: string; amount: number; reference?: string; }
interface ProcessPaymentReq { payments: PaymentEntry[]; }
interface ApplyDiscountReq { discountPercent: number; }
interface ApplyPromoReq { promoCode: string; }

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getOpenOrders: build.query<ApiResponse<Order[]>, void>({
      query: () => '/orders/open', providesTags: ['Order'],
    }),
    getOrder: build.query<ApiResponse<Order>, string>({
      query: (id) => `/orders/${id}`, providesTags: (_, __, id) => [{ type: 'Order', id }],
    }),
    createOrder: build.mutation<ApiResponse<Order>, CreateOrderReq>({
      query: (body) => ({ url: '/orders', method: 'POST', body }), invalidatesTags: ['Order'],
    }),
    addLine: build.mutation<ApiResponse<Order>, { orderId: string } & AddLineReq>({
      query: ({ orderId, ...body }) => ({ url: `/orders/${orderId}/lines`, method: 'POST', body }),
      invalidatesTags: ['Order'],
    }),
    removeLine: build.mutation<ApiResponse<Order>, { orderId: string; lineId: string }>({
      query: ({ orderId, lineId }) => ({ url: `/orders/${orderId}/lines/${lineId}`, method: 'DELETE' }),
      invalidatesTags: ['Order'],
    }),
    applyDiscount: build.mutation<ApiResponse<Order>, { orderId: string } & ApplyDiscountReq>({
      query: ({ orderId, ...body }) => ({ url: `/orders/${orderId}/discount`, method: 'POST', body }),
      invalidatesTags: ['Order'],
    }),
    applyPromo: build.mutation<ApiResponse<Order>, { orderId: string } & ApplyPromoReq>({
      query: ({ orderId, ...body }) => ({ url: `/orders/${orderId}/promo`, method: 'POST', body }),
      invalidatesTags: ['Order'],
    }),
    processPayment: build.mutation<ApiResponse<Order>, { orderId: string } & ProcessPaymentReq>({
      query: ({ orderId, ...body }) => ({ url: `/orders/${orderId}/pay`, method: 'POST', body }),
      invalidatesTags: ['Order'],
    }),
    cancelOrder: build.mutation<ApiResponse<void>, { orderId: string; reason?: string }>({
      query: ({ orderId, reason }) => ({ url: `/orders/${orderId}/cancel`, method: 'POST', body: { reason } }),
      invalidatesTags: ['Order'],
    }),
    transferOrder: build.mutation<ApiResponse<Order>, { orderId: string; tableId: string; tableName: string }>({
      query: ({ orderId, ...body }) => ({ url: `/orders/${orderId}/transfer`, method: 'POST', body }),
      invalidatesTags: ['Order'],
    }),
    attachCustomer: build.mutation<ApiResponse<Order>, { orderId: string; customerId: string; customerName: string }>({
      query: ({ orderId, ...body }) => ({ url: `/orders/${orderId}/customer`, method: 'POST', body }),
      invalidatesTags: ['Order'],
    }),
    getReceipt: build.query<ApiResponse<Order>, string>({
      query: (id) => `/orders/${id}/receipt`,
    }),
    updateLineNotes: build.mutation<ApiResponse<Order>, { orderId: string; lineId: string; notes: string }>({
      query: ({ orderId, lineId, notes }) => ({
        url: `/orders/${orderId}/lines/${lineId}`,
        method: 'PATCH',
        body: { notes },
      }),
    }),
    updateLineQty: build.mutation<ApiResponse<Order>, { orderId: string; lineId: string; quantity: number }>({
      query: ({ orderId, lineId, quantity }) => ({
        url: `/orders/${orderId}/lines/${lineId}`,
        method: 'PATCH',
        body: { quantity },
      }),
      invalidatesTags: ['Order'],
    }),
  }),
});

export const {
  useGetOpenOrdersQuery, useGetOrderQuery, useCreateOrderMutation,
  useAddLineMutation, useRemoveLineMutation, useApplyDiscountMutation,
  useApplyPromoMutation, useProcessPaymentMutation, useCancelOrderMutation,
  useTransferOrderMutation, useAttachCustomerMutation, useGetReceiptQuery, useUpdateLineNotesMutation,
  useUpdateLineQtyMutation,
} = ordersApi;
