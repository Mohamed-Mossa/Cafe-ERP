import { useI18n } from '../../../i18n';
import { useState } from 'react';
import { useAppSelector } from '../../../app/hooks';
import { baseApi } from '../../../app/baseApi';
import { formatCurrency } from '../../../utils/currency';
import { canViewCustomerPhones, customerPhoneHiddenLabel } from '../../../utils/customerPrivacy';

const debtApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getAllCustomers: b.query<any, void>({ query: () => '/customers?size=1000', providesTags: ['CRM'] }),
    topUpCredit: b.mutation<any, { id: string; amount: number; note?: string }>({
      query: ({ id, amount, note }) => ({ url: `/customers/${id}/topup`, method: 'POST', body: { amount, note } }),
      invalidatesTags: ['CRM'],
    }),
    setCreditLimit: b.mutation<any, { id: string; creditLimit: number }>({
      query: ({ id, creditLimit }) => ({ url: `/customers/${id}/credit-limit`, method: 'PUT', body: { creditLimit } }),
      invalidatesTags: ['CRM'],
    }),
  }),
  overrideExisting: false,
});

const { useGetAllCustomersQuery, useTopUpCreditMutation, useSetCreditLimitMutation } = debtApi;

export default function DebtManagementPage() {
  const { t, isRTL } = useI18n();
  const role = useAppSelector(s => s.auth.role);
  const canSeeCustomerPhone = canViewCustomerPhones(role);
  const hiddenPhoneLabel = customerPhoneHiddenLabel(isRTL);
  const { data: custsRes, isLoading } = useGetAllCustomersQuery(undefined, { pollingInterval: 30000 });
  const [topUpCredit] = useTopUpCreditMutation();
  const [setCreditLimit] = useSetCreditLimitMutation();

  const [search, setSearch] = useState('');
  const [topUpModal, setTopUpModal] = useState<any>(null);
  const [topUpForm, setTopUpForm] = useState({ amount: '', note: '' });
  const [limitModal, setLimitModal] = useState<any>(null);
  const [limitForm, setLimitForm] = useState({ creditLimit: '' });
  const [msg, setMsg] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'debt' | 'credit'>('debt');

  const allCustomers: any[] = custsRes?.data?.customers || custsRes?.data || [];
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  // creditBalance < 0 = customer owes the cafe (real debt, allowed down to -creditLimit)
  // creditBalance > 0 = customer has pre-paid credit (wallet)
  const filtered = allCustomers
    .filter(c => {
      if (filterMode === 'debt') return c.creditBalance < 0;
      if (filterMode === 'credit') return c.creditBalance > 0;
      return true;
    })
    .filter(c => !search || c.fullName?.toLowerCase().includes(search.toLowerCase()) || (canSeeCustomerPhone && c.phone?.includes(search)))
    .sort((a, b) => a.creditBalance - b.creditBalance); // most negative first

  const totalDebt = allCustomers.filter(c => c.creditBalance < 0).reduce((s, c) => s + Math.abs(c.creditBalance), 0);
  const totalCredit = allCustomers.filter(c => c.creditBalance > 0).reduce((s, c) => s + c.creditBalance, 0);
  const debtors = allCustomers.filter(c => c.creditBalance < 0).length;
  const creditHolders = allCustomers.filter(c => c.creditBalance > 0).length;

  const handleTopUp = async () => {
    if (!topUpModal || !topUpForm.amount) return;
    try {
      await topUpCredit({ id: topUpModal.id, amount: parseFloat(topUpForm.amount), note: topUpForm.note }).unwrap();
      setTopUpModal(null);
      setTopUpForm({ amount: '', note: '' });
      flash(`✅ ${t('saved')}`);
    } catch (e: any) { flash('❌ ' + (e?.data?.message || t('failed'))); }
  };

  const handleSetLimit = async () => {
    if (!limitModal || !limitForm.creditLimit) return;
    try {
      await setCreditLimit({ id: limitModal.id, creditLimit: parseFloat(limitForm.creditLimit) }).unwrap();
      setLimitModal(null);
      setLimitForm({ creditLimit: '' });
      flash(`✅ ${t('saved')}`);
    } catch (e: any) { flash('❌ ' + (e?.data?.message || 'Failed')); }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-800">{t('debt.title')}</h1>
        {msg && <span className={`text-xs px-3 py-1.5 rounded-full ${msg.startsWith('❌') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>{msg}</span>}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-red-50 rounded-xl p-3">
          <div className="text-xs text-red-500 font-medium">{t('debt.totalDebt')}</div>
          <div className="text-2xl font-black text-red-700">{formatCurrency(totalDebt)}</div>
          <div className="text-xs text-red-400">{debtors} {t('debt.inDebt')}</div>
        </div>
        <div className="bg-green-50 rounded-xl p-3">
          <div className="text-xs text-green-600 font-medium">{t('debt.totalCredit')}</div>
          <div className="text-2xl font-black text-green-700">{formatCurrency(totalCredit)}</div>
          <div className="text-xs text-green-500">{creditHolders} customers with credit</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-3">
          <div className="text-xs text-blue-500 font-medium">{t('debt.netPosition')}</div>
          <div className={`text-2xl font-black ${totalCredit - totalDebt >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {formatCurrency(totalCredit - totalDebt)}
          </div>
          <div className="text-xs text-blue-400">{t('debt.netPosition')}</div>
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="text-xs text-slate-500 font-medium">{t('debt.totalCustomers')}</div>
          <div className="text-2xl font-black text-slate-700">{allCustomers.length}</div>
          <div className="text-xs text-slate-400">in system</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 items-center">
        <div className="flex rounded-xl border border-slate-200 overflow-hidden">
          {([['debt','🔴 In Debt'],['credit','🟢 Has Credit'],['all','All']] as const).map(([val, label]) => (
            <button key={val} onClick={() => setFilterMode(val)}
              className={`px-4 py-2 text-xs font-semibold transition ${filterMode === val ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
              {label}
            </button>
          ))}
        </div>
        <input placeholder={canSeeCustomerPhone ? '🔍 Search by name or phone...' : '🔍 Search by name...'} value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
        <span className="text-sm text-slate-500 font-medium">{filtered.length} customers</span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="text-center text-slate-400 py-12">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-slate-400 py-12">
            {filterMode === 'debt' ? t('debt.noDebtors') : 'No customers found'}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {[
                    'Customer',
                    ...(canSeeCustomerPhone ? ['Phone'] : []),
                    'Tier',
                    'Total Spent',
                    'Credit Balance',
                    'Limit',
                    'Status',
                    'Actions',
                  ].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c: any) => {
                  const balance = c.creditBalance || 0;
                  const limit = c.creditLimit || 0;
                  const isDebt = balance < 0;
                  const isLow = limit > 0 && balance < limit * 0.2;
                  return (
                    <tr key={c.id} className={`border-b border-slate-100 hover:bg-slate-50 ${isDebt ? 'bg-red-50/30' : ''}`}>
                      <td className="px-4 py-3 font-semibold text-slate-800">{c.fullName}</td>
                      {canSeeCustomerPhone && <td className="px-4 py-3 text-slate-500">{c.phone || '—'}</td>}
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          c.tier === 'GOLD' ? 'bg-yellow-100 text-yellow-700' :
                          c.tier === 'SILVER' ? 'bg-slate-100 text-slate-600' :
                          c.tier === 'PLATINUM' ? 'bg-purple-100 text-purple-700' :
                          'bg-orange-100 text-orange-600'}`}>
                          {c.tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatCurrency(c.totalSpent || 0)}</td>
                      <td className="px-4 py-3">
                        <span className={`font-black text-base ${isDebt ? 'text-red-600' : balance > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                          {isDebt ? '−' : ''}{formatCurrency(Math.abs(balance))}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{limit > 0 ? formatCurrency(limit) : '—'}</td>
                      <td className="px-4 py-3">
                        {isDebt ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">⚠️ In Debt</span>
                        ) : isLow && balance >= 0 ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 font-medium">⚠️ Low Credit</span>
                        ) : balance > 0 ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-600 font-medium">✅ Has Credit</span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => { setTopUpModal(c); setTopUpForm({ amount: '', note: '' }); }}
                            className="text-xs px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition">
                            💳 Adjust Credit
                          </button>
                          <button onClick={() => { setLimitModal(c); setLimitForm({ creditLimit: String(c.creditLimit || 0) }); }}
                            className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-medium transition">
                            🔒 Set Limit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Up / Adjust Credit Modal */}
      {topUpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="font-bold text-lg mb-2">💳 Adjust Credit</h2>
            <div className="bg-slate-50 rounded-xl p-3 mb-4">
              <div className="font-bold text-slate-800">{topUpModal.fullName}</div>
              <div className="text-sm text-slate-500">{canSeeCustomerPhone ? (topUpModal.phone || '—') : hiddenPhoneLabel}</div>
              <div className="mt-2 flex gap-4">
                <div>
                  <div className="text-xs text-slate-400">{t('debt.currentBalance')}</div>
                  <div className={`font-black text-lg ${(topUpModal.creditBalance || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(topUpModal.creditBalance || 0)}
                  </div>
                </div>
                {topUpModal.creditLimit > 0 && (
                  <div>
                    <div className="text-xs text-slate-400">{t('debt.limit')}</div>
                    <div className="font-bold text-slate-700">{formatCurrency(topUpModal.creditLimit)}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Amount (EGP) — use negative to record debt repayment</label>
                <input type="number" placeholder="e.g. 100 to add, -50 to deduct" value={topUpForm.amount}
                  onChange={e => setTopUpForm(p => ({ ...p, amount: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <textarea placeholder={`${t('debt.noteOptional')}...`} value={topUpForm.note}
                onChange={e => setTopUpForm(p => ({ ...p, note: e.target.value }))}
                rows={2} className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm resize-none" />
            </div>
            {topUpForm.amount && (
              <div className="mt-3 bg-blue-50 rounded-xl p-3 text-sm">
                <span className="text-blue-700">{t('debt.newBalance')}</span>
                <span className="font-black text-blue-800">
                  {formatCurrency((topUpModal.creditBalance || 0) + parseFloat(topUpForm.amount || '0'))}
                </span>
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setTopUpModal(null); setTopUpForm({ amount: '', note: '' }); }}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 text-sm">{t('cancel')}</button>
              <button onClick={handleTopUp} disabled={!topUpForm.amount}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold rounded-xl text-sm">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Credit Limit Modal */}
      {limitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="font-bold text-lg mb-1">🔒 Set Credit Limit</h2>
            <p className="text-xs text-slate-500 mb-4">
              Max debt this customer can accumulate. Set to 0 to disable credit purchases.
            </p>
            <div className="bg-slate-50 rounded-xl p-3 mb-4">
              <div className="font-bold text-slate-800">{limitModal.fullName}</div>
              <div className="text-sm text-slate-500">{canSeeCustomerPhone ? (limitModal.phone || '—') : hiddenPhoneLabel}</div>
              <div className="mt-2">
                <div className="text-xs text-slate-400">{t('debt.currentBalance')}</div>
                <div className={`font-black text-lg ${(limitModal.creditBalance || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(limitModal.creditBalance || 0)}
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="text-xs text-slate-500 font-medium mb-1 block">Credit Limit (EGP)</label>
              <input
                type="number" min="0" step="50"
                value={limitForm.creditLimit}
                onChange={e => setLimitForm(f => ({ ...f, creditLimit: e.target.value }))}
                placeholder="e.g. 500"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <p className="text-xs text-slate-400 mt-1">
                Customer can owe up to this amount. Their balance can go from 0 down to −{limitForm.creditLimit || '0'} EGP.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setLimitModal(null); setLimitForm({ creditLimit: '' }); }}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 text-sm">{t('cancel')}</button>
              <button onClick={handleSetLimit} disabled={limitForm.creditLimit === ''}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-800 disabled:bg-slate-200 text-white font-bold rounded-xl text-sm">
                Save Limit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
