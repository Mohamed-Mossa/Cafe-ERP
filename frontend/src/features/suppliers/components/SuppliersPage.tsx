import { useI18n } from '../../../i18n';
import { useState } from 'react';
import { baseApi } from '../../../app/baseApi';

const supApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getSuppliers: b.query<any, void>({ query: () => '/suppliers', providesTags: ['Supplier'] }),
    createSupplier: b.mutation<any, any>({ query: (body) => ({ url: '/suppliers', method: 'POST', body }), invalidatesTags: ['Supplier'] }),
    updateSupplier: b.mutation<any, { id: string } & any>({ query: ({ id, ...body }) => ({ url: `/suppliers/${id}`, method: 'PUT', body }), invalidatesTags: ['Supplier'] }),
    deleteSupplier: b.mutation<any, string>({ query: (id) => ({ url: `/suppliers/${id}`, method: 'DELETE' }), invalidatesTags: ['Supplier'] }),
  }),
  overrideExisting: false,
});
const { useGetSuppliersQuery, useCreateSupplierMutation, useUpdateSupplierMutation, useDeleteSupplierMutation } = supApi;

const BLANK = { name: '', contactPerson: '', phone: '', email: '', address: '', notes: '' };

export default function SuppliersPage() {
  const { t, isRTL } = useI18n();
  const { data, isLoading, refetch } = useGetSuppliersQuery();
  const [createSupplier] = useCreateSupplierMutation();
  const [updateSupplier] = useUpdateSupplierMutation();
  const [deleteSupplier] = useDeleteSupplierMutation();

  const suppliers = data?.data || [];
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [form, setForm] = useState<any>(BLANK);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm((p: any) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name) { setError('Supplier name is required'); return; }
    setSaving(true); setError('');
    try {
      if (editTarget) { await updateSupplier({ id: editTarget.id, ...form }).unwrap(); setEditTarget(null); }
      else { await createSupplier(form).unwrap(); setShowCreate(false); }
      setForm(BLANK); refetch();
    } catch (e: any) { setError(e?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const openEdit = (s: any) => { setForm({ name: s.name, contactPerson: s.contactPerson||'', phone: s.phone||'', email: s.email||'', address: s.address||'', notes: s.notes||'' }); setEditTarget(s); setError(''); };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">🏭 Suppliers</h1>
        <button onClick={() => { setShowCreate(true); setForm(BLANK); setError(''); }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm">+ Add Supplier</button>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? <div className="flex items-center justify-center h-full text-slate-400">Loading...</div>
        : suppliers.length === 0 ? <div className="flex items-center justify-center h-full text-slate-400">No suppliers yet</div>
        : <div className="overflow-auto h-full">
          <table className="w-full">
            <thead className="bg-slate-50 sticky top-0">
              <tr>{['Name', 'Contact', 'Phone', 'Email', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {suppliers.map((s: any) => (
                <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">{s.name}</div>
                    {s.address && <div className="text-xs text-slate-400">{s.address}</div>}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{s.contactPerson||'—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{s.phone||'—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{s.email||'—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(s)} className="text-xs px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium">Edit</button>
                      <button onClick={async () => { if (confirm('Delete supplier?')) { await deleteSupplier(s.id); refetch(); } }}
                        className="text-xs px-3 py-1 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
      </div>

      {(showCreate || editTarget) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="font-bold text-lg mb-4">{editTarget ? 'Edit Supplier' : '🏭 New Supplier'}</h2>
            {error && <div className="mb-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
            <div className="space-y-3">
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Company Name *"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)} placeholder="Contact Person"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="Phone"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="Email"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Address"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Notes..." rows={2}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowCreate(false); setEditTarget(null); setError(''); }}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 text-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-sm">
                {saving ? 'Saving...' : editTarget ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
