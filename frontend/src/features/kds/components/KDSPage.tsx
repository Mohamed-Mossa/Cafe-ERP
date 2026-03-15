import { useI18n } from '../../../i18n';
import { useState } from 'react';
import { baseApi } from '../../../app/baseApi';
import { Order, ApiResponse } from '../../../types/api.types';
import { formatCurrency } from '../../../utils/currency';

const kdsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getKitchenOrders: b.query<ApiResponse<Order[]>, void>({
      query: () => '/kds/orders', providesTags: ['Order'],
    }),
    updateLineStatus: b.mutation<any, { lineId: string; status: string }>({
      query: ({ lineId, status }) => ({ url: `/kds/lines/${lineId}/status`, method: 'PATCH', body: { status } }),
      invalidatesTags: ['Order'],
    }),
    updateOrderStatus: b.mutation<any, { orderId: string; status: string }>({
      query: ({ orderId, status }) => ({ url: `/kds/orders/${orderId}/status`, method: 'PATCH', body: { status } }),
      invalidatesTags: ['Order'],
    }),
  }),
  overrideExisting: false,
});
const { useGetKitchenOrdersQuery, useUpdateLineStatusMutation, useUpdateOrderStatusMutation } = kdsApi;

const STATUS_META = {
  NEW:       { label: 'New',       color: 'bg-blue-100 text-blue-700 border-blue-200',    icon: '🆕' },
  PREPARING: { label: 'Preparing', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: '👨‍🍳' },
  READY:     { label: 'Ready',     color: 'bg-green-100 text-green-700 border-green-200',  icon: '✅' },
  SERVED:    { label: 'Served',    color: 'bg-slate-100 text-slate-400 border-slate-200',  icon: '🍽️' },
};

const NEXT_STATUS: Record<string, string> = { NEW: 'PREPARING', PREPARING: 'READY', READY: 'SERVED' };

export default function KDSPage() {
  const { t, isRTL } = useI18n();
  const { data, isLoading } = useGetKitchenOrdersQuery(undefined, { pollingInterval: 5000 });
  const [updateLine] = useUpdateLineStatusMutation();
  const [updateOrder] = useUpdateOrderStatusMutation();
  const [filter, setFilter] = useState<string>('ALL');

  const orders = (data?.data || []).filter(o => o.lines.length > 0);
  const filtered = filter === 'ALL' ? orders
    : orders.filter(o => o.lines.some(l => (l as any).kitchenStatus === filter));

  if (isLoading) return <div className="flex items-center justify-center h-full text-slate-400">Loading...</div>;

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">👨‍🍳 Kitchen Display</h1>
        <div className="flex gap-2">
          {['ALL', ...Object.keys(STATUS_META)].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition ${filter === s ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:bg-slate-100'}`}>
              {s === 'ALL' ? 'All' : STATUS_META[s as keyof typeof STATUS_META].icon + ' ' + STATUS_META[s as keyof typeof STATUS_META].label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-300">
          <div className="text-center">
            <div className="text-6xl mb-4">👨‍🍳</div>
            <div className="text-lg font-medium">No orders in kitchen</div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-4 content-start">
          {filtered.map(order => {
            const allReady = order.lines.every(l => (l as any).kitchenStatus === 'READY' || (l as any).kitchenStatus === 'SERVED');
            const allServed = order.lines.every(l => (l as any).kitchenStatus === 'SERVED');
            return (
              <div key={order.id} className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden ${allReady && !allServed ? 'border-green-400' : 'border-slate-100'}`}>
                {/* Order header */}
                <div className={`p-3 flex items-center justify-between ${allReady && !allServed ? 'bg-green-50' : 'bg-slate-50'}`}>
                  <div>
                    <div className="font-black text-slate-800">#{order.orderNumber}</div>
                    <div className="text-xs text-slate-400">
                      {order.source === 'TABLE' ? `🪑 ${order.tableName}` :
                       order.source === 'GAMING' ? `🎮 ${order.deviceName}` : '🥡 Takeaway'}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-slate-400">{order.lines.length} items</span>
                    {!allServed && (
                      <button
                        onClick={() => updateOrder({ orderId: order.id, status: allReady ? 'SERVED' : 'PREPARING' })}
                        className={`text-xs px-2 py-1 rounded-lg font-bold transition ${
                          allReady ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-amber-500 text-white hover:bg-amber-600'
                        }`}>
                        {allReady ? '✓ All Served' : '👨‍🍳 All Prep'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Lines */}
                <div className="p-2 space-y-2">
                  {order.lines.map(line => {
                    const ks = (line as any).kitchenStatus || 'NEW';
                    const meta = STATUS_META[ks as keyof typeof STATUS_META];
                    const next = NEXT_STATUS[ks];
                    return (
                      <div key={line.id} className={`flex items-center gap-2 p-2 rounded-xl border ${meta.color}`}>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">{line.productName}</div>
                          {line.notes && <div className="text-xs italic opacity-70 truncate">{line.notes}</div>}
                          <div className="text-xs opacity-60">× {line.quantity}</div>
                        </div>
                        <div className="text-sm">{meta.icon}</div>
                        {next && (
                          <button
                            onClick={() => updateLine({ lineId: line.id, status: next })}
                            className="text-xs px-2 py-1 bg-white/60 hover:bg-white rounded-lg font-bold transition whitespace-nowrap">
                            → {STATUS_META[next as keyof typeof STATUS_META]?.label}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
