import { useI18n } from '../../../i18n';
import { useState } from 'react';
import { baseApi } from '../../../app/baseApi';
import { useAppSelector } from '../../../app/hooks';
import { formatCurrency } from '../../../utils/currency';
import { canViewCustomerPhones, customerPhoneHiddenLabel } from '../../../utils/customerPrivacy';

const crmApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getAllCustomers: b.query<any, { page: number; search?: string; tier?: string }>({
      query: ({ page, search, tier }) =>
        `/customers?page=${page}&size=50${search ? `&search=${search}` : ''}${tier ? `&tier=${tier}` : ''}`,
      providesTags: ['CRM'],
    }),
    lookupCustomer: b.query<any, string>({ query: (phone) => `/customers/lookup?phone=${phone}`, providesTags: ['CRM'] }),
    createCustomer: b.mutation<any, any>({ query: (body) => ({ url: '/customers', method: 'POST', body }), invalidatesTags: ['CRM'] }),
    getCustomerById: b.query<any, string>({ query: (id) => `/customers/${id}`, providesTags: ['CRM'] }),
    redeemPoints: b.mutation<any, { id: string; points: number; description?: string }>({
      query: ({ id, ...body }) => ({ url: `/customers/${id}/redeem`, method: 'POST', body }), invalidatesTags: ['CRM'],
    }),
    topUpCredit: b.mutation<any, { id: string; amount: number; note?: string }>({ query: ({ id, ...body }) => ({ url: `/customers/${id}/topup`, method: 'POST', body }), invalidatesTags: ['CRM'] }),
    getPointHistory: b.query<any, string>({ query: (id) => `/customers/${id}/points` }),
    updateCustomer: b.mutation<any, { id: string } & any>({ query: ({ id, ...body }) => ({ url: `/customers/${id}`, method: 'PATCH', body }), invalidatesTags: ['CRM'] }),
  }),
  overrideExisting: false,
});
const { useGetAllCustomersQuery, useLookupCustomerQuery, useCreateCustomerMutation, useGetCustomerByIdQuery, useRedeemPointsMutation, useTopUpCreditMutation, useGetPointHistoryQuery, useUpdateCustomerMutation } = crmApi;

const TIER_STYLE: Record<string, string> = {
  BRONZE:   'bg-orange-50 text-orange-700 border-orange-200',
  SILVER:   'bg-slate-50 text-slate-600 border-slate-300',
  GOLD:     'bg-yellow-50 text-yellow-700 border-yellow-200',
  PLATINUM: 'bg-purple-50 text-purple-700 border-purple-200',
};
const TIER_ICON: Record<string, string> = { BRONZE: '🥉', SILVER: '🥈', GOLD: '⭐', PLATINUM: '💎' };

export default function CRMPage() {
  const { t, isRTL } = useI18n();
  const role = useAppSelector(s => s.auth.role);
  const canSeeCustomerPhone = canViewCustomerPhones(role);
  const hiddenPhoneLabel = customerPhoneHiddenLabel(isRTL);
  const [mode, setMode] = useState<'list' | 'profile'>('list');
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', phone: '', email: '' });
  const [showRedeem, setShowRedeem] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [redeemPoints, setRedeemPoints] = useState('');
  const [redeemDesc, setRedeemDesc] = useState('');
  const [createForm, setCreateForm] = useState({ phone: '', fullName: '', email: '' });
  const [msg, setMsg] = useState('');

  // Lookup mode  
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupSearch, setLookupSearch] = useState('');
  const { data: lookupRes } = useLookupCustomerQuery(lookupSearch, { skip: lookupSearch.length < 5 });

  const { data: allRes, isLoading } = useGetAllCustomersQuery({ page, search, tier: tierFilter });
  const { data: histRes } = useGetPointHistoryQuery(selectedCustomer?.id, { skip: !selectedCustomer?.id });
  const { data: liveCustomerRes } = useGetCustomerByIdQuery(selectedCustomer?.id, { skip: !selectedCustomer?.id || mode !== 'profile' });
  const liveCustomer = liveCustomerRes?.data ?? selectedCustomer;
  const [createCustomer] = useCreateCustomerMutation();
  const [updateCustomer] = useUpdateCustomerMutation();
  const [redeem, { isLoading: redeemLoading }] = useRedeemPointsMutation();
  const [topUpCredit] = useTopUpCreditMutation();

  const customers: any[] = allRes?.data?.customers || [];
  const total: number = allRes?.data?.total || 0;
  const pages: number = allRes?.data?.pages || 1;
  const pointHistory: any[] = histRes?.data || [];

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleCreateCustomer = async () => {
    if (!createForm.phone || !createForm.fullName) { flash(`❌ ${t('crm.fullName')} & ${t('phone')} ${t('required')}`); return; }
    try {
      await createCustomer(createForm).unwrap();
      setShowCreate(false);
      setCreateForm({ phone: '', fullName: '', email: '' });
      flash(`✅ ${t('saved')}`);
    } catch (e: any) { flash('❌ ' + (e?.data?.message || t('failed'))); }
  };

  const handleEditCustomer = async () => {
    if (!selectedCustomer || !editForm.fullName || (canSeeCustomerPhone && !editForm.phone)) return;
    try {
      const payload: any = { id: selectedCustomer.id, fullName: editForm.fullName, email: editForm.email };
      if (canSeeCustomerPhone) payload.phone = editForm.phone;
      const res = await updateCustomer(payload).unwrap();
      setSelectedCustomer(res.data);
      setShowEdit(false);
      flash(`✅ ${t('saved')}`);
    } catch (e: any) { flash('❌ ' + (e?.data?.message || t('failed'))); }
  };

  const handleRedeem = async () => {
    if (!selectedCustomer || !redeemPoints) return;
    try {
      await redeem({ id: selectedCustomer.id, points: parseInt(redeemPoints, 10), description: redeemDesc }).unwrap();
      setShowRedeem(false);
      setRedeemPoints('');
      flash(`✅ ${t('saved')}`);
    } catch (e: any) { flash('❌ ' + (e?.data?.message || t('failed'))); }
  };

  const handleTopUp = async () => {
    if (!selectedCustomer || !topUpAmount) return;
    try {
      await topUpCredit({ id: selectedCustomer.id, amount: parseFloat(topUpAmount) }).unwrap();
      setShowTopUp(false);
      setTopUpAmount('');
      flash(`✅ ${t('saved')}`);
    } catch (e: any) { flash('❌ ' + (e?.data?.message || 'Failed')); }
  };

  const openProfile = (c: any) => { setSelectedCustomer(c); setMode('profile'); };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">👥 Customers</h1>
        <div className="flex gap-2">
          {mode === 'profile' && (
            <button onClick={() => { setMode('list'); setSelectedCustomer(null); }}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 text-sm hover:bg-slate-50 transition">
              ← Back to list
            </button>
          )}
          <button onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-green-600 text-white font-medium rounded-xl text-sm hover:bg-green-700 transition">
            + New Customer
          </button>
        </div>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${msg.startsWith('❌') ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-700'}`}>
          {msg}
        </div>
      )}

      {/* ── LIST MODE ── */}
      {mode === 'list' && (
        <>
          <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-48">
              <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setPage(0); } }}
                placeholder={canSeeCustomerPhone ? '🔍 Search name or phone...' : '🔍 Search customer name...'}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <select value={tierFilter} onChange={e => { setTierFilter(e.target.value); setPage(0); }}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">{t('crm.allTiers')}</option>
              <option value="BRONZE">🥉 Bronze</option>
              <option value="SILVER">🥈 Silver</option>
              <option value="GOLD">⭐ Gold</option>
              <option value="PLATINUM">💎 Platinum</option>
            </select>
            <button onClick={() => { setSearch(searchInput); setPage(0); }}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition">
              Search
            </button>
            <span className="text-sm text-slate-400 ml-2">{total} customers</span>
          </div>

          <div className="flex-1 bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center text-slate-400">Loading...</div>
            ) : customers.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-400">{t('noData')}</div>
            ) : (
              <>
                <div className="flex-1 overflow-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 sticky top-0 z-10">
                      <tr>
                        {[
                          'Name',
                          ...(canSeeCustomerPhone ? ['Phone'] : []),
                          'Email',
                          'Tier',
                          'Points',
                          'Total Spent',
                          'Credit',
                          '',
                        ].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((c: any) => (
                        <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50 transition cursor-pointer"
                          onClick={() => openProfile(c)}>
                          <td className="px-4 py-3 font-semibold text-slate-800">{c.fullName}</td>
                          {canSeeCustomerPhone && <td className="px-4 py-3 text-sm text-slate-500">{c.phone || '—'}</td>}
                          <td className="px-4 py-3 text-sm text-slate-400">{c.email || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${TIER_STYLE[c.tier] || ''}`}>
                              {TIER_ICON[c.tier] || ''} {c.tier}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold text-blue-700">{c.totalPoints}</td>
                          <td className="px-4 py-3 font-semibold text-green-700">{formatCurrency(c.totalSpent)}</td>
                          <td className="px-4 py-3 text-purple-600">{formatCurrency(c.creditBalance)}</td>
                          <td className="px-4 py-3">
                            <button onClick={e => { e.stopPropagation(); openProfile(c); }}
                              className="text-xs px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium transition">
                              Profile →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                <div className="p-4 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
                  <span className="text-sm text-slate-400">Page {page + 1} of {pages}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                      className="px-3 py-1.5 border border-slate-200 rounded-xl text-sm disabled:opacity-40 hover:bg-slate-50 transition">← Prev</button>
                    <button onClick={() => setPage(p => p + 1)} disabled={page >= pages - 1}
                      className="px-3 py-1.5 border border-slate-200 rounded-xl text-sm disabled:opacity-40 hover:bg-slate-50 transition">Next →</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* ── PROFILE MODE ── */}
      {mode === 'profile' && selectedCustomer && (
        <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
          {/* Left: customer card */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-2xl font-black text-slate-800">{liveCustomer.fullName}</div>
                  <div className="text-slate-500 text-sm mt-0.5">{canSeeCustomerPhone ? (liveCustomer.phone || '—') : hiddenPhoneLabel}</div>
                  {liveCustomer.email && <div className="text-slate-400 text-xs">{liveCustomer.email}</div>}
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-bold border ${TIER_STYLE[liveCustomer.tier]}`}>
                  {TIER_ICON[liveCustomer.tier]} {liveCustomer.tier}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <div className="text-xs text-blue-500 mb-1">{t('crm.points')}</div>
                  <div className="text-3xl font-black text-blue-700">{liveCustomer.totalPoints}</div>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <div className="text-xs text-green-500 mb-1">{t('crm.totalSpent')}</div>
                  <div className="text-2xl font-bold text-green-700">{formatCurrency(liveCustomer.totalSpent)}</div>
                </div>
                <div className="bg-purple-50 rounded-xl p-3 text-center">
                  <div className="text-xs text-purple-500 mb-1">{t('crm.creditBalance')}</div>
                  <div className="text-2xl font-bold text-purple-700">{formatCurrency(liveCustomer.creditBalance)}</div>
                </div>
              </div>
              <button onClick={() => { setEditForm({ fullName: liveCustomer.fullName, phone: canSeeCustomerPhone ? (liveCustomer.phone || '') : '', email: liveCustomer.email || '' }); setShowEdit(true); }}
                className="mt-4 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-sm">
                ✏️ {t('crm.editCustomer')}
              </button>
              <button onClick={() => setShowRedeem(true)}
                disabled={liveCustomer.totalPoints < 1}
                className="mt-4 w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl transition text-sm">
                🎁 {t('crm.points')}
              </button>
              <button onClick={() => setShowTopUp(true)}
                className="mt-2 w-full py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl transition text-sm">
                💳 Top-Up Credit
              </button>
            </div>
          </div>

          {/* Right: points history */}
          <div className="col-span-2 bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 font-bold text-slate-800 flex-shrink-0">{t('crm.points')} {t('activityLog.title')}</div>
            {pointHistory.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-400">{t('noData')}</div>
            ) : (
              <div className="flex-1 overflow-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      {['Date', 'Description', 'Points', 'Balance After'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pointHistory.map((tx: any) => (
                      <tr key={tx.id} className="border-t border-slate-100">
                        <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleString('en-EG', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{tx.description}</td>
                        <td className={`px-4 py-3 font-bold text-sm ${tx.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.points > 0 ? '+' : ''}{tx.points}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">{tx.balanceAfter}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Create Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="font-bold text-lg mb-4">👤 New Customer</h2>
            <div className="space-y-3">
              {[{k:'phone',l:'Phone *',t:'tel'},{k:'fullName',l:'Full Name *',t:'text'},{k:'email',l:'Email',t:'email'}].map(({k,l,t}) => (
                <input key={k} type={t} placeholder={l}
                  value={(createForm as any)[k]}
                  onChange={e => setCreateForm(p => ({...p, [k]: e.target.value}))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 text-sm">{t('cancel')}</button>
              <button onClick={handleCreateCustomer} className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm">{t('create')}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Redeem Modal ── */}
      {showRedeem && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="font-bold text-lg mb-2">🎁 Redeem Points</h2>
            <p className="text-sm text-slate-400 mb-4">Available: <strong className="text-blue-600">{selectedCustomer.totalPoints} points</strong></p>
            <div className="space-y-3">
              <input type="number" placeholder={t('crm.pointsToRedeem')} value={redeemPoints}
                onChange={e => setRedeemPoints(e.target.value)} max={selectedCustomer.totalPoints}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-amber-400 text-center text-2xl font-bold" />
              <input placeholder={t('crm.descOptional')} value={redeemDesc}
                onChange={e => setRedeemDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-amber-400 text-sm" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowRedeem(false)} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 text-sm">{t('cancel')}</button>
              <button onClick={handleRedeem} disabled={redeemLoading || !redeemPoints}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 text-white font-bold rounded-xl text-sm">
                {redeemLoading ? '...' : 'Redeem'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Top-Up Credit Modal ── */}
      {showTopUp && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="font-bold text-lg mb-1 text-purple-700">💳 Top-Up Credit</h2>
            <p className="text-sm text-slate-400 mb-1">Customer: <strong>{selectedCustomer.fullName}</strong></p>
            <p className="text-sm text-slate-400 mb-4">Current balance: <strong className="text-purple-700">{formatCurrency(selectedCustomer.creditBalance)}</strong></p>
            <input type="number" placeholder={t('crm.topUpAmount')} value={topUpAmount}
              onChange={e => setTopUpAmount(e.target.value)} min="1"
              className="w-full px-3 py-3 rounded-xl border-2 border-slate-200 focus:border-purple-400 outline-none text-center text-2xl font-bold mb-4" autoFocus />
            <div className="flex gap-2">
              <button onClick={() => { setShowTopUp(false); setTopUpAmount(''); }}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 text-sm">{t('cancel')}</button>
              <button onClick={handleTopUp} disabled={!topUpAmount || parseFloat(topUpAmount) <= 0}
                className="flex-1 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-200 text-white font-bold rounded-xl text-sm">
                {t('crm.topUpCredit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEdit && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="font-bold text-lg mb-4">✏️ {t('crm.editCustomer')}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">{t('crm.fullName')} *</label>
                <input value={editForm.fullName} onChange={e => setEditForm(p => ({ ...p, fullName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              {canSeeCustomerPhone ? (
                <div>
                  <label className="text-xs text-slate-500 block mb-1">{t('phone')} *</label>
                  <input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              ) : (
                <div className="text-xs text-slate-400">{hiddenPhoneLabel}</div>
              )}
              <div>
                <label className="text-xs text-slate-500 block mb-1">{t('email')}</label>
                <input value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowEdit(false)}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 text-sm">{t('cancel')}</button>
              <button onClick={handleEditCustomer} disabled={!editForm.fullName || (canSeeCustomerPhone && !editForm.phone)}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold rounded-xl text-sm">{t('save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
