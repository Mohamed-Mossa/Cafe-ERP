import { useI18n } from '../../../i18n';
import { baseApi } from '../../../app/baseApi';
import { formatCurrency } from '../../../utils/currency';

const forecastApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getStockForecast: b.query<any, void>({ query: () => '/inventory/forecast', providesTags: ['Inventory'] }),
  }),
  overrideExisting: false,
});
const { useGetStockForecastQuery } = forecastApi;

function DaysBar({ days }: { days: number | null }) {
  if (days === null) return <span className="text-xs text-slate-300">No usage data</span>;
  const color = days <= 3 ? 'bg-red-500' : days <= 7 ? 'bg-orange-400' : days <= 14 ? 'bg-yellow-400' : 'bg-green-500';
  const width = Math.min(100, (days / 30) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-100 rounded-full h-2 min-w-16">
        <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${width}%` }} />
      </div>
      <span className={`text-xs font-bold w-14 text-right ${days <= 3 ? 'text-red-600' : days <= 7 ? 'text-orange-500' : days <= 14 ? 'text-yellow-600' : 'text-green-700'}`}>
        {days === 0 ? 'OUT' : `~${days}d`}
      </span>
    </div>
  );
}

function UrgencyBadge({ days }: { days: number | null }) {
  if (days === null) return null;
  if (days === 0) return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">OUT OF STOCK</span>;
  if (days <= 3) return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">🚨 Critical</span>;
  if (days <= 7) return <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">⚠️ Low</span>;
  if (days <= 14) return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">📉 Watch</span>;
  return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">✓ OK</span>;
}

export default function StockForecastPage() {
  const { data, isLoading, refetch } = useGetStockForecastQuery();
  const items: any[] = data?.data || [];

  const critical = items.filter(i => i.daysRemaining !== null && i.daysRemaining <= 3);
  const low      = items.filter(i => i.daysRemaining !== null && i.daysRemaining > 3 && i.daysRemaining <= 7);
  const watch    = items.filter(i => i.daysRemaining !== null && i.daysRemaining > 7 && i.daysRemaining <= 14);
  const ok       = items.filter(i => i.daysRemaining !== null && i.daysRemaining > 14);
  const noData   = items.filter(i => i.daysRemaining === null);

  if (isLoading) return <div className="flex items-center justify-center h-full text-slate-400">Calculating forecast...</div>;

  return (
    <div className="h-full flex flex-col gap-4 overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">📈 Stock Forecast</h1>
          <p className="text-sm text-slate-500 mt-0.5">Days remaining based on average daily usage over last 30 days</p>
        </div>
        <button onClick={refetch} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 font-medium">↺ Refresh</button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Critical (≤3d)', count: critical.length, color: 'red', emoji: '🚨' },
          { label: 'Low (4–7d)',     count: low.length,      color: 'orange', emoji: '⚠️' },
          { label: 'Watch (8–14d)', count: watch.length,    color: 'yellow', emoji: '📉' },
          { label: 'Healthy (>14d)',count: ok.length,       color: 'green', emoji: '✓' },
        ].map(({ label, count, color, emoji }) => (
          <div key={label} className={`bg-${color}-50 border border-${color}-200 rounded-2xl p-4 text-center`}>
            <div className="text-2xl mb-1">{emoji}</div>
            <div className={`text-3xl font-black text-${color}-700`}>{count}</div>
            <div className={`text-xs font-medium text-${color}-600 mt-1`}>{label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 sticky top-0">
            <tr>
              {['Item', 'Category', 'Current Stock', 'Avg Daily Use', 'Forecast', 'Status'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-16 text-center text-slate-400">No inventory items found</td></tr>
            ) : items.map((item: any) => (
              <tr key={item.id} className={`hover:bg-slate-50 transition ${item.daysRemaining !== null && item.daysRemaining <= 3 ? 'bg-red-50/40' : ''}`}>
                <td className="px-4 py-3 font-semibold text-slate-800">{item.name}</td>
                <td className="px-4 py-3 text-slate-500">{item.category || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`font-bold ${item.currentStock <= (item.reorderLevel || 0) ? 'text-red-600' : 'text-slate-700'}`}>
                    {parseFloat(item.currentStock).toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">{item.unit}</span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {parseFloat(item.avgDailyUsage) > 0
                    ? <>{parseFloat(item.avgDailyUsage).toFixed(3)} <span className="text-xs text-slate-400">{item.unit}/day</span></>
                    : <span className="text-slate-300">No usage</span>}
                </td>
                <td className="px-4 py-3 min-w-40">
                  <DaysBar days={item.daysRemaining} />
                </td>
                <td className="px-4 py-3">
                  <UrgencyBadge days={item.daysRemaining} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {noData.length > 0 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400">
            {noData.length} item(s) with no recent usage data — estimated days not available
          </div>
        )}
      </div>
    </div>
  );
}
