import { useI18n } from '../../../i18n';
import { useState } from 'react';
import { baseApi } from '../../../app/baseApi';
import { formatCurrency } from '../../../utils/currency';

const shiftApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getCurrentShift: b.query<any, void>({ query: () => '/shifts/current', providesTags: ['Shift'] }),
    openShift: b.mutation<any, { openingBalance: number }>({
      query: (body) => ({ url: '/shifts/open', method: 'POST', body }), invalidatesTags: ['Shift'],
    }),
    closeShift: b.mutation<any, { shiftId: string; actualCash: number; closingNotes?: string }>({
      query: ({ shiftId, ...body }) => ({ url: `/shifts/${shiftId}/close`, method: 'POST', body }), invalidatesTags: ['Shift'],
    }),
    addExpense: b.mutation<any, { shiftId: string; description: string; amount: number; category?: string }>({
      query: ({ shiftId, ...body }) => ({ url: `/shifts/${shiftId}/expenses`, method: 'POST', body }), invalidatesTags: ['Shift'],
    }),
    getExpenses: b.query<any, string>({ query: (id) => `/shifts/${id}/expenses`, providesTags: ['Shift'] }),
    getShiftHistory: b.query<any, void>({ query: () => '/shifts/history', providesTags: ['Shift'] }),
  }), overrideExisting: false,
});
const { useGetCurrentShiftQuery, useOpenShiftMutation, useCloseShiftMutation, useAddExpenseMutation, useGetExpensesQuery, useGetShiftHistoryQuery } = shiftApi;

const EXPENSE_CATEGORIES = ['Supplies', 'Utilities', 'Maintenance', 'Transport', 'Food & Bev', 'Other'];

export default function ShiftPage() {
  const { t, isRTL } = useI18n();
  const { data: shiftRes, isLoading } = useGetCurrentShiftQuery();
  const { data: historyRes } = useGetShiftHistoryQuery();
  const [openShift] = useOpenShiftMutation();
  const [closeShift] = useCloseShiftMutation();
  const [addExpense] = useAddExpenseMutation();

  const [openingBalance, setOpeningBalance] = useState('');
  const [actualCash, setActualCash] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('');
  const [showClose, setShowClose] = useState(false);
  const [closedResult, setClosedResult] = useState<any>(null);
  const [tab, setTab] = useState<'current' | 'history'>('current');

  const shift = shiftRes?.data;
  const history = historyRes?.data || [];
  const { data: expensesRes } = useGetExpensesQuery(shift?.id, { skip: !shift?.id });
  const expenses = expensesRes?.data || [];

  const handleOpen = async () => {
    if (!openingBalance) return;
    try {
      await openShift({ openingBalance: parseFloat(openingBalance) }).unwrap();
      setOpeningBalance('');
    } catch (e: any) {
      alert(e?.data?.message || t('failed'));
    }
  };

  const handleClose = async () => {
    if (!shift || !actualCash) return;
    try {
      const res = await closeShift({ shiftId: shift.id, actualCash: parseFloat(actualCash), closingNotes }).unwrap();
      setClosedResult(res?.data || res);
      setShowClose(false);
    } catch (e: any) { alert(e?.data?.message || t('failed')); }
  };

  const handleAddExpense = async () => {
    if (!shift || !expDesc || !expAmount) return;
    try {
      await addExpense({ shiftId: shift.id, description: expDesc, amount: parseFloat(expAmount), category: expCategory }).unwrap();
      setExpDesc(''); setExpAmount(''); setExpCategory('');
    } catch (e: any) { alert(e?.data?.message || t('failed')); }
  };

  if (isLoading) return <div className="flex items-center justify-center h-full text-slate-400">Loading...</div>;

  // Closed result screen
  if (closedResult) {
    const variance = closedResult.cashVariance ?? (closedResult.actualCash - closedResult.expectedCash);
    const isOver = variance > 0;
    const isShort = variance < 0;
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="text-5xl mb-2">🔒</div>
            <h2 className="text-2xl font-black text-slate-800">{t('shift.closedAt')}</h2>
            <p className="text-slate-500 text-sm mt-1">{closedResult.cashierName}</p>
          </div>
          <div className="space-y-3 mb-6">
            {[
              { label: 'Opening Balance', val: closedResult.openingBalance, color: 'slate' },
              { label: 'Total Sales', val: closedResult.totalSales, color: 'green' },
              { label: 'Total Expenses', val: closedResult.totalExpenses, color: 'red' },
              { label: 'Expected Cash', val: closedResult.expectedCash, color: 'blue' },
              { label: 'Actual Cash (Counted)', val: closedResult.actualCash, color: 'purple' },
            ].map(({ label, val, color }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-500">{label}</span>
                <span className={`font-bold text-${color}-700`}>{formatCurrency(val ?? 0)}</span>
              </div>
            ))}
            <div className={`flex justify-between items-center py-3 px-4 rounded-xl ${
              isShort ? 'bg-red-50 border-2 border-red-300' : isOver ? 'bg-yellow-50 border-2 border-yellow-300' : 'bg-green-50 border-2 border-green-300'
            }`}>
              <span className="font-bold text-slate-700">{t('shift.variance')}</span>
              <div className="text-right">
                <div className={`text-xl font-black ${isShort ? 'text-red-600' : isOver ? 'text-yellow-600' : 'text-green-600'}`}>
                  {variance > 0 ? '+' : ''}{formatCurrency(Math.abs(variance))}
                </div>
                <div className="text-xs font-medium mt-0.5">
                  {isShort ? '⚠️ Short' : isOver ? '↑ Over' : '✓ Balanced'}
                </div>
              </div>
            </div>
          </div>
          {closedResult.closingNotes && (
            <div className="bg-slate-50 rounded-xl p-3 mb-4 text-sm text-slate-600">
              <span className="font-semibold">{t('notes')}: </span>{closedResult.closingNotes}
            </div>
          )}
          <button onClick={() => setClosedResult(null)} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl">
            Done
          </button>
        </div>
      </div>
    );
  }

  if (!shift) return (
    <div className="flex items-center justify-center h-full">
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-sm text-center">
        <div className="text-5xl mb-4">🕐</div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">{t('shift.noActiveShift')}</h2>
        <p className="text-slate-500 text-sm mb-6">{t('shift.blindCloseHint')}</p>
        <input type="number" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)}
          placeholder="Opening balance (EGP)" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-center text-lg font-bold mb-4 outline-none focus:ring-2 focus:ring-blue-500" />
        <button onClick={handleOpen} disabled={!openingBalance}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl transition">
          ▶ Open Shift
        </button>
        {history.length > 0 && (
          <button onClick={() => setTab('history')} className="w-full mt-3 py-2 text-sm text-slate-500 hover:text-slate-700 underline">
            View past shifts →
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col gap-4 overflow-auto">
      {/* Tab switcher */}
      <div className="flex gap-2">
        {(['current', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition ${tab === t ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
            {t === 'current' ? '🕐 Current Shift' : '📋 History'}
          </button>
        ))}
      </div>

      {tab === 'current' && (
        <div className="flex gap-4">
          {/* Left: summary + expenses */}
          <div className="flex-1 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-bold text-lg text-slate-800">{t('shift.shiftOpen')}</div>
                  <div className="text-sm text-slate-500">{shift.cashierName} · Opened {new Date(shift.createdAt).toLocaleTimeString('en-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">● OPEN</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Opening Cash', val: shift.openingBalance, color: 'slate' },
                  { label: 'Sales Today', val: shift.totalSales, color: 'green' },
                  { label: 'Expenses', val: shift.totalExpenses, color: 'red' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
                    <div className="text-xs text-slate-500 mb-1">{label}</div>
                    <div className={`font-bold text-${color}-700`}>{formatCurrency(val || 0)}</div>
                  </div>
                ))}
              </div>
              <div className="bg-blue-50 rounded-xl p-3 flex justify-between items-center mb-4">
                <span className="text-sm font-semibold text-blue-700">{t('shift.openingBalance')}</span>
                <span className="text-xl font-black text-blue-800">
                  {formatCurrency((shift.openingBalance || 0) + (shift.totalSales || 0) - (shift.totalExpenses || 0))}
                </span>
              </div>
              <button onClick={() => setShowClose(true)}
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition">
                🔒 Close Shift
              </button>
            </div>

            {/* Expenses */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="font-bold text-slate-800 mb-3">💸 Petty Expenses</h3>
              <div className="flex gap-2 mb-2">
                <input value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder="Description *"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                <input value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder={t('shift.amount')} type="number"
                  className="w-24 px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-2 mb-3">
                <select value={expCategory} onChange={e => setExpCategory(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">{t('shift.categoryOptional')}</option>
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button onClick={handleAddExpense} disabled={!expDesc || !expAmount}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white rounded-xl text-sm font-medium transition">Add</button>
              </div>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {expenses.length === 0
                  ? <p className="text-sm text-slate-400 text-center py-4">{t('noData')}</p>
                  : expenses.map((e: any) => (
                    <div key={e.id} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl text-sm">
                      <div>
                        <span className="text-slate-700 font-medium">{e.description}</span>
                        {e.category && <span className="ml-2 text-xs text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">{e.category}</span>}
                      </div>
                      <span className="font-bold text-red-600">−{formatCurrency(e.amount)}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">{t('shift.title')}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>{['Cashier','Opened','Closed','Sales','Expenses','Expected','Actual','Variance','Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((s: any) => {
                  const variance = s.cashVariance ?? (s.actualCash != null ? (s.actualCash - (s.expectedCash ?? 0)) : null);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{s.cashierName}</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(s.createdAt).toLocaleDateString('en-EG')} {new Date(s.createdAt).toLocaleTimeString('en-EG', {hour:'2-digit',minute:'2-digit'})}</td>
                      <td className="px-4 py-3 text-slate-500">{s.closedAt ? new Date(s.closedAt).toLocaleTimeString('en-EG', {hour:'2-digit',minute:'2-digit'}) : '—'}</td>
                      <td className="px-4 py-3 font-semibold text-green-700">{formatCurrency(s.totalSales)}</td>
                      <td className="px-4 py-3 text-red-600">{formatCurrency(s.totalExpenses)}</td>
                      <td className="px-4 py-3">{s.expectedCash != null ? formatCurrency(s.expectedCash) : '—'}</td>
                      <td className="px-4 py-3">{s.actualCash != null ? formatCurrency(s.actualCash) : '—'}</td>
                      <td className="px-4 py-3">
                        {variance != null ? (
                          <span className={`font-bold ${variance < 0 ? 'text-red-600' : variance > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {variance > 0 ? '+' : ''}{formatCurrency(Math.abs(variance))} {variance < 0 ? '⚠️' : variance > 0 ? '↑' : '✓'}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${s.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{s.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Blind Close Modal */}
      {showClose && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center mb-5">
              <div className="text-4xl mb-2">🔒</div>
              <h2 className="text-xl font-bold text-slate-800">{t('shift.actualCash')}</h2>
              <p className="text-sm text-slate-500 mt-1">Count your drawer and enter the total — the variance will be revealed after.</p>
            </div>
            <input type="number" value={actualCash} onChange={e => setActualCash(e.target.value)}
              placeholder="Total cash in drawer (EGP)"
              className="w-full px-4 py-4 rounded-xl border-2 border-slate-200 text-center text-2xl font-black mb-3 outline-none focus:border-blue-500" autoFocus />
            <textarea value={closingNotes} onChange={e => setClosingNotes(e.target.value)}
              placeholder={t('shift.closingNotesOpt')} rows={2}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm mb-4 outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            <div className="flex gap-3">
              <button onClick={() => setShowClose(false)} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-medium">{t('cancel')}</button>
              <button onClick={handleClose} disabled={!actualCash}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:bg-slate-300 text-white font-bold rounded-xl transition">
                Close & See Variance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
