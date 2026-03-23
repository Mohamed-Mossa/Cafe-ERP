import { useI18n } from '../../../i18n';
import { useState, useCallback } from 'react';
import { useAppSelector } from '../../../app/hooks';
import { baseApi } from '../../../app/baseApi';
import { formatCurrency } from '../../../utils/currency';
import { canViewCustomerPhones } from '../../../utils/customerPrivacy';

/* ─────────────────────────────────────────────────────────────
   API
───────────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────────
   PDF PRINT ENGINE
───────────────────────────────────────────────────────────── */
const PRINT_CSS = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#1e293b;background:#fff}
  .wrap{padding:32px;max-width:900px;margin:0 auto}
  .hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1d4ed8;padding-bottom:14px;margin-bottom:20px}
  .hdr-logo{font-size:22px;font-weight:900;color:#1d4ed8;letter-spacing:-1px}
  .hdr h1{font-size:19px;font-weight:800;color:#1e293b;margin-top:4px}
  .hdr-period{font-size:10px;color:#64748b;margin-top:3px}
  .hdr-meta{font-size:9px;color:#64748b;text-align:right;line-height:1.8}
  .stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:18px}
  .sc{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:13px}
  .sc .lbl{font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
  .sc .val{font-size:20px;font-weight:900;color:#0f172a}
  .sc .sub{font-size:9px;color:#94a3b8;margin-top:2px}
  .sc.green .val{color:#16a34a}.sc.blue .val{color:#2563eb}.sc.orange .val{color:#ea580c}
  .sc.red .val{color:#dc2626}.sc.purple .val{color:#7c3aed}.sc.amber .val{color:#d97706}
  .sec{font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.5px;
       margin:16px 0 7px;padding-bottom:4px;border-bottom:1px solid #e2e8f0}
  table{width:100%;border-collapse:collapse;margin-bottom:14px;font-size:11px}
  thead tr{background:#1e293b;color:#fff}
  thead th{padding:7px 10px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.4px}
  tbody tr:nth-child(even){background:#f8fafc}
  tbody tr{border-bottom:1px solid #e2e8f0}
  tbody td{padding:6px 10px}
  .badge{display:inline-block;padding:2px 7px;border-radius:20px;font-size:9px;font-weight:700}
  .bg{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:14px}
  .br{display:flex;justify-content:space-between;padding:7px 12px;border-bottom:1px solid #f1f5f9}
  .br:last-child{border-bottom:none}
  .bk{font-weight:600;color:#334155}.bv{font-weight:800;color:#0f172a}
  .bar-chart{display:flex;align-items:flex-end;gap:3px;height:80px;margin:8px 0 4px}
  .bc{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px}
  .bf{width:100%;background:#3b82f6;border-radius:3px 3px 0 0;min-height:2px}
  .bl{font-size:8px;color:#94a3b8}
  .day-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin-top:8px}
  .dc{text-align:center}.dv{font-size:15px;font-weight:900;color:#2563eb}
  .dn{font-size:9px;color:#64748b;margin-top:2px}
  .db{height:4px;background:#e2e8f0;border-radius:2px;margin-top:4px;overflow:hidden}
  .dbf{height:100%;background:#3b82f6;border-radius:2px}
  .tier-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}
  .tc{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;text-align:center}
  .ti{font-size:26px}.tct{font-size:20px;font-weight:900;color:#0f172a;margin:3px 0}
  .tn{font-size:10px;color:#64748b;font-weight:600}
  .ftr{margin-top:24px;padding-top:10px;border-top:1px solid #e2e8f0;
       display:flex;justify-content:space-between;font-size:9px;color:#94a3b8}
  .note{padding:10px 14px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;font-size:11px;color:#0369a1;margin-bottom:14px}
  @page{size:A4;margin:14mm 11mm}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
`;

function printReport(title: string, body: string, period?: string) {
  const win = window.open('', '_blank', 'width=960,height=720');
  if (!win) { alert('Please allow pop-ups to export PDF'); return; }
  const now = new Date().toLocaleString('en-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title><style>${PRINT_CSS}</style></head><body>
  <div class="wrap">
    <div class="hdr">
      <div>
        <div class="hdr-logo">☕ Cafe ERP</div>
        <h1>${title}</h1>
        ${period ? `<div class="hdr-period">Period: ${period}</div>` : ''}
      </div>
      <div class="hdr-meta">Generated: ${now}<br/>Confidential &mdash; Internal Use Only</div>
    </div>
    ${body}
    <div class="ftr"><span>Cafe ERP — Reports Module</span><span>Generated ${now}</span></div>
  </div>
  <script>window.onload=function(){window.print()}<\/script>
  </body></html>`);
  win.document.close();
}

/* helpers */
const fc = formatCurrency;
const TIER_ICON: Record<string, string> = { BRONZE: '🥉', SILVER: '🥈', GOLD: '⭐', PLATINUM: '💎' };

function breakdown(title: string, data: Record<string, any>, fmt = (v: any) => String(v)) {
  if (!data || !Object.keys(data).length) return '';
  const rows = Object.entries(data).map(([k, v]) => `<div class="br"><span class="bk">${k}</span><span class="bv">${fmt(v)}</span></div>`).join('');
  return `<div class="sec">${title}</div><div class="bg">${rows}</div>`;
}

function statGrid(cards: { label: string; value: string | number; sub?: string; color?: string }[]) {
  return `<div class="stat-grid">${cards.map(c =>
    `<div class="sc ${c.color || 'blue'}"><div class="lbl">${c.label}</div><div class="val">${c.value}</div>${c.sub ? `<div class="sub">${c.sub}</div>` : ''}</div>`
  ).join('')}</div>`;
}

function tableHtml(headers: string[], rows: string) {
  return `<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`;
}

/* ── Print builders per tab ── */
function printDashboard(dash: any) {
  return statGrid([
    { label: "Today's Sales", value: fc(dash.todaySales || 0), color: 'green' },
    { label: 'Orders Today',  value: dash.todayOrderCount ?? 0, color: 'blue' },
    { label: 'Open Orders',   value: dash.openOrders ?? 0, color: 'amber' },
    { label: 'Active Gaming', value: dash.activeSessions ?? 0, color: 'purple' },
    { label: 'Low Stock Alerts', value: dash.lowStockAlerts ?? 0, color: 'red' },
  ]) + `<div class="note">Dashboard snapshot as of ${new Date().toLocaleString('en-EG')}</div>`;
}

function printSales(sales: any, labels: any) {
  return statGrid([
    { label: labels.totalRevenue,   value: fc(sales.totalRevenue || 0), color: 'green' },
    { label: labels.paidOrders,     value: sales.orderCount || 0, color: 'blue' },
    { label: labels.totalDiscounts, value: fc(sales.totalDiscount || 0), color: 'orange' },
  ]) + breakdown(labels.revenueBySource, sales.revenueBySource, fc);
}

function printShifts(shifts: any, labels: any) {
  const rows = (shifts.shifts || []).map((s: any) => {
    const opened = s.createdAt ? new Date(s.createdAt).toLocaleString('en-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
    const closed = s.closedAt  ? new Date(s.closedAt).toLocaleString('en-EG',  { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
    const vc = s.cashVariance >= 0 ? 'color:#16a34a' : 'color:#dc2626';
    const vs = s.cashVariance != null ? (s.cashVariance >= 0 ? '+' : '') + fc(s.cashVariance) : '—';
    const sb = s.status === 'CLOSED' ? 'background:#f1f5f9;color:#475569' : 'background:#dcfce7;color:#15803d';
    return `<tr><td><strong>${s.cashierName}</strong></td><td>${opened}</td><td>${closed}</td>
      <td style="color:#16a34a;font-weight:700">${fc(s.totalSales)}</td>
      <td style="color:#ea580c">${fc(s.totalExpenses)}</td><td>${fc(s.openingBalance)}</td>
      <td style="${vc};font-weight:700">${vs}</td>
      <td><span class="badge" style="${sb}">${s.status}</span></td></tr>`;
  }).join('');
  return statGrid([
    { label: labels.shifts,        value: shifts.shiftCount || 0, color: 'blue' },
    { label: labels.totalSales,    value: fc(shifts.totalSales || 0), color: 'green' },
    { label: labels.totalExpenses, value: fc(shifts.totalExpenses || 0), color: 'orange' },
    { label: labels.cashVariance,  value: fc(shifts.totalCashVariance || 0), color: (shifts.totalCashVariance || 0) >= 0 ? 'green' : 'red' },
  ]) + (rows ? `<div class="sec">${labels.shiftBreakdown}</div>` + tableHtml([labels.cashier, labels.opened, labels.closed, labels.sales, labels.expenses, labels.openingBal, labels.variance, labels.status], rows) : '');
}

function printGaming(gaming: any, labels: any) {
  const hrs = Math.floor((gaming.totalMinutes || 0) / 60);
  const mins = (gaming.totalMinutes || 0) % 60;
  return statGrid([
    { label: labels.sessions,      value: gaming.sessionCount || 0, color: 'purple' },
    { label: labels.totalRevenue,  value: fc(gaming.totalRevenue || 0), color: 'green' },
    { label: labels.totalHours,    value: `${hrs}h ${mins}m`, color: 'blue' },
  ]) + breakdown(labels.sessionsByDevice, gaming.sessionsByDevice)
     + breakdown(labels.revenueByDevice,  gaming.revenueByDevice, fc)
     + breakdown(labels.sessionsByType,   gaming.sessionsByType);
}

function printInventory(inv: any, labels: any) {
  const rows = [...(inv.items || [])].sort((a: any, b: any) => (b.currentStock*b.averageCost)-(a.currentStock*a.averageCost)).map((item: any) => {
    const val = item.currentStock * item.averageCost;
    const isOut = item.currentStock <= 0;
    const isLow = item.currentStock <= item.reorderLevel;
    const bs = isOut ? 'background:#fee2e2;color:#b91c1c' : isLow ? 'background:#fef3c7;color:#b45309' : 'background:#dcfce7;color:#15803d';
    const bl = isOut ? '⚠ Out' : isLow ? '⚠ Low' : '✓ OK';
    return `<tr><td><strong>${item.name}</strong></td><td>${item.category||'—'}</td>
      <td style="font-weight:700">${Number(item.currentStock).toFixed(2)}</td><td>${item.unit}</td>
      <td>${fc(item.averageCost)}</td><td style="color:#16a34a;font-weight:700">${fc(val)}</td>
      <td><span class="badge" style="${bs}">${bl}</span></td></tr>`;
  }).join('');
  return statGrid([
    { label: labels.totalItems,  value: inv.totalItems || 0, color: 'blue' },
    { label: labels.stockValue,  value: fc(inv.totalStockValue || 0), color: 'green' },
    { label: labels.lowStock,    value: inv.lowStockCount || 0, color: 'amber' },
    { label: labels.outOfStock,  value: inv.outOfStockCount || 0, color: 'red' },
  ]) + breakdown(labels.valueByCategory, inv.valueByCategory, fc)
     + (rows ? `<div class="sec">${labels.itemDetail}</div>` + tableHtml([labels.item, labels.category, labels.stock, labels.unit, labels.avgCost, labels.totalValue, labels.status], rows) : '');
}

function printLoyalty(loyalty: any, labels: any, showPhoneColumn: boolean) {
  const tiers = loyalty.customersByTier
    ? `<div class="sec">${labels.customersByTier}</div><div class="tier-grid">${Object.entries(loyalty.customersByTier).map(([tier, count]) =>
        `<div class="tc"><div class="ti">${TIER_ICON[tier]||'🏅'}</div><div class="tct">${String(count)}</div><div class="tn">${tier}</div></div>`
      ).join('')}</div>` : '';
  const rows = (loyalty.topSpenders || []).map((c: any, i: number) =>
    `<tr><td style="color:#94a3b8;font-weight:700">#${i+1}</td><td><strong>${c.fullName}</strong></td>
    ${showPhoneColumn ? `<td>${c.phone || '—'}</td>` : ''}
    <td>${TIER_ICON[c.tier]||''} ${c.tier}</td>
    <td style="color:#2563eb;font-weight:700">${c.totalPoints.toLocaleString()}</td>
    <td style="color:#16a34a;font-weight:700">${fc(c.totalSpent)}</td></tr>`
  ).join('');
  return statGrid([
    { label: labels.totalCustomers,       value: loyalty.totalCustomers || 0, color: 'blue' },
    { label: labels.pointsInCirculation,  value: (loyalty.totalPointsInCirculation||0).toLocaleString(), color: 'amber', sub: labels.loyaltyLiability },
    { label: labels.lifetimeSpend,        value: fc(loyalty.totalLifetimeSpend||0), color: 'green' },
  ]) + tiers + (rows ? `<div class="sec">🏆 ${labels.topSpenders}</div>` + tableHtml(
    ['#', labels.nameCol, ...(showPhoneColumn ? [labels.phone] : []), labels.tier, labels.points, labels.totalSpent],
    rows,
  ) : '');
}

function printTopProducts(tp: any, labels: any) {
  const rows = (tp.topProducts||[]).map((p: any, i: number) =>
    `<tr><td style="color:#94a3b8;font-weight:700">#${i+1}</td><td><strong>${p.name}</strong></td>
    <td style="color:#2563eb;font-weight:700">${p.qty}</td>
    <td style="color:#16a34a;font-weight:700">${fc(p.revenue)}</td></tr>`
  ).join('');
  return statGrid([
    { label: labels.productsSold, value: tp.productCount||0, color: 'blue' },
    { label: labels.totalRevenue, value: fc(tp.totalRevenue||0), color: 'green' },
  ]) + (rows ? `<div class="sec">${labels.topProductsTitle}</div>` + tableHtml(['#', labels.product, labels.qtySold, labels.revenue], rows) : '');
}

function printProfit(pf: any, labels: any) {
  return statGrid([
    { label: labels.totalRevenue,   value: fc(pf.totalRevenue||0), color: 'green' },
    { label: labels.totalOrders,    value: pf.totalOrders||0, color: 'blue' },
    { label: labels.avgOrderValue,  value: fc(pf.averageOrderValue||0), color: 'purple' },
  ]) + breakdown(labels.revenueByPayment, pf.revenueByPaymentMethod, fc)
     + breakdown(labels.revenueByOrderSrc, pf.revenueBySource, fc);
}

function printAbc(abc: any, labels: any) {
  const rows = (abc.products||[]).map((p: any, i: number) => {
    const bs = p.abcClass==='A' ? 'background:#dcfce7;color:#15803d' : p.abcClass==='B' ? 'background:#dbeafe;color:#1d4ed8' : 'background:#ffedd5;color:#c2410c';
    return `<tr><td style="color:#94a3b8">#${i+1}</td><td><strong>${p.name}</strong></td>
      <td style="color:#16a34a;font-weight:700">${fc(p.revenue)}</td>
      <td>${Number(p.cumulativePct).toFixed(1)}%</td>
      <td><span class="badge" style="${bs}">${p.abcClass}</span></td></tr>`;
  }).join('');
  return `<div class="note"><strong>${labels.classLabel}</strong> A = ${labels.classADesc} &nbsp;|&nbsp; B = ${labels.classBDesc} &nbsp;|&nbsp; C = ${labels.classCDesc}</div>`
    + statGrid([
      { label: labels.classA, value: abc.classACount, color: 'green',  sub: labels.classADesc },
      { label: labels.classB, value: abc.classBCount, color: 'blue',   sub: labels.classBDesc },
      { label: labels.classC, value: abc.classCCount, color: 'orange', sub: labels.classCDesc },
      { label: labels.totalRevenue, value: fc(abc.totalRevenue), color: 'purple' },
    ]) + (rows ? `<div class="sec">${labels.productClass}</div>` + tableHtml(['#', labels.product, labels.revenue, labels.cumulativePct, labels.abcClass], rows) : '');
}

function printPeakHours(ph: any, labels: any) {
  const maxH = Math.max(...Object.values(ph.byHour as Record<string,number>).map(Number), 1);
  const maxD = Math.max(...Object.values(ph.byDay  as Record<string,number>).map(Number), 1);
  const bars = Object.entries(ph.byHour as Record<string,number>).map(([h, count]) =>
    `<div class="bc"><div class="bf" style="height:${Math.round(Number(count)/maxH*78)}px"></div><div class="bl">${h}</div></div>`
  ).join('');
  const days = Object.entries(ph.byDay as Record<string,number>).map(([day, count]) =>
    `<div class="dc"><div class="dv">${count}</div><div class="dn">${day}</div>
    <div class="db"><div class="dbf" style="width:${Math.round(Number(count)/maxD*100)}%"></div></div></div>`
  ).join('');
  return statGrid([
    { label: labels.peakHour,    value: `${ph.peakHour}:00`, color: 'purple' },
    { label: labels.peakDay,     value: ph.peakDay, color: 'blue' },
    { label: labels.totalOrders, value: ph.totalOrders, color: 'green' },
  ]) + `<div class="sec">${labels.ordersByHour}</div><div class="bar-chart">${bars}</div>`
     + `<div class="sec">${labels.ordersByDay}</div><div class="day-grid">${days}</div>`;
}

function printCashier(cd: any, labels: any) {
  const rows = (cd.cashiers||[]).map((c: any) => {
    const vc = c.totalVariance < 0 ? 'color:#dc2626' : c.totalVariance > 0 ? 'color:#d97706' : 'color:#16a34a';
    const vs = c.totalVariance != null ? `${c.totalVariance<0?'−':'+'}${fc(Math.abs(c.totalVariance))}` : '—';
    return `<tr><td><strong>${c.name}</strong></td>
      <td style="color:#2563eb;font-weight:700">${c.orderCount}</td>
      <td style="color:#16a34a;font-weight:700">${fc(c.totalSales)}</td>
      <td>${fc(c.avgTicket)}</td>
      <td style="color:#dc2626">${fc(c.totalDiscount)}</td>
      <td style="${vc};font-weight:700">${vs}</td></tr>`;
  }).join('');
  return tableHtml([labels.cashier, labels.orders, labels.totalSales, labels.avgTicket, labels.totalDiscount, labels.cashVariance], rows);
}

function printTurnover(tv: any, labels: any) {
  const rows = Object.entries(tv.turnoverByTable||{}).sort(([,a],[,b]) => Number(b)-Number(a)).map(([table, count]) =>
    `<tr><td><strong>${table}</strong></td>
    <td style="color:#2563eb;font-weight:700">${count as number}</td>
    <td>${Number(tv.avgPerDayByTable?.[table]||0).toFixed(1)}x/day</td></tr>`
  ).join('');
  return statGrid([
    { label: labels.periodDays,       value: tv.periodDays, color: 'blue' },
    { label: labels.totalTableOrders, value: tv.totalTableOrders, color: 'green' },
    { label: labels.tablesTracked,    value: Object.keys(tv.turnoverByTable||{}).length, color: 'purple' },
  ]) + (rows ? `<div class="sec">${labels.turnoverByTable}</div>` + tableHtml([labels.table, labels.seatings, labels.avgPerDay], rows) : '');
}

/* ─────────────────────────────────────────────────────────────
   SHARED UI COMPONENTS
───────────────────────────────────────────────────────────── */
const today = new Date().toISOString().split('T')[0];
const TABS = [
  { id: 'dashboard',    label: '🏠 Dashboard' },
  { id: 'sales',        label: '💰 Sales' },
  { id: 'shifts',       label: '🔄 Shifts' },
  { id: 'gaming',       label: '🎮 Gaming' },
  { id: 'inventory',    label: '📦 Inventory' },
  { id: 'loyalty',      label: '⭐ Loyalty' },
  { id: 'top-products', label: '🏆 Top Products' },
  { id: 'profit',       label: '📈 Profit' },
  { id: 'abc',          label: '🔠 ABC Analysis' },
  { id: 'peak-hours',   label: '🕐 Peak Hours' },
  { id: 'cashier',      label: '👤 Cashier KPIs' },
  { id: 'turnover',     label: '🪑 Table Turnover' },
];

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
      <button onClick={onRun} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition text-sm">
        {loading ? '...' : '▶ Run'}
      </button>
    </div>
  );
}

function StatCard({ label, value, sub, color = 'blue' }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700', green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700', orange: 'bg-orange-50 text-orange-700',
    red: 'bg-red-50 text-red-700', amber: 'bg-amber-50 text-amber-700',
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
  if (!data || !Object.keys(data).length) return null;
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

function ExportBtn({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} title={disabled ? 'Load the report first' : 'Export as PDF'}
      className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition shadow-sm
        ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
      📄 Export PDF
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export default function ReportsPage() {
  const { t, isRTL } = useI18n();
  const role = useAppSelector(s => s.auth.role);
  const canSeeCustomerPhone = canViewCustomerPhones(role);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [from, setFrom] = useState(`${today}T00:00:00`);
  const [to, setTo]     = useState(`${today}T23:59:59`);
  const [query, setQuery] = useState({ from: `${today}T00:00:00`, to: `${today}T23:59:59` });

  const { data: dashRes,      isLoading: dashLoading } = useGetDashboardQuery(undefined, { pollingInterval: 30000 });
  const { data: salesRes,     isFetching: salesF }     = useGetSalesReportQuery(query,      { skip: activeTab !== 'sales' });
  const { data: shiftsRes,    isFetching: shiftsF }    = useGetShiftsReportQuery(query,     { skip: activeTab !== 'shifts' });
  const { data: gamingRes,    isFetching: gamingF }    = useGetGamingReportQuery(query,     { skip: activeTab !== 'gaming' });
  const { data: invRes }                               = useGetInventoryReportQuery(undefined, { skip: activeTab !== 'inventory' });
  const { data: loyaltyRes }                           = useGetLoyaltyReportQuery(undefined,  { skip: activeTab !== 'loyalty' });
  const { data: topProductsRes, isFetching: topPF }    = useGetTopProductsReportQuery(query,  { skip: activeTab !== 'top-products' });
  const { data: profitRes,    isFetching: profitF }    = useGetProfitReportQuery(query,     { skip: activeTab !== 'profit' });
  const { data: abcRes,       isFetching: abcF }       = useGetAbcAnalysisQuery(query,      { skip: activeTab !== 'abc' });
  const { data: peakRes,      isFetching: peakF }      = useGetPeakHoursQuery(query,        { skip: activeTab !== 'peak-hours' });
  const { data: cashierRes,   isFetching: cashierF }   = useGetCashierPerformanceQuery(query,{ skip: activeTab !== 'cashier' });
  const { data: turnoverRes,  isFetching: turnoverF }  = useGetTableTurnoverQuery(query,    { skip: activeTab !== 'turnover' });

  const dash    = dashRes?.data;
  const sales   = salesRes?.data;
  const shifts  = shiftsRes?.data;
  const gaming  = gamingRes?.data;
  const inv     = invRes?.data;
  const loyalty = loyaltyRes?.data;

  const runQuery = () => setQuery({ from, to });
  const period = `${new Date(query.from).toLocaleString('en-EG',{dateStyle:'medium',timeStyle:'short'})} → ${new Date(query.to).toLocaleString('en-EG',{dateStyle:'medium',timeStyle:'short'})}`;

  const hasData = useCallback(() => {
    const map: Record<string, boolean> = {
      dashboard: !!dash, sales: !!sales, shifts: !!shifts, gaming: !!gaming,
      inventory: !!inv, loyalty: !!loyalty, 'top-products': !!topProductsRes?.data,
      profit: !!profitRes?.data, abc: !!abcRes?.data, 'peak-hours': !!peakRes?.data,
      cashier: !!cashierRes?.data, turnover: !!turnoverRes?.data,
    };
    return map[activeTab] ?? false;
  }, [activeTab, dash, sales, shifts, gaming, inv, loyalty, topProductsRes, profitRes, abcRes, peakRes, cashierRes, turnoverRes]);

  const handleExport = useCallback(() => {
    const TAB_LABEL: Record<string, string> = {
      dashboard: t('reports.dashboard'), sales: t('reports.sales'), shifts: t('reports.shifts'),
      gaming: t('reports.gaming'), inventory: t('reports.inventory'), loyalty: t('reports.loyalty'),
      'top-products': t('reports.topProducts'), profit: t('reports.profit'),
      abc: t('reports.abc'), 'peak-hours': t('reports.peakHours'),
      cashier: t('reports.cashier'), turnover: t('reports.turnover'),
    };
    const title = TAB_LABEL[activeTab] || 'Report';
    // Build a labels map from t() so PDF print builders are fully translated
    const L = {
      // common
      totalRevenue: t('reports.totalRevenue'), totalOrders: t('reports.orderCount'),
      totalSales: t('shift.totalSales'), totalExpenses: t('shift.totalExpenses'),
      cashVariance: t('reports.cashVariance'), shifts: t('nav.shifts'),
      cashier: t('staff.cashier'), orders: t('reports.orderCount'),
      avgTicket: t('reports.avgTicket'), totalDiscount: t('reports.totalDiscount'),
      status: t('status'), category: t('inventory.category'), unit: t('inventory.unit'),
      item: t('receipt.item'), stock: t('inventory.currentStock'),
      avgCost: t('inventory.avgCost'), totalValue: t('total'),
      product: t('menu.productName'), qtySold: t('inventory.purchaseQty'),
      revenue: t('reports.totalRevenue'), phone: t('phone'),
      nameCol: t('name'), tier: t('crm.tier'), points: t('crm.points'),
      totalSpent: t('crm.totalSpent'), table: t('pos.table'),
      seatings: t('reports.seatings'), avgPerDay: t('reports.avgPerDay'),
      // sales
      paidOrders: t('reports.orderCount'), totalDiscounts: t('reports.totalDiscount'),
      revenueBySource: t('reports.revenueBySource'),
      // shifts
      shiftBreakdown: t('reports.shiftBreakdown'), opened: t('shift.openedAt'),
      closed: t('shift.closedAt'), sales: t('reports.sales'),
      expenses: t('expenses.title'), openingBal: t('shift.openingBalance'),
      variance: t('shift.variance'),
      // gaming
      sessions: t('gaming.sessionType'), totalHours: t('gaming.duration'),
      sessionsByDevice: t('reports.sessionsByDevice'), revenueByDevice: t('reports.revenueByDevice'),
      sessionsByType: t('reports.sessionsByType'),
      // inventory
      totalItems: t('reports.orderCount'), stockValue: t('inventory.currentStock'),
      lowStock: t('inventory.lowStock'), outOfStock: t('inventory.outOfStock'),
      valueByCategory: t('reports.valueByCategory'), itemDetail: t('reports.itemDetail'),
      // loyalty
      totalCustomers: t('crm.title'), pointsInCirculation: t('reports.activeSessions'),
      loyaltyLiability: t('settings.loyaltyProgram'), lifetimeSpend: t('crm.totalSpent'),
      customersByTier: t('crm.tier'), topSpenders: t('reports.topProducts'),
      // top products
      productsSold: t('reports.orderCount'), topProductsTitle: t('reports.topProductsTitle'),
      // profit
      avgOrderValue: t('reports.avgTicket'),
      revenueByPayment: t('reports.revenueByPayment'), revenueByOrderSrc: t('reports.revenueByOrderSrc'),
      // abc
      classA: t('reports.classA'), classB: t('reports.classB'), classC: t('reports.classC'),
      classLabel: t('reports.classLabel'), productClass: t('reports.productClass'),
      classADesc: 'top 70% revenue', classBDesc: 'next 20%', classCDesc: 'bottom 10%',
      cumulativePct: t('reports.cumulativePct'), abcClass: t('reports.abcClass'),
      // peak hours
      peakHour: t('reports.peakHour'), peakDay: t('reports.peakDay'),
      ordersByHour: t('reports.ordersByHour'), ordersByDay: t('reports.ordersByDay'),
      // turnover
      periodDays: t('reports.periodDays'), totalTableOrders: t('reports.seatings'),
      tablesTracked: t('floor.title'), turnoverByTable: t('reports.turnoverByTable'),
    };
    const builders: Record<string, () => string> = {
      dashboard:      () => printDashboard(dash!),
      sales:          () => printSales(sales!, L),
      shifts:         () => printShifts(shifts!, L),
      gaming:         () => printGaming(gaming!, L),
      inventory:      () => printInventory(inv!, L),
      loyalty:        () => printLoyalty(loyalty!, L, canSeeCustomerPhone),
      'top-products': () => printTopProducts(topProductsRes!.data, L),
      profit:         () => printProfit(profitRes!.data, L),
      abc:            () => printAbc(abcRes!.data, L),
      'peak-hours':   () => printPeakHours(peakRes!.data, L),
      cashier:        () => printCashier(cashierRes!.data, L),
      turnover:       () => printTurnover(turnoverRes!.data, L),
    };
    if (builders[activeTab]) {
      const usePeriod = !['dashboard','inventory','loyalty'].includes(activeTab);
      printReport(title, builders[activeTab](), usePeriod ? period : undefined);
    }
  }, [activeTab, canSeeCustomerPhone, dash, sales, shifts, gaming, inv, loyalty, topProductsRes, profitRes, abcRes, peakRes, cashierRes, turnoverRes, period, t]);

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">📊 Reports</h1>
        <ExportBtn onClick={handleExport} disabled={!hasData()} />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-white rounded-2xl shadow-sm p-1.5 flex-wrap">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition
              ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-4">

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <>
            {dashLoading ? <div className="text-slate-400 text-sm">Loading...</div> : dash ? (
              <>
                <div className="grid grid-cols-5 gap-3">
                  <StatCard label="Today's Sales"    value={formatCurrency(dash.todaySales || 0)} color="green" />
                  <StatCard label="Orders Today"     value={dash.todayOrderCount ?? 0}            color="blue" />
                  <StatCard label="Open Orders"      value={dash.openOrders ?? 0}                 color="amber" />
                  <StatCard label="Active Gaming"    value={dash.activeSessions ?? 0}             color="purple" />
                  <StatCard label="Low Stock Alerts" value={dash.lowStockAlerts ?? 0}             color="red" />
                </div>
                <div className="bg-white rounded-2xl shadow-sm p-5 text-center text-slate-400 text-sm">
                  Use the tabs above for detailed reports · Auto-refreshes every 30s
                </div>
              </>
            ) : null}
          </>
        )}

        {/* SALES */}
        {activeTab === 'sales' && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-bold text-slate-800 mb-4">💰 Sales Report</h2>
            <DateRange from={from} to={to} setFrom={setFrom} setTo={setTo} onRun={runQuery} loading={salesF} />
            {sales ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <StatCard label="Total Revenue"   value={formatCurrency(sales.totalRevenue || 0)}  color="green" />
                  <StatCard label="Paid Orders"     value={sales.orderCount || 0}                    color="blue" />
                  <StatCard label="Total Discounts" value={formatCurrency(sales.totalDiscount || 0)} color="orange" />
                </div>
                <BreakdownList title={t('reports.revenueBySource')} data={sales.revenueBySource} format={(v: number) => formatCurrency(v)} />
              </div>
            ) : <div className="text-center text-slate-400 py-12">{salesF ? 'Loading...' : 'Press ▶ Run to load the report'}</div>}
          </div>
        )}

        {/* SHIFTS */}
        {activeTab === 'shifts' && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-bold text-slate-800 mb-4">🔄 Shift Reconciliation Report</h2>
            <DateRange from={from} to={to} setFrom={setFrom} setTo={setTo} onRun={runQuery} loading={shiftsF} />
            {shifts ? (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <StatCard label="Shifts"         value={shifts.shiftCount || 0}                   color="blue" />
                  <StatCard label="Total Sales"    value={formatCurrency(shifts.totalSales || 0)}   color="green" />
                  <StatCard label="Total Expenses" value={formatCurrency(shifts.totalExpenses || 0)} color="orange" />
                  <StatCard label="Cash Variance"  value={formatCurrency(shifts.totalCashVariance || 0)}
                    color={Number(shifts.totalCashVariance) >= 0 ? 'green' : 'red'} />
                </div>
                {shifts.shifts?.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-slate-600 mb-2">{t('reports.shiftBreakdown')}</div>
                    <div className="overflow-auto rounded-2xl border border-slate-200">
                      <table className="w-full">
                        <thead className="bg-slate-50">
                          <tr>{['Cashier','Opened','Closed','Sales','Expenses','Opening Bal','Variance','Status'].map(h =>
                            <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                          )}</tr>
                        </thead>
                        <tbody>
                          {shifts.shifts.map((s: any) => (
                            <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                              <td className="px-3 py-2 font-medium text-slate-800 text-sm">{s.cashierName}</td>
                              <td className="px-3 py-2 text-xs text-slate-400">{s.createdAt ? new Date(s.createdAt).toLocaleString('en-EG',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'}</td>
                              <td className="px-3 py-2 text-xs text-slate-400">{s.closedAt  ? new Date(s.closedAt).toLocaleString('en-EG', {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'}</td>
                              <td className="px-3 py-2 font-bold text-green-700 text-sm">{formatCurrency(s.totalSales)}</td>
                              <td className="px-3 py-2 text-orange-600 text-sm">{formatCurrency(s.totalExpenses)}</td>
                              <td className="px-3 py-2 text-slate-500 text-sm">{formatCurrency(s.openingBalance)}</td>
                              <td className={`px-3 py-2 font-bold text-sm ${s.cashVariance>=0?'text-green-600':'text-red-600'}`}>
                                {s.cashVariance != null ? (s.cashVariance >= 0 ? '+' : '') + formatCurrency(s.cashVariance) : '—'}
                              </td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.status==='CLOSED'?'bg-slate-100 text-slate-500':'bg-green-100 text-green-700'}`}>
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
            ) : <div className="text-center text-slate-400 py-12">{shiftsF ? 'Loading...' : 'Press ▶ Run to load the report'}</div>}
          </div>
        )}

        {/* GAMING */}
        {activeTab === 'gaming' && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-bold text-slate-800 mb-4">🎮 Gaming Revenue Report</h2>
            <DateRange from={from} to={to} setFrom={setFrom} setTo={setTo} onRun={runQuery} loading={gamingF} />
            {gaming ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <StatCard label="Sessions"      value={gaming.sessionCount || 0}                                       color="purple" />
                  <StatCard label="Total Revenue" value={formatCurrency(gaming.totalRevenue || 0)}                       color="green" />
                  <StatCard label="Total Hours"   value={`${Math.floor((gaming.totalMinutes||0)/60)}h ${(gaming.totalMinutes||0)%60}m`} color="blue" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <BreakdownList title={t('reports.sessionsByDevice')} data={gaming.sessionsByDevice} />
                  <BreakdownList title={t('reports.revenueByDevice')}  data={gaming.revenueByDevice} format={(v:number) => formatCurrency(v)} />
                </div>
                <BreakdownList title={t('reports.sessionsByType')} data={gaming.sessionsByType} />
              </div>
            ) : <div className="text-center text-slate-400 py-12">{gamingF ? 'Loading...' : 'Press ▶ Run to load the report'}</div>}
          </div>
        )}

        {/* INVENTORY */}
        {activeTab === 'inventory' && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-bold text-slate-800 mb-4">📦 Inventory Value Report</h2>
            {inv ? (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <StatCard label="Total Items"  value={inv.totalItems || 0}                      color="blue" />
                  <StatCard label="Stock Value"  value={formatCurrency(inv.totalStockValue || 0)} color="green" />
                  <StatCard label="Low Stock"    value={inv.lowStockCount || 0}                    color="amber" />
                  <StatCard label="Out of Stock" value={inv.outOfStockCount || 0}                  color="red" />
                </div>
                <BreakdownList title={t('reports.valueByCategory')} data={inv.valueByCategory} format={(v:number) => formatCurrency(v)} />
                {inv.items?.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-slate-600 mb-2">{t('reports.itemDetail')}</div>
                    <div className="overflow-auto rounded-2xl border border-slate-200 max-h-96">
                      <table className="w-full">
                        <thead className="bg-slate-50 sticky top-0">
                          <tr>{['Item','Category','Stock','Unit','Avg Cost','Total Value','Status'].map(h =>
                            <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                          )}</tr>
                        </thead>
                        <tbody>
                          {[...inv.items].sort((a:any,b:any)=>(b.currentStock*b.averageCost)-(a.currentStock*a.averageCost)).map((item:any) => {
                            const val=item.currentStock*item.averageCost, isOut=item.currentStock<=0, isLow=item.currentStock<=item.reorderLevel;
                            return (
                              <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
                                <td className="px-3 py-2 font-medium text-slate-800 text-sm">{item.name}</td>
                                <td className="px-3 py-2 text-slate-400 text-xs">{item.category||'—'}</td>
                                <td className={`px-3 py-2 font-bold text-sm ${isOut?'text-red-600':isLow?'text-amber-600':'text-slate-800'}`}>{Number(item.currentStock).toFixed(2)}</td>
                                <td className="px-3 py-2 text-slate-400 text-xs">{item.unit}</td>
                                <td className="px-3 py-2 text-slate-500 text-sm">{formatCurrency(item.averageCost)}</td>
                                <td className="px-3 py-2 font-bold text-green-700 text-sm">{formatCurrency(val)}</td>
                                <td className="px-3 py-2">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isOut?'bg-red-100 text-red-600':isLow?'bg-amber-100 text-amber-600':'bg-green-100 text-green-700'}`}>
                                    {isOut?'⚠ Out':isLow?'⚠ Low':'✓ OK'}
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
            ) : <div className="text-center text-slate-400 py-12">Loading inventory data...</div>}
          </div>
        )}

        {/* LOYALTY */}
        {activeTab === 'loyalty' && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-bold text-slate-800 mb-4">⭐ Loyalty & Customer Report</h2>
            {loyalty ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <StatCard label="Total Customers"       value={loyalty.totalCustomers || 0}                              color="blue" />
                  <StatCard label="Points in Circulation" value={(loyalty.totalPointsInCirculation||0).toLocaleString()}   color="amber" sub="Loyalty liability" />
                  <StatCard label="Lifetime Spend"        value={formatCurrency(loyalty.totalLifetimeSpend||0)}            color="green" />
                </div>
                {loyalty.customersByTier && (
                  <div>
                    <div className="text-sm font-semibold text-slate-600 mb-2">{t('crm.tier')}</div>
                    <div className="grid grid-cols-4 gap-3">
                      {Object.entries(loyalty.customersByTier).map(([tier, count]) => (
                        <div key={tier} className="bg-slate-50 rounded-2xl p-4 text-center">
                          <div className="text-3xl mb-1">{TIER_ICON[tier]||'🏅'}</div>
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
                          <tr>{['#','Name', ...(canSeeCustomerPhone ? ['Phone'] : []), 'Tier','Points','Total Spent'].map(h =>
                            <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
                          )}</tr>
                        </thead>
                        <tbody>
                          {loyalty.topSpenders.map((c:any, i:number) => (
                            <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                              <td className="px-4 py-2.5 font-bold text-slate-400 text-sm">#{i+1}</td>
                              <td className="px-4 py-2.5 font-semibold text-slate-800 text-sm">{c.fullName}</td>
                              {canSeeCustomerPhone && <td className="px-4 py-2.5 text-slate-400 text-sm">{c.phone || '—'}</td>}
                              <td className="px-4 py-2.5 text-sm">{TIER_ICON[c.tier]||''} {c.tier}</td>
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
            ) : <div className="text-center text-slate-400 py-12">Loading loyalty data...</div>}
          </div>
        )}

        {/* TOP PRODUCTS */}
        {activeTab === 'top-products' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
            <h2 className="font-bold text-slate-700 text-lg">🏆 {t('reports.topProductsTitle')}</h2>
            <DateRange from={from} to={to} setFrom={setFrom} setTo={setTo} onRun={() => setQuery({from,to})} loading={topPF} />
            {topProductsRes?.data ? (() => { const tp = topProductsRes.data; return (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <StatCard label="Products Sold" value={tp.productCount||0}                  color="blue" />
                  <StatCard label="Total Revenue" value={formatCurrency(tp.totalRevenue||0)} color="green" />
                </div>
                {tp.topProducts?.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>{['#','Product','Qty Sold','Revenue'].map(h =>
                          <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
                        )}</tr>
                      </thead>
                      <tbody>
                        {tp.topProducts.map((p:any, i:number) => (
                          <tr key={p.name} className="border-t border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-2.5 font-bold text-slate-400 text-sm">#{i+1}</td>
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
            ); })() : <div className="text-center text-slate-400 py-12">{t('reports.selectRange')}</div>}
          </div>
        )}

        {/* PROFIT */}
        {activeTab === 'profit' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
            <h2 className="font-bold text-slate-700 text-lg">📈 Revenue & Profit Analysis</h2>
            <DateRange from={from} to={to} setFrom={setFrom} setTo={setTo} onRun={() => setQuery({from,to})} loading={profitF} />
            {profitRes?.data ? (() => { const pf = profitRes.data; return (
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-4">
                  <StatCard label="Total Revenue"   value={formatCurrency(pf.totalRevenue||0)}       color="green" />
                  <StatCard label="Total Orders"    value={pf.totalOrders||0}                        color="blue" />
                  <StatCard label="Avg Order Value" value={formatCurrency(pf.averageOrderValue||0)}  color="purple" />
                </div>
                <BreakdownList title={t('reports.revenueByPayment')} data={pf.revenueByPaymentMethod} format={(v:any) => formatCurrency(v)} />
                <BreakdownList title={t('reports.revenueByOrderSrc')}   data={pf.revenueBySource}        format={(v:any) => formatCurrency(v)} />
              </div>
            ); })() : <div className="text-center text-slate-400 py-12">{t('reports.selectRange')}</div>}
          </div>
        )}

        {/* ABC */}
        {activeTab === 'abc' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
            <h2 className="font-bold text-slate-700 text-lg">🔠 ABC Product Analysis</h2>
            <p className="text-sm text-slate-500">Classifies products: A = top 70% revenue, B = next 20%, C = bottom 10%</p>
            <DateRange from={from} to={to} setFrom={setFrom} setTo={setTo} onRun={() => setQuery({from,to})} loading={abcF} />
            {abcRes?.data ? (() => { const abc = abcRes.data; return (
              <div className="space-y-5">
                <div className="grid grid-cols-4 gap-4">
                  <StatCard label="Class A Products" value={abc.classACount} color="green"  sub="Top revenue drivers" />
                  <StatCard label="Class B Products" value={abc.classBCount} color="blue"   sub="Mid-tier revenue" />
                  <StatCard label="Class C Products" value={abc.classCCount} color="orange" sub="Low / candidates for removal" />
                  <StatCard label="Total Revenue"    value={formatCurrency(abc.totalRevenue)} color="purple" />
                </div>
                <div className="overflow-auto">
                  <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-slate-50">
                      <tr>{['#','Product','Revenue','Cumulative %','Class'].map(h =>
                        <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-slate-500">{h}</th>
                      )}</tr>
                    </thead>
                    <tbody>
                      {abc.products?.map((p:any, i:number) => (
                        <tr key={p.name} className={`border-t border-slate-100 hover:bg-slate-50 ${p.abcClass==='A'?'bg-green-50/40':p.abcClass==='B'?'bg-blue-50/40':'bg-orange-50/30'}`}>
                          <td className="px-4 py-2.5 text-slate-400 text-xs">#{i+1}</td>
                          <td className="px-4 py-2.5 font-semibold text-slate-800">{p.name}</td>
                          <td className="px-4 py-2.5 text-green-700 font-bold">{formatCurrency(p.revenue)}</td>
                          <td className="px-4 py-2.5 text-slate-600">{Number(p.cumulativePct).toFixed(1)}%</td>
                          <td className="px-4 py-2.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${p.abcClass==='A'?'bg-green-100 text-green-700':p.abcClass==='B'?'bg-blue-100 text-blue-700':'bg-orange-100 text-orange-600'}`}>
                              {p.abcClass}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ); })() : <div className="text-center text-slate-400 py-12">{t('reports.selectRange')}</div>}
          </div>
        )}

        {/* PEAK HOURS */}
        {activeTab === 'peak-hours' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
            <h2 className="font-bold text-slate-700 text-lg">🕐 Peak Hours Heatmap</h2>
            <DateRange from={from} to={to} setFrom={setFrom} setTo={setTo} onRun={() => setQuery({from,to})} loading={peakF} />
            {peakRes?.data ? (() => { const ph = peakRes.data;
              const maxH = Math.max(...Object.values(ph.byHour as Record<string,number>).map(Number),1);
              const maxD = Math.max(...Object.values(ph.byDay  as Record<string,number>).map(Number),1);
              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <StatCard label="Peak Hour"    value={`${ph.peakHour}:00`} color="purple" />
                    <StatCard label="Peak Day"     value={ph.peakDay}           color="blue" />
                    <StatCard label="Total Orders" value={ph.totalOrders}       color="green" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-600 mb-3 text-sm">{t('reports.ordersByHour')}</h3>
                    <div className="flex gap-1 items-end h-24">
                      {Object.entries(ph.byHour as Record<string,number>).map(([h, count]) => (
                        <div key={h} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full rounded-t bg-blue-500 transition-all"
                            style={{height:`${(Number(count)/maxH)*80}px`, minHeight:Number(count)>0?'4px':'0'}}
                            title={`${h}:00 — ${count} orders`} />
                          <span className="text-xs text-slate-400">{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-600 mb-3 text-sm">{t('reports.ordersByDay')}</h3>
                    <div className="grid grid-cols-7 gap-2">
                      {Object.entries(ph.byDay as Record<string,number>).map(([day, count]) => (
                        <div key={day} className="text-center">
                          <div className="font-bold text-lg text-blue-600">{count as number}</div>
                          <div className="text-xs text-slate-500">{day}</div>
                          <div className="mt-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{width:`${(Number(count)/maxD)*100}%`}} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })() : <div className="text-center text-slate-400 py-12">{t('reports.selectRange')}</div>}
          </div>
        )}

        {/* CASHIER */}
        {activeTab === 'cashier' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
            <h2 className="font-bold text-slate-700 text-lg">👤 Cashier Performance</h2>
            <DateRange from={from} to={to} setFrom={setFrom} setTo={setTo} onRun={() => setQuery({from,to})} loading={cashierF} />
            {cashierRes?.data ? (() => { const cd = cashierRes.data; return (
              <div className="overflow-auto">
                <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-50">
                    <tr>{['Cashier','Orders','Total Sales','Avg Ticket','Total Discount','Cash Variance'].map(h =>
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500">{h}</th>
                    )}</tr>
                  </thead>
                  <tbody>
                    {cd.cashiers?.map((c:any) => (
                      <tr key={c.name} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-800">{c.name}</td>
                        <td className="px-4 py-3 text-blue-600 font-bold">{c.orderCount}</td>
                        <td className="px-4 py-3 text-green-700 font-bold">{formatCurrency(c.totalSales)}</td>
                        <td className="px-4 py-3 text-slate-600">{formatCurrency(c.avgTicket)}</td>
                        <td className="px-4 py-3 text-red-500">{formatCurrency(c.totalDiscount)}</td>
                        <td className="px-4 py-3">
                          {c.totalVariance != null
                            ? <span className={`font-bold ${c.totalVariance<0?'text-red-600':c.totalVariance>0?'text-amber-600':'text-green-600'}`}>
                                {c.totalVariance<0?'−':'+'}{formatCurrency(Math.abs(c.totalVariance))}
                              </span>
                            : <span className="text-slate-400">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ); })() : <div className="text-center text-slate-400 py-12">{t('reports.selectRange')}</div>}
          </div>
        )}

        {/* TURNOVER */}
        {activeTab === 'turnover' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
            <h2 className="font-bold text-slate-700 text-lg">🪑 Table Turnover Rate</h2>
            <DateRange from={from} to={to} setFrom={setFrom} setTo={setTo} onRun={() => setQuery({from,to})} loading={turnoverF} />
            {turnoverRes?.data ? (() => { const tv = turnoverRes.data; return (
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-4">
                  <StatCard label="Period (days)"      value={tv.periodDays}                                    color="blue" />
                  <StatCard label="Total Table Orders" value={tv.totalTableOrders}                              color="green" />
                  <StatCard label="Tables Tracked"     value={Object.keys(tv.turnoverByTable||{}).length}      color="purple" />
                </div>
                <div className="overflow-auto">
                  <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-slate-50">
                      <tr>{['Table','Total Seatings','Avg per Day'].map(h =>
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500">{h}</th>
                      )}</tr>
                    </thead>
                    <tbody>
                      {Object.entries(tv.turnoverByTable||{}).sort(([,a],[,b])=>Number(b)-Number(a)).map(([table, count]) => (
                        <tr key={table} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3 font-bold text-slate-800">{table}</td>
                          <td className="px-4 py-3 text-blue-600 font-bold">{count as number}</td>
                          <td className="px-4 py-3 text-slate-600">{Number(tv.avgPerDayByTable?.[table]||0).toFixed(1)}x/day</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ); })() : <div className="text-center text-slate-400 py-12">{t('reports.selectRange')}</div>}
          </div>
        )}

      </div>
    </div>
  );
}
