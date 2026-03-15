import { useI18n } from '../../../i18n';
import { useState } from 'react';
import { baseApi } from '../../../app/baseApi';
import { formatCurrency } from '../../../utils/currency';

const menuMgmtApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getMgmtCategories: b.query<any, void>({ query: () => '/menu/categories', providesTags: ['Category'] }),
    getMgmtProducts: b.query<any, void>({ query: () => '/menu/products?all=true', providesTags: ['Product'] }),
    createProduct: b.mutation<any, any>({ query: (body) => ({ url: '/menu/products', method: 'POST', body }), invalidatesTags: ['Product'] }),
    updateProductPrice: b.mutation<any, { id: string; newPrice: number; reason?: string }>({
      query: ({ id, ...body }) => ({ url: `/menu/products/${id}/price`, method: 'PATCH', body }), invalidatesTags: ['Product'],
    }),
    toggleProductActive: b.mutation<any, string>({ query: (id) => ({ url: `/menu/products/${id}/toggle`, method: 'PATCH' }), invalidatesTags: ['Product'] }),
    getRecipe: b.query<any, string>({ query: (id) => `/menu/products/${id}/recipe` }),
    saveRecipe: b.mutation<any, { id: string; body: any }>({ query: ({ id, body }) => ({ url: `/menu/products/${id}/recipe`, method: 'PUT', body }) }),
    getInventoryItems: b.query<any, void>({ query: () => '/inventory' }),
    createCategory: b.mutation<any, any>({ query: (body) => ({ url: '/menu/categories', method: 'POST', body }), invalidatesTags: ['Category'] }),
    updateCategory: b.mutation<any, { id: string } & any>({
      query: ({ id, ...body }) => ({ url: `/menu/categories/${id}`, method: 'PATCH', body }), invalidatesTags: ['Category'],
    }),
    deleteCategory: b.mutation<any, string>({ query: (id) => ({ url: `/menu/categories/${id}`, method: 'DELETE' }), invalidatesTags: ['Category'] }),
    updateCost: b.mutation<any, { id: string; costPrice: number }>({ query: ({ id, costPrice }) => ({ url: `/menu/products/${id}/cost`, method: 'PATCH', body: { costPrice } }), invalidatesTags: ['Product'] }),
  }),
  overrideExisting: false,
});
const {
  useGetMgmtCategoriesQuery, useGetMgmtProductsQuery, useCreateProductMutation,
  useUpdateProductPriceMutation, useToggleProductActiveMutation,
  useGetRecipeQuery, useSaveRecipeMutation, useGetInventoryItemsQuery,
  useCreateCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation,
  useUpdateCostMutation,
} = menuMgmtApi;

const BLANK = { sku: '', name: '', sellingPrice: '', categoryId: '', availableInMatchMode: false };
const CAT_BLANK = { name: '', icon: '🍽️', displayOrder: '99' };
const UNITS = ['g','kg','ml','l','pcs','tsp','tbsp'];

type MainTab = 'products' | 'categories';
type SubTab = 'products' | 'recipe';

const EMOJI_OPTIONS = ['☕','🧃','🥤','🍵','🧋','🍔','🍕','🍝','🥗','🍰','🍩','🧁','🍦','🥙','🌮','🍜','🥞','🍳','🥩','🍤','🥨','🍿','🧂','🥜','🎂','🍫','🍬','🍭','🍿','🍽️'];

export default function MenuPage() {
  const { data: catsRes } = useGetMgmtCategoriesQuery();
  const { data: prodsRes, isLoading } = useGetMgmtProductsQuery();
  const { data: invRes } = useGetInventoryItemsQuery();
  const [createProduct] = useCreateProductMutation();
  const [updatePrice] = useUpdateProductPriceMutation();
  const [toggleActive] = useToggleProductActiveMutation();
  const [updateCost] = useUpdateCostMutation();
  const [editCostFor, setEditCostFor] = useState<any>(null);
  const [newCostVal, setNewCostVal] = useState('');
  const [saveRecipe] = useSaveRecipeMutation();
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const cats = catsRes?.data || [];
  const products = prodsRes?.data || [];
  const invItems = invRes?.data || [];

  const [mainTab, setMainTab] = useState<MainTab>('products');
  const [subTab, setSubTab] = useState<SubTab>('products');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<any>(BLANK);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editPriceFor, setEditPriceFor] = useState<any>(null);
  const [newPriceVal, setNewPriceVal] = useState('');
  const [priceReason, setPriceReason] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [recipeIngredients, setRecipeIngredients] = useState<any[]>([]);
  const [recipeNotes, setRecipeNotes] = useState('');
  const [recipeSaving, setRecipeSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // Category state
  const [showCatCreate, setShowCatCreate] = useState(false);
  const [showCatEdit, setShowCatEdit] = useState<any>(null);
  const [catForm, setCatForm] = useState<any>(CAT_BLANK);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const { data: recipeRes } = useGetRecipeQuery(selectedProduct?.id, { skip: !selectedProduct });
  if (recipeRes?.data && selectedProduct && recipeIngredients.length === 0 && recipeRes.data.ingredients?.length > 0) {
    setRecipeIngredients(recipeRes.data.ingredients);
    setRecipeNotes(recipeRes.data.notes || '');
  }

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };
  const catName = (id: string) => cats.find((c: any) => c.id === id)?.name || '—';
  const filtered = products.filter((p: any) => {
    const matchCat = !catFilter || p.categoryId === catFilter;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const openRecipeEditor = (product: any) => {
    setSelectedProduct(product); setSubTab('recipe');
    const recipe = recipeRes?.data;
    if (recipe) { setRecipeIngredients(recipe.ingredients || []); setRecipeNotes(recipe.notes || ''); }
    else { setRecipeIngredients([]); setRecipeNotes(''); }
  };

  const handleCreate = async () => {
    if (!form.sku || !form.name || !form.sellingPrice || !form.categoryId) { setFormError('All fields required'); return; }
    setSaving(true); setFormError('');
    try { await createProduct({ ...form, sellingPrice: parseFloat(form.sellingPrice) }).unwrap(); setShowCreate(false); setForm(BLANK); flash('✅ Product created'); }
    catch (e: any) { setFormError(e?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleSaveRecipe = async () => {
    if (!selectedProduct) return;
    setRecipeSaving(true);
    try {
      await saveRecipe({ id: selectedProduct.id, body: { notes: recipeNotes, ingredients: recipeIngredients.filter(i => i.inventoryItemId) } }).unwrap();
      flash('✅ Recipe saved'); setSubTab('products');
    } catch (e: any) { alert(e?.data?.message || 'Failed to save recipe'); }
    finally { setRecipeSaving(false); }
  };

  const handleCreateCat = async () => {
    if (!catForm.name) return;
    try { await createCategory(catForm).unwrap(); setShowCatCreate(false); setCatForm(CAT_BLANK); flash('✅ Category created'); }
    catch { flash('❌ Failed to create category'); }
  };

  const handleUpdateCat = async () => {
    if (!showCatEdit) return;
    try { await updateCategory({ id: showCatEdit.id, ...catForm }).unwrap(); setShowCatEdit(null); flash('✅ Category updated'); }
    catch { flash('❌ Failed to update'); }
  };

  const handleDeleteCat = async (cat: any) => {
    const count = products.filter((p: any) => p.categoryId === cat.id).length;
    if (count > 0 && !confirm(`"${cat.name}" has ${count} product(s). It will be hidden, not deleted. Continue?`)) return;
    try { await deleteCategory(cat.id).unwrap(); flash('✅ Category removed'); }
    catch { flash('❌ Failed'); }
  };

  const addIngredient = () => setRecipeIngredients(prev => [...prev, { inventoryItemId: '', quantity: '1', unit: 'g' }]);
  const removeIngredient = (i: number) => setRecipeIngredients(prev => prev.filter((_, idx) => idx !== i));
  const setIng = (i: number, k: string, v: string) =>
    setRecipeIngredients(prev => prev.map((ing, idx) => idx === i ? { ...ing, [k]: v } : ing));

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-800">🍽️ Menu Management</h1>
          {subTab === 'products' && (
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              {(['products', 'categories'] as MainTab[]).map(t => (
                <button key={t} onClick={() => setMainTab(t)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition ${mainTab === t ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <a href="/qr-menu" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-xl text-sm font-semibold transition">
            📱 Preview QR Menu
          </a>
          {subTab === 'recipe' && (
            <button onClick={() => { setSubTab('products'); setSelectedProduct(null); }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-sm">← Back</button>
          )}
          {subTab === 'recipe' && (
            <button onClick={handleSaveRecipe} disabled={recipeSaving}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white font-semibold rounded-xl text-sm">
              {recipeSaving ? 'Saving...' : '✓ Save Recipe'}
            </button>
          )}
          {subTab === 'products' && mainTab === 'products' && (
            <button onClick={() => { setShowCreate(true); setFormError(''); }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm">+ Add Product</button>
          )}
          {subTab === 'products' && mainTab === 'categories' && (
            <button onClick={() => { setShowCatCreate(true); setCatForm(CAT_BLANK); }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm">+ Add Category</button>
          )}
        </div>
      </div>

      {msg && <div className={`px-4 py-3 rounded-xl text-sm font-medium ${msg.startsWith('❌') ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-700'}`}>{msg}</div>}

      {/* ── CATEGORIES TAB ── */}
      {subTab === 'products' && mainTab === 'categories' && (
        <div className="flex-1 bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {cats.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400">No categories yet</div>
          ) : (
            <div className="overflow-auto flex-1">
              <table className="w-full">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr>
                    {['Icon', 'Name', 'Order', 'Products', 'Status', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...cats].sort((a: any, b: any) => a.displayOrder - b.displayOrder).map((cat: any) => {
                    const prodCount = products.filter((p: any) => p.categoryId === cat.id).length;
                    return (
                      <tr key={cat.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                        <td className="px-4 py-3 text-2xl">{cat.icon || '🍽️'}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{cat.name}</td>
                        <td className="px-4 py-3 text-slate-400 text-sm">{cat.displayOrder}</td>
                        <td className="px-4 py-3 text-slate-500 text-sm">{prodCount} products</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${cat.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                            {cat.active ? '● Active' : '○ Hidden'}
                          </span>
                        </td>
                        <td className="px-4 py-3 flex gap-2">
                          <button onClick={() => { setShowCatEdit(cat); setCatForm({ name: cat.name, icon: cat.icon || '🍽️', displayOrder: String(cat.displayOrder) }); }}
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-medium transition">Edit</button>
                          <button onClick={() => updateCategory({ id: cat.id, active: !cat.active })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${cat.active ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                            {cat.active ? 'Hide' : 'Show'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── PRODUCTS TAB ── */}
      {subTab === 'products' && mainTab === 'products' && (<>
        <div className="flex gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or SKU..."
            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Categories</option>
            {cats.map((c: any) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          <div className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm text-slate-400">{filtered.length} items</div>
        </div>

        <div className="flex-1 bg-white rounded-2xl shadow-sm overflow-hidden">
          {isLoading ? <div className="flex items-center justify-center h-full text-slate-400">Loading...</div>
          : <div className="overflow-auto h-full">
            <table className="w-full">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>{['SKU','Name','Category','Price','Cost','Margin','Status','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan={8} className="px-4 py-16 text-center text-slate-400">No products found</td></tr>
                  : filtered.map((p: any) => (
                  <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{p.sku}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{p.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {cats.find((c: any) => c.id === p.categoryId)?.icon || ''} {catName(p.categoryId)}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800">{formatCurrency(p.sellingPrice)}</td>
                    <td className="px-4 py-3 text-sm">
                      <button onClick={() => { setEditCostFor(p); setNewCostVal(String(p.costPrice || '')); }}
                        className="text-slate-600 hover:text-blue-600 font-medium">
                        {p.costPrice ? formatCurrency(p.costPrice) : <span className="text-slate-300">— set</span>}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {p.profitMargin != null && p.costPrice ? (
                        <span className={`font-bold ${p.profitMargin >= 50 ? 'text-green-600' : p.profitMargin >= 25 ? 'text-yellow-600' : 'text-red-500'}`}>
                          {parseFloat(p.profitMargin).toFixed(1)}%
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                        {p.active ? '● Active' : '○ Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 flex-wrap">
                        <button onClick={() => { setEditPriceFor(p); setNewPriceVal(String(p.sellingPrice)); }}
                          className="px-2 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium">Price</button>
                        <button onClick={() => { setEditCostFor(p); setNewCostVal(String(p.costPrice || '')); }}
                          className="px-2 py-1 text-xs bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg font-medium">Cost</button>
                        <button onClick={() => openRecipeEditor(p)}
                          className="px-2 py-1 text-xs bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg font-medium">Recipe</button>
                        <button onClick={() => toggleActive(p.id)}
                          className={`px-2 py-1 text-xs rounded-lg font-medium ${p.active ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                          {p.active ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}</tbody>
            </table>
          </div>}
        </div>
      </>)}

      {/* ── RECIPE EDITOR ── */}
      {subTab === 'recipe' && selectedProduct && (
        <div className="flex-1 bg-white rounded-2xl shadow-sm p-5 overflow-y-auto">
          <div className="mb-4">
            <h2 className="font-bold text-lg text-slate-800">📋 Recipe: {selectedProduct.name}</h2>
            <p className="text-sm text-slate-400">Define ingredients — automatically deducted from inventory when order is paid</p>
          </div>
          <textarea value={recipeNotes} onChange={e => setRecipeNotes(e.target.value)}
            placeholder="Recipe notes (preparation instructions)" rows={2}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4" />
          <div className="space-y-3 mb-4">
            {recipeIngredients.map((ing, i) => (
              <div key={i} className="flex gap-2 items-center bg-slate-50 p-3 rounded-xl">
                <select value={ing.inventoryItemId} onChange={e => setIng(i, 'inventoryItemId', e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white outline-none">
                  <option value="">Select ingredient...</option>
                  {invItems.map((item: any) => <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>)}
                </select>
                <input type="number" value={ing.quantity} onChange={e => setIng(i, 'quantity', e.target.value)}
                  placeholder="Qty" min={0} step={0.01}
                  className="w-20 px-3 py-2 border border-slate-200 rounded-xl text-sm text-center outline-none" />
                <select value={ing.unit} onChange={e => setIng(i, 'unit', e.target.value)}
                  className="w-20 px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white outline-none">
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <button onClick={() => removeIngredient(i)} className="text-red-400 hover:text-red-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50">×</button>
              </div>
            ))}
          </div>
          <button onClick={addIngredient}
            className="w-full py-2.5 border-2 border-dashed border-slate-200 text-slate-400 hover:border-blue-400 hover:text-blue-500 rounded-xl text-sm font-medium transition">
            + Add Ingredient
          </button>
        </div>
      )}

      {/* ── MODALS ── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="font-bold text-lg mb-4">Add Product</h2>
            {formError && <div className="mb-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{formError}</div>}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input value={form.sku} onChange={e => setForm((p: any) => ({ ...p, sku: e.target.value.toUpperCase() }))}
                  placeholder="SKU *" className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="number" value={form.sellingPrice} onChange={e => setForm((p: any) => ({ ...p, sellingPrice: e.target.value }))}
                  placeholder="Price (EGP) *" className="px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <input value={form.name} onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))}
                placeholder="Product Name *" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <select value={form.categoryId} onChange={e => setForm((p: any) => ({ ...p, categoryId: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select category *</option>
                {cats.map((c: any) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                <input type="checkbox" checked={form.availableInMatchMode}
                  onChange={e => setForm((p: any) => ({ ...p, availableInMatchMode: e.target.checked }))} className="w-4 h-4 accent-blue-600" />
                Available in Gaming Match Mode
              </label>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowCreate(false); setFormError(''); setForm(BLANK); }}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 text-sm">Cancel</button>
              <button onClick={handleCreate} disabled={saving}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-sm">
                {saving ? 'Saving...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editPriceFor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="font-bold text-lg mb-1">Update Price</h2>
            <p className="text-sm text-slate-400 mb-3">{editPriceFor.name} — currently {formatCurrency(editPriceFor.sellingPrice)}</p>
            <input type="number" value={newPriceVal} onChange={e => setNewPriceVal(e.target.value)} autoFocus
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none text-2xl font-black text-center mb-3" />
            <input value={priceReason} onChange={e => setPriceReason(e.target.value)} placeholder="Reason (optional)"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500 mb-4" />
            <div className="flex gap-3">
              <button onClick={() => { setEditPriceFor(null); setNewPriceVal(''); setPriceReason(''); }}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 text-sm">Cancel</button>
              <button onClick={async () => { await updatePrice({ id: editPriceFor.id, newPrice: parseFloat(newPriceVal), reason: priceReason }); setEditPriceFor(null); flash('✅ Price updated'); }}
                disabled={!newPriceVal}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-sm">Update</button>
            </div>
          </div>
        </div>
      )}

      {/* Cost edit modal */}
      {editCostFor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="font-bold text-lg mb-1">💰 Set Cost Price</h2>
            <p className="text-sm text-slate-400 mb-3">{editCostFor.name} — selling at {formatCurrency(editCostFor.sellingPrice)}</p>
            <input type="number" value={newCostVal} onChange={e => setNewCostVal(e.target.value)} autoFocus
              placeholder="Cost price (EGP)"
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-purple-500 outline-none text-2xl font-black text-center mb-2" />
            {newCostVal && parseFloat(newCostVal) > 0 && (
              <div className="text-sm text-center text-purple-600 font-semibold mb-4">
                Margin: {(((editCostFor.sellingPrice - parseFloat(newCostVal)) / editCostFor.sellingPrice) * 100).toFixed(1)}%
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => { setEditCostFor(null); setNewCostVal(''); }}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 text-sm">Cancel</button>
              <button onClick={async () => { await updateCost({ id: editCostFor.id, costPrice: parseFloat(newCostVal) }); setEditCostFor(null); setNewCostVal(''); flash('✅ Cost updated'); }}
                disabled={!newCostVal || parseFloat(newCostVal) <= 0}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-sm">Save Cost</button>
            </div>
          </div>
        </div>
      )}

      {/* Category create/edit modal */}
      {(showCatCreate || showCatEdit) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="font-bold text-lg mb-4">{showCatCreate ? '➕ Add Category' : '✏️ Edit Category'}</h2>
            <div className="space-y-3">
              {/* Emoji picker */}
              <div>
                <label className="text-xs text-slate-500 block mb-1">Icon</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowEmojiPicker(v => !v)}
                    className="w-12 h-12 text-2xl bg-slate-50 border-2 border-slate-200 hover:border-blue-400 rounded-xl flex items-center justify-center transition">
                    {catForm.icon || '🍽️'}
                  </button>
                  <span className="text-xs text-slate-400">Click to pick an icon</span>
                </div>
                {showEmojiPicker && (
                  <div className="mt-2 p-3 bg-slate-50 rounded-xl grid grid-cols-10 gap-1">
                    {EMOJI_OPTIONS.map(e => (
                      <button key={e} onClick={() => { setCatForm((p: any) => ({...p, icon: e})); setShowEmojiPicker(false); }}
                        className={`text-xl p-1 rounded-lg hover:bg-white transition ${catForm.icon === e ? 'bg-white ring-2 ring-blue-400' : ''}`}>
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input placeholder="Category Name *" value={catForm.name}
                onChange={e => setCatForm((p: any) => ({...p, name: e.target.value}))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              <div>
                <label className="text-xs text-slate-500 block mb-1">Display Order (lower = first)</label>
                <input type="number" value={catForm.displayOrder}
                  onChange={e => setCatForm((p: any) => ({...p, displayOrder: e.target.value}))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setShowCatCreate(false); setShowCatEdit(null); setShowEmojiPicker(false); }}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 text-sm">Cancel</button>
              <button onClick={showCatCreate ? handleCreateCat : handleUpdateCat} disabled={!catForm.name}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold rounded-xl text-sm">
                {showCatCreate ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
