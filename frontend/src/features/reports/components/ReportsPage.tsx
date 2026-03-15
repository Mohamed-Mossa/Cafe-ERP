import { useI18n } from '../../../i18n';
import { useState } from 'react';
import { baseApi } from '../../../app/baseApi';
import { formatCurrency } from '../../../utils/currency';

const reportsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getDashboard: b.query<any, void>({ query: () => '/reports/dashboard' }),
    getSalesReport: b.query<any, { from: string; to: string }>({
      query: ({ from, to }) => `/reports/sales?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    }),
    getShiftsReport: b.query<any, { from: string; to: string }>({
      query: ({ from, to }) => `/reports/shifts?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    }),
    getGamingReport: b.query<any, { from: string; to: string }>({
      query: ({ from, to }) => `/reports/gaming?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    }),
    getInventoryReport: b.query<any, void>({ query: () => '/reports/inventory-value' }),
    getLoyaltyReport: b.query<any, void>({ query: () => '/reports/loyalty' }),
    getTopProductsReport: b.query<any, { from: string; to: string }>({
      query: ({ from, to }) => `/reports/top-products?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    }),
    getProfitReport: b.query<any, { from: string; to: string }>({
      query: ({ from, to }) => `/reports/profit?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    }),
    getAbcAnalysis: b.query<any, { from: string; to: string }>({
      query: ({ from, to }) => `/reports/abc-analysis?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    }),
    getPeakHours: b.query<any, { from: string; to: string }>({
      query: ({ from, to }) => `/reports/peak-hours?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    }),
    getCashierPerformance: b.query<any, { from: string; to: string }>({
      query: ({ from, to }) => `/reports/cashier-performance?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    }),
    getTableTurnover: b.query<any, { from: string; to: string }>({
      query: ({ from, to }) => `/reports/table-turnover?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    }),
  }),
  overrideExisting: false,
});
const {
  useGetDashboardQuery, useGetSalesReportQuery, useGetShiftsReportQuery,
  useGetGamingReportQuery, useGetInventoryReportQuery, useGetLoyaltyReportQuery,
  useGetTopProductsReportQuery, useGetProfitReportQuery,
  useGetAbcAnalysisQuery, useGetPeakHoursQuery, useGetCashierPerformanceQuery, useGetTableTurnoverQuery,
} = reportsApi;

const today = new Date().toISOString().split('T')[0];
const TABS = [
  { id: 'dashboard',    label: '🏠 Dashboard',        icon: '🏠' },
  { id: 'sales',        label: '💰 Sales',             icon: '💰' },
  { id: 'shifts',       label: '🔄 Shifts',            icon: '🔄' },
  { id: 'gaming',       label: '🎮 Gaming',            icon: '🎮' },
  { id: 'inventory',    label: '📦 Inventory',         icon: '📦' },
  { id: 'loyalty',      label: '⭐ Loyalty',           icon: '⭐' },
  { id: 'top-products', label: '🏆 Top Products',      icon: '🏆' },
  { id: 'profit',       label: '📈 Profit',            icon: '📈' },
  { id: 'abc',          label: '🔠 ABC Analysis',      icon: '🔠' },
  { id: 'peak-hours',   label: '🕐 Peak Hours',        icon: '🕐' },
  { id: 'cashier',      label: '👤 Cashier KPIs',      icon: '👤' },
  { id: 'turnover',     label: '🪑 Table Turnover',    icon: '🪑' },
];
const TIER_ICON: Record<string, string> = { BRONZE: '🥉', SILVER: '🥈', GOLD: '⭐', PLATINUM: '💎' };

function DateRange({ from, to, setFrom, setTo, onRun, loading }: any) {
  return (
    <div className="flex gap-3 mb-5 flex-wrap items-end">
      {[{ label: 'From', val: from, set: setFrom }, { label: 'To', val: to, set: setTo }].map(({ label, val, set }) => (
        <div key={label}>
          <label className="text-xs text-slate-500 mb-1 block">{label}</label>
          <input type="datetime-local" value={val} onChange={e => set(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      ))}
      <button onClick={onRun}
        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition text-sm">
        {loading ? '...' : '▶ Run'}
      </button>
    </div>
  );
}

function StatCard({ label, value, sub, color = 'blue' }: any) {
  const colors: Record<string, string> = {
    blue:   'bg-blue-50 text-blue-700',
    green:  'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
    orange: 'bg-orange-50 text-orange-700',
    red:    'bg-red-50 text-red-700',
    amber:  'bg-amber-50 text-amber-700',
  };
  return (
    <div className={`rounded-2xl p-4 ${colors[color]}`}>
      <div className="text-xs font-medium opacity-75 mb-1">{label}</div>
      <div className="text-2xl font-black">{value}</div>
      {sub && <div className="text-xs opacity-60 mt-1">{sub}</div>}
    </div>
  );
}

function BreakdownList({ title, data, format = (v: any) => v }: any) {
  if (!data || Object.keys(data).length === 0) return null;
  return (
    <div>
      <div className="text-sm font-semibold text-slate-600 mb-2">{title}</div>
      <div className="space-y-1.5">
        {Object.entries(data).map(([key, val]) => (
          <div key={key} className="flex justify-between items-center px-4 py-2.5 bg-slate-50 rounded-xl">
            <span className="font-medium text-slate-700">{key}</span>
            <span className="font-bold text-slate-800">{format(val)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { t, isRTL } = useI18n();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [from, setFrom] = useState(`${today}T00:00:00`);
  const [to, setTo] = useState(`${today}T23:59:59`);
  const [query, setQuery] = useState({ from: `${today}T00:00:00`, to: `${today}T23:59:59` });

  const { data: dashRes, isLoading: dashLoading } = useGetDashboardQuery(undefined, { pollingInterval: 30000 });
  const { data: salesRes, isFetching: salesF } = useGetSalesReportQuery(query, { skip: activeTab !== 'sales' });
  const { data: shiftsRes, isFetching: shiftsF } = useGetShiftsReportQuery(query, { skip: activeTab !== 'shifts' });
  const { data: gamingRes, isFetching: gamingF } = useGetGamingReportQuery(query, { skip: activeTab !== 'gaming' });
  const { data: invRes } = useGetInventoryReportQuery(undefined, { skip: activeTab !== 'inventory' });
  const { data: loyaltyRes } = useGetLoyaltyReportQuery(undefined, { skip: activeTab !== 'loyalty' });
  const { data: topProductsRes, isFetching: topPF } = useGetTopProductsReportQuery(query, { skip: activeTab !== 'top-products' });
  const { data: profitRes, isFetching: profitF } = useGetProfitReportQuery(query, { skip: activeTab !== 'profit' });
  const { data: abcRes, isFetching: abcF } = useGetAbcAnalysisQuery(query, { skip: activeTab !== 'abc' });
  const { data: peakRes, isFetching: peakF } = useGetPeakHoursQuery(query, { skip: activeTab !== 'peak-hours' });
  const { data: cashierRes, isFetching: cashierF } = useGetCashierPerformanceQuery(query, { skip: activeTab !== 'cashier' });
  const { data: turnoverRes, isFetching: turnoverF } = useGetTableTurnoverQuery(query, { skip: activeTab !== 'turnover' });

  const dash = dashRes?.data;
  const sales = salesRes?.data;
  const shifts = shiftsRes?.data;
  const gaming = gamingRes?.data;
  const inv = invRes?.data;
  const loyalty = loyaltyRes?.data;

  const runQuery = () => setQuery({ from, to });

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">📊 Reports</h1>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-white rounded-2xl shadow-sm p-1.5 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${activeTab === t.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-4">

        {/* ── DASHBOARD ── */}
        {activeTab === 'dashboard' && (
          <>
            {dashLoading ? <div className="text-slate-400 text-sm">Loading...</div> : dash ? (
              <>
                <div className="grid grid-cols-5 gap-3">
                  <StatCard label="Today's Sales" value={formatCurrency(dash.todaySales || 0)} color="green" />
                  <StatCard label="Orders Today" value={dash.todayOrderCount ?? 0} color="blue" />
                  <StatCard label="Open Orders" value={dash.openOrders ?? 0} color="amber" />
                  <StatCard label="Active Gaming" value={dash.activeSessions ?? 0} color="purple" />
                  <StatCard label="Low Stock Alerts" value={dash.lowStockAlerts ?? 0} color="red" />
                </div>
                <div className="bg-white rounded-2xl shadow-sm p-5 text-center text-slate-400 text-sm">
                  Use the tabs above for detailed reports · Auto-refreshes every 30s
                </div>
              </>
            ) : null}
          </>
        )}

        {/* ── SALES ── */}
        {activeTab === 'sales' && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-bold text-slate-800 mb-4">💰 Sales Report</h2>
            <DateRange from={from} to={to} setFrom={setFrom} setTo={setTo} onRun={runQuery} loading={salesF} />
            {sales ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <StatCard label="Total Revenue" value={formatCurrency(sales.totalRevenue || 0)} color="green" />
                  <StatCard label="Paid Orders" value={sales.orderCount || 0} color="blue" />
                  <StatCard label="Total Discounts" value={formatCurrency(sales.totalDiscount || 0)} color="orange" />
                </div>
                <BreakdownList title="Revenue by Source" data={sales.revenueBySource}
                  format={(v: number) => formatCurrency(v)} />
              </div>
            ) : (
              <div className="text-center text-slate-400 py-12">{salesF ? 'Loading...' : 'Press ▶ Run to load the report'}</div>
            )}
          </div>
        )}

        {/* ── SHIFTS ── */}
        {activeTab === 'shifts' && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-bold text-slate-800 mb-4">🔄 Shift Reconciliation Report</h2>
            <DateRange from={from} to={to} setFrom={setFrom} setTo={setTo} onRun={runQuery} loading={shiftsF} />
            {shifts ? (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <StatCard label="Shifts" value={shifts.shiftCount || 0} color="blue" />
                  <StatCard label="Total Sales" value={formatCurrency(shifts.totalSales || 0)} color="green" />
                  <StatCard label="Total Expenses" value={formatCurrency(shifts.totalExpenses || 0)} color="orange" />
                  <StatCard label="Cash Variance" value={formatCurrency(shifts.totalCashVariance || 0)}
                    color={Number(shifts.totalCashVariance) >= 0 ? 'green' : 'red'} />
                </div>
                {shifts.shifts?.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-slate-600 mb-2">Shift Breakdown</div>
                    <div className="overflow-auto rounded-2xl border border-slate-200">
                      <table className="w-full">
                        <thead className="bg-slate-50">
                          <tr>
                            {['Cashier', 'Opened', 'Closed', 'Sales', 'Expenses', 'Opening Bal', 'Variance', 'Status'].map(h => (
                              <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {shifts.shifts.map((s: any) => (
                            <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                              <td className="px-3 py-2 font-medium text-slate-800 text-sm">{s.cashierName}</td>
                              <td className="px-3 py-2 text-xs text-slate-400">{s.createdAt ? new Date(s.createdAt).toLocaleString('en-EG', {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'}</td>
                              <td className="px-3 py-2 text-xs text-slate-400">{s.closedAt ? new Date(s.closedAt).toLocaleString('en-EG', {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'}</td>
                              <td className="px-3 py-2 font-bold text-green-700 text-sm">{formatCurrency(s.totalSales)}</td>
                              <td className="px-3 py-2 text-orange-600 text-sm">{formatCurrency(s.totalExpenses)}</td>
                              <td className="px-3 py-2 text-slate-500 text-sm">{formatCurrency(s.openingBalance)}</td>
                              <td className={`px-3 py-2 font-bold text-sm ${s.cashVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {s.cashVariance != null ? (s.cashVariance >= 0 ? '+' : '') + formatCurrency(s.cashVariance) : '—'}
                              </td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.status === 'CLOSED' ? 'bg-slate-100 text-slate-500' : 'bg-green-100 text-green-700'}`}>
                                  {s.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-slate-400 py-12">{shiftsF ? 'Loading...' : 'Press ▶ Run to load the report'}</div>
            )}
          </div>
        )}

        {/* ── GAMING ── */}
        {activeTab === 'gaming' && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-bold text-slate-800 mb-4">🎮 Gaming Revenue Report</h2>
            <DateRange from={from} to={to} setFrom={setFrom} setTo={setTo} onRun={runQuery} loading={gamingF} />
            {gaming ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <StatCard label="Sessions" value={gaming.sessionCount || 0} color="purple" />
                  <StatCard label="Total Revenue" value={formatCurrency(gaming.totalRevenue || 0)} color="green" />
                  <StatCard label="Total Hours" value={`${Math.floor((gaming.totalMinutes || 0) / 60)}h ${(gaming.totalMinutes || 0) % 60}m`} color="blue" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <BreakdownList title="Sessions by Device" data={gaming.sessionsByDevice} />
                  <BreakdownList title="Revenue by Device" data={gaming.revenueByDevice}
                    format={(v: number) => formatCurrency(v)} />
                </div>
                <BreakdownList title="Sessions by Type" data={gaming.sessionsByType} />
              </div>
            ) : (
              <div className="text-center text-slate-400 py-12">{gamingF ? 'Loading...' : 'Press ▶ Run to load the report'}</div>
            )}
          </div>
        )}

        {/* ── INVENTORY ── */}
        {activeTab === 'inventory' && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-bold text-slate-800 mb-4">📦 Inventory Value Report</h2>
            {inv ? (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <StatCard label="Total Items" value={inv.totalItems || 0} color="blue" />
                  <StatCard label="Stock Value" value={formatCurrency(inv.totalStockValue || 0)} color="green" />
                  <StatCard label="Low Stock" value={inv.lowStockCount || 0} color="amber" />
                  <StatCard label="Out of Stock" value={inv.outOfStockCount || 0} color="red" />
                </div>
                <BreakdownList title="Value by Category" data={inv.valueByCategory}
                  format={(v: number) => formatCurrency(v)} />
                {inv.items?.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-slate-600 mb-2">Item Detail</div>
                    <div className="overflow-auto rounded-2xl border border-slate-200 max-h-96">
                      <table className="w-full">
                        <thead className="bg-slate-50 sticky top-0">
                          <tr>
                            {['Item', 'Category', 'Stock', 'Unit', 'Avg Cost', 'Total Value', 'Status'].map(h => (
                              <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[...inv.items].sort((a: any, b: any) => (b.currentStock * b.averageCost) - (a.currentStock * a.averageCost)).map((item: any) => {
                            const val = item.currentStock * item.averageCost;
                            const isLow = item.currentStock <= item.reorderLevel;
                            const isOut = item.currentStock <= 0;
                            return (
                              <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
                                <td className="px-3 py-2 font-medium text-slate-800 text-sm">{item.name}</td>
                                <td className="px-3 py-2 text-slate-400 text-xs">{item.category || '—'}</td>
                                <td className={`px-3 py-2 font-bold text-sm ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-slate-800'}`}>
                                  {Number(item.currentStock).toFixed(2)}
                                </td>
                                <td className="px-3 py-2 text-slate-400 text-xs">{item.unit}</td>
                                <td className="px-3 py-2 text-slate-500 text-sm">{formatCurrency(item.averageCost)}</td>
                                <td className="px-3 py-2 font-bold text-green-700 text-sm">{formatCurrency(val)}</td>
                                <td className="px-3 py-2">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isOut ? 'bg-red-100 text-red-600' : isLow ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-700'}`}>
                                    {isOut ? '⚠ Out' : isLow ? '⚠ Low' : '✓ OK'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-slate-400 py-12">Loading inventory data...</div>
            )}
          </div>
        )}

        {/* ── LOYALTY ── */}
        {activeTab === 'loyalty' && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-bold text-slate-800 mb-4">⭐ Loyalty & Customer Report</h2>
            {loyalty ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <StatCard label="Total Customers" value={loyalty.totalCustomers || 0} color="blue" />
                  <StatCard label="Points in Circulation" value={(loyalty.totalPointsInCirculation || 0).toLocaleString()} color="amber" sub="Loyalty liability" />
                  <StatCard label="Lifetime Spend" value={formatCurrency(loyalty.totalLifetimeSpend || 0)} color="green" />
                </div>

                {loyalty.customersByTier && (
                  <div>
                    <div className="text-sm font-semibold text-slate-600 mb-2">Customers by Tier</div>
                    <div className="grid grid-cols-4 gap-3">
                      {Object.entries(loyalty.customersByTier).map(([tier, count]) => (
                        <div key={tier} className="bg-slate-50 rounded-2xl p-4 text-center">
                          <div className="text-3xl mb-1">{TIER_ICON[tier] || '🏅'}</div>
                          <div className="text-2xl font-black text-slate-800">{String(count)}</div>
                          <div className="text-xs text-slate-400 font-medium mt-1">{tier}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {loyalty.topSpenders?.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-slate-600 mb-2">🏆 Top 10 Spenders</div>
                    <div className="rounded-2xl border border-slate-200 overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-slate-50">
                          <tr>
                            {['#', 'Name', 'Phone', 'Tier', 'Points', 'Total Spent'].map(h => (
                              <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {loyalty.topSpenders.map((c: any, i: number) => (
                            <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                              <td className="px-4 py-2.5 font-bold text-slate-400 text-sm">#{i + 1}</td>
                              <td className="px-4 py-2.5 font-semibold text-slate-800 text-sm">{c.fullName}</td>
                              <td className="px-4 py-2.5 text-slate-400 text-sm">{c.phone}</td>
                              <td className="px-4 py-2.5 text-sm">{TIER_ICON[c.tier] || ''} {c.tier}</td>
                              <td className="px-4 py-2.5 font-bold text-blue-600 text-sm">{c.totalPoints.toLocaleString()}</td>
                              <td className="px-4 py-2.5 font-bold text-green-700 text-sm">{formatCurrency(c.totalSpent)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-slate-400 py-12">Loading loyalty data...</div>
            )}
          </div>
        )}


        {/* ── TOP PRODUCTS TAB ── */}
        {activeTab === 'top-products' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
            <h2 className="font-bold text-slate-700 text-lg">🏆 Top Products by Revenue</h2>
            <DateRange from={from} to={to} setFrom={setFrom} setTo={setTo} onRun={() => setQuery({ from, to })} loading={topPF} />
            {topProductsRes?.data ? (() => {
              const tp = topProductsRes.data;
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <StatCard label="Products Sold" value={tp.productCount || 0} color="blue" />
                    <StatCard label="Total Revenue" value={formatCurrency(tp.totalRevenue || 0)} color="green" />
                  </div>
                  {tp.topProducts?.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-slate-50">
                          <tr>{['#', 'Product', 'Qty Sold', 'Revenue'].map(h => (
                            <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
                          ))}</tr>
                        </thead>
                        <tbody>
                          {tp.topProducts.map((p: any, i: number) => (
                            <tr key={p.name} className="border-t border-slate-100 hover:bg-slate-50">
                              <td className="px-4 py-2.5 font-bold text-slate-400 text-sm">#{i + 1}</td>
                              <td className="px-4 py-2.5 font-semibold text-slate-800">{p.name}</td>
                              <td className="px-4 py-2.5 text-blue-600 font-bold">{p.qty}</td>
                              <td className="px-4 py-2.5 text-green-700 font-bold">{formatCurrency(p.revenue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })() : <div className="text-center text-slate-400 py-12">Select a date range and click Run</div>}
          </div>
        )}

        {/* ── PROFIT TAB ── */}
        {activeTab === 'profit' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
            <h2 className="font-bold text-slate-700 text-lg">📈 Revenue & Profit Analysis</h2>
            <DateRange from={from} to={to} setFrom={setFrom} setTo={setTo} onRun={() => setQuery({ from, to })} loading={profitF} />
            {profitRes?.data ? (() => {
              const pf = profitRes.data;
              return (
                <div className="space-y-5">
                  <div className="grid grid-cols-3 gap-4">
                    <StatCard label="Total Revenue" value={formatCurrency(pf.totalRevenue || 0)} color="green" />
                    <StatCard label="Total Orders" value={pf.totalOrders || 0} color="blue" />
                    <StatCard label="Avg Order Value" value={formatCurrency(pf.averageOrderValue || 0)} color="purple" />
                  </div>
                  <BreakdownList title="Revenue by Payment Method" data={pf.revenueByPaymentMethod} format={(v: any) => formatCurrency(v)} />
                  <BreakdownList title="Revenue by Order Source" data={pf.revenueBySource} format={(v: any) => formatCurrency(v)} />
                </div>
              );
            })() : <div className="text-center text-slate-400 py-12">Select a date range and click Run</div>}
          </div>
        )}

        {/* ── ABC ANALYSIS TAB ── */}
        {activeTab === 'abc' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
            <h2 className="font-bold text-slate-700 text-lg">🔠 ABC Product Analysis</h2>
            <p className="text-sm text-slate-500">Classifies products: A = top 70% revenue, B = next 20%, C = bottom 10%</p>
            <DateRange from={from} to={to} setFrom={setFrom} setTo={setTo} onRun={() => setQuery({ from, to })} loading={abcF} />
            {abcRes?.data ? (() => {
              const abc = abcRes.data;
              return (
                <div className="space-y-5">
                  <div className="grid grid-cols-4 gap-4">
                    <StatCard label="Class A Products" value={abc.classACount} color="green" sub="Top revenue drivers" />
                    <StatCard label="Class B Products" value={abc.classBCount} color="blue" sub="Mid-tier revenue" />
                    <StatCard label="Class C Products" value={abc.classCCount} color="orange" sub="Low revenue / candidates for removal" />
                    <StatCard label="Total Revenue" value={formatCurrency(abc.totalRevenue)} color="purple" />
                  </div>
                  <div className="overflow-auto">
                    <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
                      <thead className="bg-slate-50">
                        <tr>{['#','Product','Revenue','Cumulative %','Class'].map(h => (
                          <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-slate-500">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {abc.products?.map((p: any, i: number) => (
                          <tr key={p.name} className={`border-t border-slate-100 hover:bg-slate-50 ${p.abcClass === 'A' ? 'bg-green-50/40' : p.abcClass === 'B' ? 'bg-blue-50/40' : 'bg-orange-50/30'}`}>
                            <td className="px-4 py-2.5 text-slate-400 text-xs">#{i+1}</td>
                            <td className="px-4 py-2.5 font-semibold text-slate-800">{p.name}</td>
                            <td className="px-4 py-2.5 text-green-700 font-bold">{formatCurrency(p.revenue)}</td>
                            <td className="px-4 py-2.5 text-slate-600">{Number(p.cumulativePct).toFixed(1)}%</td>
                            <td className="px-4 py-2.5">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${p.abcClass === 'A' ? 'bg-green-100 text-green-700' : p.abcClass === 'B' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-600'}`}>
                                {p.abcClass}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })() : <div className="text-center text-slate-400 py-12">Select a date range and click Run</div>}
          </div>
        )}

        {/* ── PEAK HOURS TAB ── */}
        {activeTab === 'peak-hours' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
            <h2 className="font-bold text-slate-700 text-lg">🕐 Peak Hours Heatmap</h2>
            <DateRange from={from} to={to} setFrom={setFrom} setTo={setTo} onRun={() => setQuery({ from, to })} loading={peakF} />
            {peakRes?.data ? (() => {
              const ph = peakRes.data;
              const maxHourVal = Math.max(...Object.values(ph.byHour as Record<string,number>).map(Number), 1);
              const maxDayVal = Math.max(...Object.values(ph.byDay as Record<string,number>).map(Number), 1);
              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <StatCard label="Peak Hour" value={`${ph.peakHour}:00`} color="purple" />
                    <StatCard label="Peak Day" value={ph.peakDay} color="blue" />
                    <StatCard label="Total Orders" value={ph.totalOrders} color="green" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-600 mb-3 text-sm">Orders by Hour</h3>
                    <div className="flex gap-1 items-end h-24">
                      {Object.entries(ph.byHour as Record<string,number>).map(([h, count]) => (
                        <div key={h} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full rounded-t bg-blue-500 transition-all"
                            style={{ height: `${(Number(count) / maxHourVal) * 80}px`, minHeight: Number(count) > 0 ? '4px' : '0' }}
                            title={`${h}:00 — ${count} orders`} />
                          <span className="text-xs text-slate-400">{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-600 mb-3 text-sm">Orders by Day of Week</h3>
                    <div className="grid grid-cols-7 gap-2">
                      {Object.entries(ph.byDay as Record<string,number>).map(([day, count]) => (
                        <div key={day} className="text-center">
                          <div className="font-bold text-lg text-blue-600">{count as number}</div>
                          <div className="text-xs text-slate-500">{day}</div>
                          <div className="mt-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${(Number(count) / maxDayVal) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })() : <div className="text-center text-slate-400 py-12">Select a date range and click Run</div>}
          </div>
        )}

        {/* ── CASHIER PERFORMANCE TAB ── */}
        {activeTab === 'cashier' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
            <h2 className="font-bold text-slate-700 text-lg">👤 Cashier Performance</h2>
            <DateRange from={from} to={to} setFrom={setFrom} setTo={setTo} onRun={() => setQuery({ from, to })} loading={cashierF} />
            {cashierRes?.data ? (() => {
              const cd = cashierRes.data;
              return (
                <div className="overflow-auto">
                  <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-slate-50">
                      <tr>{['Cashier','Orders','Total Sales','Avg Ticket','Total Discount','Cash Variance'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {cd.cashiers?.map((c: any) => (
                        <tr key={c.name} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3 font-bold text-slate-800">{c.name}</td>
                          <td className="px-4 py-3 text-blue-600 font-bold">{c.orderCount}</td>
                          <td className="px-4 py-3 text-green-700 font-bold">{formatCurrency(c.totalSales)}</td>
                          <td className="px-4 py-3 text-slate-600">{formatCurrency(c.avgTicket)}</td>
                          <td className="px-4 py-3 text-red-500">{formatCurrency(c.totalDiscount)}</td>
                          <td className="px-4 py-3">
                            {c.totalVariance != null ? (
                              <span className={`font-bold ${c.totalVariance < 0 ? 'text-red-600' : c.totalVariance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                                {c.totalVariance < 0 ? '−' : '+'}{formatCurrency(Math.abs(c.totalVariance))}
                              </span>
                            ) : <span className="text-slate-400">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })() : <div className="text-center text-slate-400 py-12">Select a date range and click Run</div>}
          </div>
        )}

        {/* ── TABLE TURNOVER TAB ── */}
        {activeTab === 'turnover' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
            <h2 className="font-bold text-slate-700 text-lg">🪑 Table Turnover Rate</h2>
            <DateRange from={from} to={to} setFrom={setFrom} setTo={setTo} onRun={() => setQuery({ from, to })} loading={turnoverF} />
            {turnoverRes?.data ? (() => {
              const tv = turnoverRes.data;
              return (
                <div className="space-y-5">
                  <div className="grid grid-cols-3 gap-4">
                    <StatCard label="Period (days)" value={tv.periodDays} color="blue" />
                    <StatCard label="Total Table Orders" value={tv.totalTableOrders} color="green" />
                    <StatCard label="Tables Tracked" value={Object.keys(tv.turnoverByTable || {}).length} color="purple" />
                  </div>
                  <div className="overflow-auto">
                    <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
                      <thead className="bg-slate-50">
                        <tr>{['Table','Total Seatings','Avg per Day'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {Object.entries(tv.turnoverByTable || {}).sort(([,a],[,b]) => Number(b) - Number(a)).map(([table, count]) => (
                          <tr key={table} className="border-t border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-3 font-bold text-slate-800">{table}</td>
                            <td className="px-4 py-3 text-blue-600 font-bold">{count as number}</td>
                            <td className="px-4 py-3 text-slate-600">{Number(tv.avgPerDayByTable?.[table] || 0).toFixed(1)}x/day</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })() : <div className="text-center text-slate-400 py-12">Select a date range and click Run</div>}
          </div>
        )}

      </div>
    </div>
  );
}
