import { useI18n } from '../../../i18n';
import { useState } from 'react';
import { baseApi } from '../../../app/baseApi';
import { formatCurrency } from '../../../utils/currency';

const promoApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getPromos: b.query<any, void>({ query: () => '/promos', providesTags: ['Promo'] }),
    createPromo: b.mutation<any, any>({ query: (body) => ({ url: '/promos', method: 'POST', body }), invalidatesTags: ['Promo'] }),
    togglePromo: b.mutation<any, string>({ query: (id) => ({ url: `/promos/${id}/toggle`, method: 'PATCH' }), invalidatesTags: ['Promo'] }),
    deletePromo: b.mutation<any, string>({ query: (id) => ({ url: `/promos/${id}`, method: 'DELETE' }), invalidatesTags: ['Promo'] }),
    updatePromo: b.mutation<any, { id: string } & any>({ query: ({ id, ...body }) => ({ url: `/promos/${id}`, method: 'PUT', body }), invalidatesTags: ['Promo'] }),
  }), overrideExisting: false,
});
const { useGetPromosQuery, useCreatePromoMutation, useTogglePromoMutation, useDeletePromoMutation, useUpdatePromoMutation } = promoApi;

const today = new Date().toISOString().split('T')[0];

export default function PromotionsPage() {
  const { t, isRTL } = useI18n();
  const { data: promosRes } = useGetPromosQuery();
  const [createPromo] = useCreatePromoMutation();
  const [togglePromo] = useTogglePromoMutation();
  const [deletePromo] = useDeletePromoMutation();
  const [updatePromo] = useUpdatePromoMutation();
  const [show, setShow] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [form, setForm] = useState({ code: '', description: '', discountType: 'PERCENT', discountValue: '', maxUsageCount: '1', minimumOrderAmount: '', startDate: today, endDate: today });
  const promos = promosRes?.data || [];

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-800">🎟️ Promo Codes</h1>
        <button onClick={() => { setEditTarget(null); setForm({ code: '', description: '', discountType: 'PERCENT', discountValue: '', maxUsageCount: '1', minimumOrderAmount: '', startDate: today, endDate: today }); setShow(true); }} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-xl text-sm">+ New Promo</button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {promos.map((p: any) => (
          <div key={p.id} className={`bg-white rounded-2xl shadow-sm p-4 border-l-4 ${p.active ? 'border-green-400' : 'border-slate-300'}`}>
            <div className="flex justify-between items-start mb-2">
              <code className="text-lg font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-lg">{p.code}</code>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {p.active ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            <p className="text-sm text-slate-600 mb-2">{p.description}</p>
            <div className="flex gap-2 text-xs text-slate-500">
              <span className="bg-slate-50 px-2 py-1 rounded">
                {p.discountType === 'PERCENT' ? `${p.discountValue}%` : formatCurrency(p.discountValue)} off
              </span>
              <span className="bg-slate-50 px-2 py-1 rounded">{p.currentUsageCount}/{p.maxUsageCount} used</span>
              <span className="bg-slate-50 px-2 py-1 rounded">Until {p.endDate}</span>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={async () => { await togglePromo(p.id); }}
                className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition ${p.active ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                {p.active ? 'Deactivate' : 'Activate'}
              </button>
              <button onClick={() => { setEditTarget(p); setForm({ code: p.code, description: p.description || '', discountType: p.discountType, discountValue: String(p.discountValue), maxUsageCount: String(p.maxUsageCount), minimumOrderAmount: p.minimumOrderAmount ? String(p.minimumOrderAmount) : '', startDate: p.startDate, endDate: p.endDate }); setShow(true); }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition">✏️</button>
              <button onClick={async () => { if (confirm('Delete this promo code?')) await deletePromo(p.id); }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition">🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="font-bold text-lg mb-4">{editTarget ? '✏️ Edit Promo Code' : 'Create Promo Code'}</h2>
            <div className="space-y-3">
              <input placeholder="Code (e.g. SUMMER20)" value={form.code} onChange={e => f('code', e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm font-mono uppercase" />
              <input placeholder="Description" value={form.description} onChange={e => f('description', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <select value={form.discountType} onChange={e => f('discountType', e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm">
                  <option value="PERCENT">Percentage</option>
                  <option value="FIXED">Fixed Amount</option>
                </select>
                <input type="number" placeholder="Value" value={form.discountValue} onChange={e => f('discountValue', e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm" />
              </div>
              <input type="number" placeholder="Max Usage Count" value={form.maxUsageCount} onChange={e => f('maxUsageCount', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm" />
              <input type="number" placeholder="Minimum Order Amount (EGP) — optional" value={form.minimumOrderAmount} onChange={e => f('minimumOrderAmount', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs text-slate-500">Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => f('startDate', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm mt-1" /></div>
                <div><label className="text-xs text-slate-500">End Date</label>
                  <input type="date" value={form.endDate} onChange={e => f('endDate', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm mt-1" /></div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setShow(false); setEditTarget(null); }} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600">Cancel</button>
              <button onClick={async () => {
                  const payload: any = { ...form, discountValue: parseFloat(form.discountValue), maxUsageCount: parseInt(form.maxUsageCount) };
                  if (form.minimumOrderAmount) payload.minimumOrderAmount = parseFloat(form.minimumOrderAmount);
                  else delete payload.minimumOrderAmount;
                  if (editTarget) { await updatePromo({ id: editTarget.id, ...payload }); }
                  else { await createPromo(payload); }
                  setShow(false); setEditTarget(null);
                }}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl">{editTarget ? 'Save' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
