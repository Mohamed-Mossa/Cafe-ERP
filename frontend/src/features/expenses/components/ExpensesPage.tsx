import { useI18n } from '../../../i18n';
import { useState } from 'react';
import { baseApi } from '../../../app/baseApi';
import { formatCurrency } from '../../../utils/currency';

const expApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getExpenseCategories: b.query<any, void>({ query: () => '/expenses/categories', providesTags: ['Expense'] }),
    getExpenses: b.query<any, { from?: string; to?: string }>({
      query: ({ from, to } = {}) => {
        const params = new URLSearchParams();
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        return `/expenses${params.toString() ? '?' + params : ''}`;
      },
      providesTags: ['Expense'],
    }),
    createExpense: b.mutation<any, any>({ query: (body) => ({ url: '/expenses', method: 'POST', body }), invalidatesTags: ['Expense'] }),
    deleteExpense: b.mutation<any, string>({ query: (id) => ({ url: `/expenses/${id}`, method: 'DELETE' }), invalidatesTags: ['Expense'] }),
    createCategory: b.mutation<any, any>({ query: (body) => ({ url: '/expenses/categories', method: 'POST', body }), invalidatesTags: ['Expense'] }),
  }),
  overrideExisting: false,
});

const { useGetExpenseCategoriesQuery, useGetExpensesQuery, useCreateExpenseMutation,
  useDeleteExpenseMutation, useCreateCategoryMutation } = expApi;

const PARENT_CATS = ['OPERATIONAL', 'PURCHASES', 'MAINTENANCE', 'STAFF', 'MISC'];
const PARENT_COLOR: Record<string, string> = {
  OPERATIONAL: 'bg-blue-100 text-blue-700',
  PURCHASES:   'bg-green-100 text-green-700',
  MAINTENANCE: 'bg-orange-100 text-orange-700',
  STAFF:       'bg-purple-100 text-purple-700',
  MISC:        'bg-slate-100 text-slate-600',
};

const today = new Date().toISOString().split('T')[0];
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

export default function ExpensesPage() {
  const { t, isRTL } = useI18n();
  const [dateFilter, setDateFilter] = useState({ from: monthStart, to: today });
  const [runFilter, setRunFilter] = useState({ from: monthStart, to: today });

  const { data: catsRes } = useGetExpenseCategoriesQuery();
  const { data: expRes, isLoading } = useGetExpensesQuery(runFilter);
  const [createExpense] = useCreateExpenseMutation();
  const [deleteExpense] = useDeleteExpenseMutation();
  const [createCategory] = useCreateCategoryMutation();

  const [showForm, setShowForm] = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);
  const [form, setForm] = useState({ categoryId: '', amount: '', description: '', expenseDate: today });
  const [catForm, setCatForm] = useState({ name: '', parentCategory: 'MISC' });
  const [msg, setMsg] = useState('');
  const [filterCat, setFilterCat] = useState('');

  const categories = catsRes?.data || [];
  const expenses: any[] = expRes?.data || [];

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const filteredExpenses = filterCat ? expenses.filter(e => e.categoryName === filterCat) : expenses;
  const totalAmount = filteredExpenses.reduce((s: number, e: any) => s + (e.amount || 0), 0);

  // Group by parent category
  const byParent: Record<string, number> = {};
  expenses.forEach((e: any) => {
    const cat = categories.find((c: any) => c.name === e.categoryName);
    const parent = cat?.parentCategory || 'MISC';
    byParent[parent] = (byParent[parent] || 0) + e.amount;
  });

  const handleCreate = async () => {
    if (!form.categoryId || !form.amount) { flash('❌ Category and amount required'); return; }
    try {
      await createExpense(form).unwrap();
      setShowForm(false);
      setForm({ categoryId: '', amount: '', description: '', expenseDate: today });
      flash('✅ Expense recorded');
    } catch (e: any) { flash('❌ ' + (e?.data?.message || 'Failed')); }
  };

  const handleCreateCat = async () => {
    if (!catForm.name) { flash('❌ Name required'); return; }
    try {
      await createCategory(catForm).unwrap();
      setShowCatForm(false); setCatForm({ name: '', parentCategory: 'MISC' });
      flash('✅ Category created');
    } catch { flash('❌ Failed'); }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-800">{t('expenses.title')}</h1>
        <div className="flex gap-2 items-center">
          {msg && <span className={`text-xs px-3 py-1.5 rounded-full ${msg.startsWith('❌') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>{msg}</span>}
          <button onClick={() => setShowCatForm(true)} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition">
            ⚙️ Categories
          </button>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition">
            + Record Expense
          </button>
        </div>
      </div>

      {/* Summary cards by parent category */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        {PARENT_CATS.map(cat => (
          <div key={cat} className={`rounded-xl p-3 ${PARENT_COLOR[cat]}`}>
            <div className="text-xs font-medium opacity-75">{cat}</div>
            <div className="font-black text-lg">{formatCurrency(byParent[cat] || 0)}</div>
          </div>
        ))}
      </div>

      {/* Date filter */}
      <div className="flex gap-3 mb-4 items-end flex-wrap">
        {[{ label: 'From', key: 'from' }, { label: 'To', key: 'to' }].map(({ label, key }) => (
          <div key={key}>
            <label className="text-xs text-slate-500 block mb-1">{label}</label>
            <input type="date" value={dateFilter[key as keyof typeof dateFilter]}
              onChange={e => setDateFilter(p => ({ ...p, [key]: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        ))}
        <button onClick={() => setRunFilter({ ...dateFilter })}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition">
          ▶ Filter
        </button>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs text-slate-500">Category:</label>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none">
            <option value="">All</option>
            {categories.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <span className="text-sm font-bold text-slate-700">Total: {formatCurrency(totalAmount)}</span>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="text-center text-slate-400 py-12">Loading...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center text-slate-400 py-12">{t('expenses.noExpenses')}</div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Date','Category','Type','Amount','Description','Recorded By',''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((e: any) => {
                  const cat = categories.find((c: any) => c.name === e.categoryName);
                  return (
                    <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500 text-xs">{e.expenseDate}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{e.categoryName}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PARENT_COLOR[cat?.parentCategory || 'MISC']}`}>
                          {cat?.parentCategory || 'MISC'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-black text-red-600">{formatCurrency(e.amount)}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{e.description || '—'}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{e.recordedByName || '—'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => { if (confirm('Delete this expense?')) deleteExpense(e.id); }}
                          className="text-xs text-red-400 hover:text-red-600 transition">🗑</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr>
                  <td colSpan={3} className="px-4 py-3 font-bold text-slate-700">Total ({filteredExpenses.length} records)</td>
                  <td className="px-4 py-3 font-black text-red-700 text-base">{formatCurrency(totalAmount)}</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Record Expense Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="font-bold text-lg mb-4">💸 Record Expense</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Category*</label>
                <select value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm">
                  <option value="">Select category...</option>
                  {PARENT_CATS.map(parent => (
                    <optgroup key={parent} label={parent}>
                      {categories.filter((c: any) => c.parentCategory === parent).map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Amount (EGP)*</label>
                <input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Date</label>
                <input type="date" value={form.expenseDate} onChange={e => setForm(p => ({ ...p, expenseDate: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm" />
              </div>
              <textarea placeholder="Description / notes..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={2} className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm resize-none" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 text-sm">Cancel</button>
              <button onClick={handleCreate} disabled={!form.categoryId || !form.amount}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold rounded-xl text-sm">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      {showCatForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="font-bold text-lg mb-4">⚙️ New Category</h2>
            <div className="space-y-3">
              <input placeholder="Category name*" value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              <div>
                <label className="text-xs text-slate-500 block mb-1">Parent Type</label>
                <select value={catForm.parentCategory} onChange={e => setCatForm(p => ({ ...p, parentCategory: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm">
                  {PARENT_CATS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowCatForm(false)} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 text-sm">Cancel</button>
              <button onClick={handleCreateCat} disabled={!catForm.name}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold rounded-xl text-sm">Create</button>
            </div>

            {/* Existing categories */}
            <div className="mt-4 border-t border-slate-100 pt-3">
              <div className="text-xs text-slate-500 mb-2">Existing ({categories.length})</div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {categories.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between text-xs py-1">
                    <span className="text-slate-700">{c.name}</span>
                    <span className={`px-2 py-0.5 rounded-full ${PARENT_COLOR[c.parentCategory]}`}>{c.parentCategory}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
