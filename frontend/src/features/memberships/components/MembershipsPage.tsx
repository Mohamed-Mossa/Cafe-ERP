import { useI18n } from '../../../i18n';
import { useState } from 'react';
import { baseApi } from '../../../app/baseApi';
import { formatCurrency } from '../../../utils/currency';
import { useAppSelector } from '../../../app/hooks';
import { canViewCustomerPhones, customerMetaText, customerPhoneHiddenLabel } from '../../../utils/customerPrivacy';

const memberApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getPackages: b.query<any, void>({ query: () => '/memberships/packages', providesTags: ['Membership'] }),
    createPackage: b.mutation<any, any>({ query: (body) => ({ url: '/memberships/packages', method: 'POST', body }), invalidatesTags: ['Membership'] }),
    updatePackage: b.mutation<any, { id: string } & any>({ query: ({ id, ...body }) => ({ url: `/memberships/packages/${id}`, method: 'PATCH', body }), invalidatesTags: ['Membership'] }),
    deletePackage: b.mutation<any, string>({ query: (id) => ({ url: `/memberships/packages/${id}`, method: 'DELETE' }), invalidatesTags: ['Membership'] }),
    searchCustomers: b.query<any, string>({ query: (q) => `/customers?search=${encodeURIComponent(q)}&size=20` }),
    getCustomerPackages: b.query<any, string>({ query: (id) => `/memberships/customers/${id}`, providesTags: ['Membership'] }),
    assignPackage: b.mutation<any, { customerId: string; packageId: string }>({
      query: ({ customerId, packageId }) => ({ url: `/memberships/customers/${customerId}/assign/${packageId}`, method: 'POST' }), invalidatesTags: ['Membership'],
    }),
  }),
  overrideExisting: false,
});

const { useGetPackagesQuery, useCreatePackageMutation, useUpdatePackageMutation,
  useDeletePackageMutation, useSearchCustomersQuery, useGetCustomerPackagesQuery, useAssignPackageMutation } = memberApi;

const DEVICE_TYPES = ['ANY', 'PS4', 'PS5'];
const SESSION_TYPES = ['ANY', 'SINGLE', 'MULTI'];
const BLANK_PKG = { name: '', description: '', deviceType: 'ANY', sessionType: 'ANY', hoursIncluded: '10', price: '', validityDays: '90' };

function PackageCard({ pkg, onEdit, onDelete, onAssign, canManage, t }: any) {
  const canSell = !!pkg.active;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-slate-800">{pkg.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{pkg.description}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${pkg.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
          {pkg.active ? 'Active' : 'Inactive'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm mb-4">
        <div className="bg-slate-50 rounded-xl p-2">
          <div className="text-xs text-slate-400">{t('gaming.duration')}</div>
          <div className="font-bold text-slate-800">{pkg.hoursIncluded}h</div>
        </div>
        <div className="bg-slate-50 rounded-xl p-2">
          <div className="text-xs text-slate-400">{t('price')}</div>
          <div className="font-bold text-green-700">{formatCurrency(pkg.price)}</div>
        </div>
        <div className="bg-slate-50 rounded-xl p-2">
          <div className="text-xs text-slate-400">{t('memberships.deviceType')}</div>
          <div className="font-semibold text-slate-700">{pkg.deviceType}</div>
        </div>
        <div className="bg-slate-50 rounded-xl p-2">
          <div className="text-xs text-slate-400">{t('memberships.validityDays')}</div>
          <div className="font-semibold text-slate-700">{pkg.validityDays} days</div>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onAssign(pkg)}
          disabled={!canSell}
          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold transition"
        >
          {canSell ? '🎁 Sell Package' : 'Inactive'}
        </button>
        {canManage && (
          <>
            <button onClick={() => onEdit(pkg)} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs transition">✏️</button>
            <button onClick={() => onDelete(pkg.id)} className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl text-xs transition">🗑</button>
          </>
        )}
      </div>
    </div>
  );
}

export default function MembershipsPage() {
  const { t, isRTL } = useI18n();
  const role = useAppSelector(s => s.auth.role);
  const canManage = ['OWNER', 'MANAGER'].includes(role || '');
  const canSeeCustomerPhone = canViewCustomerPhones(role);
  const hiddenPhoneLabel = customerPhoneHiddenLabel(isRTL);

  const { data: pkgsRes, isLoading } = useGetPackagesQuery();
  const [createPkg] = useCreatePackageMutation();
  const [updatePkg] = useUpdatePackageMutation();
  const [deletePkg] = useDeletePackageMutation();
  const [assignPkg] = useAssignPackageMutation();

  const [tab, setTab] = useState<'packages' | 'sell'>('packages');
  const [showForm, setShowForm] = useState(false);
  const [editPkg, setEditPkg] = useState<any>(null);
  const [form, setForm] = useState(BLANK_PKG);
  const [msg, setMsg] = useState('');
  const [assigningPkg, setAssigningPkg] = useState<any>(null);
  const [custSearch, setCustSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [viewCustomerId, setViewCustomerId] = useState<string | null>(null);

  const { data: custRes } = useSearchCustomersQuery(custSearch, { skip: custSearch.length < 2 });
  const { data: custPkgsRes } = useGetCustomerPackagesQuery(viewCustomerId!, { skip: !viewCustomerId });

  const packages = pkgsRes?.data || [];
  const customers = custRes?.data?.customers || custRes?.data || [];
  const custPackages = custPkgsRes?.data || [];

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const savePackage = async () => {
    try {
      if (editPkg) await updatePkg({ id: editPkg.id, ...form }).unwrap();
      else await createPkg(form).unwrap();
      setShowForm(false); setEditPkg(null); setForm(BLANK_PKG);
      flash(`✅ ${t('saved')}`);
    } catch { flash(`❌ ${t('failed')}`); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`${t('delete')}?`)) return;
    try { await deletePkg(id).unwrap(); flash(`✅ ${t('deleted')}`); } catch { flash(`❌ ${t('failed')}`); }
  };

  const handleAssign = async () => {
    if (!selectedCustomer || !assigningPkg) return;
    try {
      await assignPkg({ customerId: selectedCustomer.id, packageId: assigningPkg.id }).unwrap();
      // Keep customer selected so cashier can sell additional packages in the same session.
      // Only dismiss the modal and clear the modal-level search.
      setAssigningPkg(null); setCustSearch('');
      flash(`✅ ${assigningPkg.name} sold to ${selectedCustomer.fullName}`);
    } catch (e: any) { flash('❌ ' + (e?.data?.message || 'Failed')); }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-800">{t('memberships.title')}</h1>
        <div className="flex gap-2">
          {msg && <span className={`text-xs px-3 py-1.5 rounded-full ${msg.startsWith('❌') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>{msg}</span>}
          {canManage && (
            <button onClick={() => { setShowForm(true); setEditPkg(null); setForm(BLANK_PKG); }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition">
              + New Package
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['packages', 'sell'] as const).map(tabKey => (
          <button key={tabKey} onClick={() => setTab(tabKey)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition ${tab === tabKey ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {tabKey === 'packages' ? '📦 Package Catalogue' : '🔍 Customer Packages'}
          </button>
        ))}
      </div>

      {tab === 'packages' && (
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="text-center text-slate-400 py-12">Loading...</div>
          ) : packages.length === 0 ? (
            <div className="text-center text-slate-400 py-12">{t('memberships.noPackages')}</div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {packages.map((pkg: any) => (
                <PackageCard key={pkg.id} pkg={pkg} canManage={canManage} t={t}
                  onEdit={(p: any) => { setEditPkg(p); setForm({ name: p.name, description: p.description || '', deviceType: p.deviceType, sessionType: p.sessionType, hoursIncluded: String(p.hoursIncluded), price: String(p.price), validityDays: String(p.validityDays) }); setShowForm(true); }}
                  onDelete={handleDelete}
                  onAssign={(p: any) => { setAssigningPkg(p); setCustSearch(''); setSelectedCustomer(null); }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'sell' && (
        <div className="flex-1 flex gap-4 overflow-hidden">
          <div className="flex-1 flex flex-col">
            <div className="mb-3">
              <input placeholder={canSeeCustomerPhone ? '🔍 Search customer by name or phone...' : '🔍 Search customer by name...'} value={custSearch}
                onChange={e => { setCustSearch(e.target.value); setSelectedCustomer(null); }}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            {customers.length > 0 && !selectedCustomer && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-lg mb-3 overflow-hidden">
                {customers.map((c: any) => (
                  <button key={c.id} onClick={() => { setSelectedCustomer(c); setViewCustomerId(c.id); }}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0 transition">
                    <div className="font-semibold text-slate-800">{c.fullName}</div>
                    <div className="text-xs text-slate-500">{customerMetaText(c.phone, c.tier, canSeeCustomerPhone, hiddenPhoneLabel)}</div>
                  </button>
                ))}
              </div>
            )}
            {selectedCustomer && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-blue-800">{selectedCustomer.fullName}</div>
                    <div className="text-xs text-blue-600">{customerMetaText(selectedCustomer.phone, selectedCustomer.tier, canSeeCustomerPhone, hiddenPhoneLabel)}</div>
                  </div>
                  <button onClick={() => { setSelectedCustomer(null); setCustSearch(''); }} className="text-xs text-blue-400 hover:text-blue-600">{t('edit')}</button>
                </div>
              </div>
            )}

            {selectedCustomer && (
              <div className="flex-1 overflow-y-auto">
                <h3 className="font-semibold text-slate-700 mb-2 text-sm">{t('memberships.activePackagesFor')} {selectedCustomer.fullName}</h3>
                {custPackages.length === 0 ? (
                  <div className="text-slate-400 text-sm py-4 text-center">{t('memberships.noPackages')}</div>
                ) : (
                  <div className="space-y-2">
                    {custPackages.map((cp: any) => (
                      <div key={cp.id} className={`rounded-xl p-4 border ${cp.active ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                        <div className="flex justify-between items-start">
                          <div className="font-semibold text-sm">{cp.packageName}</div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${cp.active ? 'bg-green-200 text-green-800' : 'bg-slate-200 text-slate-600'}`}>
                            {cp.active ? 'Active' : 'Exhausted'}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-slate-600">
                          <span>⏳ {Number(cp.hoursRemaining).toFixed(1)}h left</span>
                          <span>📅 Expires {cp.expiresAt}</span>
                          <span>🎮 {cp.deviceType} / {cp.sessionType}</span>
                        </div>
                        {cp.active && Number(cp.hoursRemaining) < 2 && (
                          <div className="mt-2 text-xs text-orange-600 font-medium">⚠️ Low balance — less than 2 hours remaining</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="w-64 flex flex-col gap-2">
            <div className="text-sm font-semibold text-slate-600 mb-1">{t('memberships.catalogue')}</div>
            {packages.filter((p: any) => p.active).map((pkg: any) => (
              <div key={pkg.id} className="bg-white border border-slate-200 rounded-xl p-3">
                <div className="font-bold text-sm">{pkg.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{pkg.hoursIncluded}h · {pkg.deviceType}</div>
                <div className="text-green-700 font-black mt-1">{formatCurrency(pkg.price)}</div>
                <button disabled={!selectedCustomer}
                  onClick={() => { setAssigningPkg(pkg); }}
                  className="w-full mt-2 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-xs font-bold transition">
                  Sell to Customer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Package Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="font-bold text-lg mb-4">{editPkg ? '✏️ Edit Package' : '➕ New Package'}</h2>
            <div className="space-y-3">
              <input placeholder="Package name*" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              <input placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">{t('memberships.deviceType')}</label>
                  <select value={form.deviceType} onChange={e => setForm(p => ({ ...p, deviceType: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm">
                    {DEVICE_TYPES.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">{t('memberships.sessionType')}</label>
                  <select value={form.sessionType} onChange={e => setForm(p => ({ ...p, sessionType: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm">
                    {SESSION_TYPES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Hours*</label>
                  <input type="number" value={form.hoursIncluded} onChange={e => setForm(p => ({ ...p, hoursIncluded: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Price (EGP)*</label>
                  <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Valid (days)</label>
                  <input type="number" value={form.validityDays} onChange={e => setForm(p => ({ ...p, validityDays: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => { setShowForm(false); setEditPkg(null); }} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 text-sm">{t('cancel')}</button>
              <button onClick={savePackage} disabled={!form.name || !form.price}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold rounded-xl text-sm">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Package Modal */}
      {assigningPkg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="font-bold text-lg mb-2">🎁 Sell Package</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
              <div className="font-bold text-blue-800">{assigningPkg.name}</div>
              <div className="text-sm text-blue-600">{assigningPkg.hoursIncluded}h · {formatCurrency(assigningPkg.price)}</div>
            </div>
            {!selectedCustomer ? (
              <>
                <input placeholder={t('memberships.searchCustomer')} value={custSearch}
                  onChange={e => setCustSearch(e.target.value)} autoFocus
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm mb-2" />
                {customers.length === 0 && custSearch.length >= 2 && (
                  <div className="text-center text-slate-400 text-sm py-2">{t('noData')}</div>
                )}
                {customers.map((c: any) => (
                  <button key={c.id} onClick={() => { setSelectedCustomer(c); setViewCustomerId(c.id); setCustSearch(''); }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg border-b border-slate-100 text-sm">
                    <span className="font-semibold">{c.fullName}</span>
                    <span className="text-slate-400 ml-2 text-xs">{customerMetaText(c.phone, c.tier, canSeeCustomerPhone, hiddenPhoneLabel)}</span>
                  </button>
                ))}
              </>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-green-800">{selectedCustomer.fullName}</div>
                    <div className="text-xs text-green-600">{customerMetaText(selectedCustomer.phone, selectedCustomer.tier, canSeeCustomerPhone, hiddenPhoneLabel)}</div>
                  </div>
                  <button onClick={() => { setSelectedCustomer(null); setCustSearch(''); }}
                    className="text-xs text-green-500 hover:text-green-700 underline">{t('edit')}</button>
                </div>
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setAssigningPkg(null); setSelectedCustomer(null); setCustSearch(''); }}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 text-sm">{t('cancel')}</button>
              <button onClick={handleAssign} disabled={!selectedCustomer}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 text-white font-bold rounded-xl text-sm">
                Confirm Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
