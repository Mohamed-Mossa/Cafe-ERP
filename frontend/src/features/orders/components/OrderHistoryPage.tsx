import { useI18n } from '../../../i18n';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { baseApi } from '../../../app/baseApi';
import { formatCurrency } from '../../../utils/currency';

const ordersApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getOrderHistory: b.query<any, { from: string; to: string; source?: string }>({
      query: ({ from, to, source }) =>
        `/orders/history?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}${source ? `&source=${source}` : ''}`,
    }),
  }),
  overrideExisting: false,
});
const { useGetOrderHistoryQuery } = ordersApi;

const SOURCE_ICON: Record<string, string> = { TABLE: '🪑', GAMING: '🎮', TAKEAWAY: '🥡' };
const STATUS_STYLE: Record<string, string> = {
  CLOSED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-600',
  OPEN: 'bg-blue-100 text-blue-700',
};

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 16);
};
const todayEnd = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 0);
  return d.toISOString().slice(0, 16);
};

export default function OrderHistoryPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(todayEnd());
  const [source, setSource] = useState('');
  const [search, setSearch] = useState('');
  const [queryFrom, setQueryFrom] = useState(today());
  const [queryTo, setQueryTo] = useState(todayEnd());
  const [querySource, setQuerySource] = useState('');

  const { data, isLoading, isFetching } = useGetOrderHistoryQuery({
    from: queryFrom + ':00',
    to: queryTo + ':00',
    source: querySource || undefined,
  });

  const orders: any[] = (data?.data || []).filter((o: any) =>
    !search || String(o.orderNumber).includes(search) ||
    o.cashierName?.toLowerCase().includes(search.toLowerCase()) ||
    o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    o.tableName?.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = orders.reduce((s: number, o: any) => s + (o.grandTotal || 0), 0);

  const runQuery = () => { setQueryFrom(from); setQueryTo(to); setQuerySource(source); };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">📋 Order History</h1>
        <div className="text-sm text-slate-400">{orders.length} orders · {formatCurrency(totalRevenue)} total</div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-slate-500 block mb-1">From</label>
          <input type="datetime-local" value={from} onChange={e => setFrom(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">To</label>
          <input type="datetime-local" value={to} onChange={e => setTo(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">{t('orderHistory.source')}</label>
          <select value={source} onChange={e => setSource(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none bg-white focus:ring-2 focus:ring-blue-500">
            <option value="">{t('orderHistory.allSources')}</option>
            <option value="TABLE">🪑 Dine-In</option>
            <option value="TAKEAWAY">🥡 Takeaway</option>
            <option value="GAMING">🎮 Gaming</option>
          </select>
        </div>
        <button onClick={runQuery}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition">
          🔍 Search
        </button>
        <div className="flex-1 min-w-40">
          <label className="text-xs text-slate-500 block mb-1">{t('filter')}</label>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Order#, cashier, customer, table..."
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {isLoading || isFetching ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center"><div className="text-5xl mb-3">📋</div><div>{t('noData')}</div></div>
          </div>
        ) : (
          <div className="overflow-auto flex-1">
            <table className="w-full">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  {['Order #', 'Time', 'Source', 'Cashier', 'Customer', 'Items', 'Discount', 'Total', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o: any) => (
                  <tr key={o.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-bold text-slate-800">#{o.orderNumber}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {o.closedAt ? new Date(o.closedAt).toLocaleString('en-EG', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'}) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="flex items-center gap-1">
                        {SOURCE_ICON[o.source] || '•'} {o.tableName || o.deviceName || o.source}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{o.cashierName || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{o.customerName || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{o.lines?.length || 0}</td>
                    <td className="px-4 py-3 text-sm text-green-600">
                      {o.discountAmount > 0 ? `-${formatCurrency(o.discountAmount)}` : '—'}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800">{formatCurrency(o.grandTotal)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[o.status] || 'bg-slate-100 text-slate-500'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => window.open(`${window.location.pathname}#/receipt/${o.id}`, '_blank')}
                        className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition font-medium">
                        🧾 Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
