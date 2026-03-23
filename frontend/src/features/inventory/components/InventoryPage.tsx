import { useI18n } from '../../../i18n';
import { useState } from 'react';
import { baseApi } from '../../../app/baseApi';
import { formatCurrency } from '../../../utils/currency';

const inventoryApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getInventory:    b.query<any, void>({ query: () => '/inventory', providesTags: ['Inventory'] }),
    getAlerts:       b.query<any, void>({ query: () => '/inventory/alerts', providesTags: ['Inventory'] }),
    getSuppliers:    b.query<any, void>({ query: () => '/suppliers' }),
    addPurchase:     b.mutation<any, any>({ query: (body) => ({ url: '/inventory/purchases', method: 'POST', body }), invalidatesTags: ['Inventory'] }),
    recordWastage:   b.mutation<any, any>({ query: (body) => ({ url: '/inventory/wastage',   method: 'POST', body }), invalidatesTags: ['Inventory'] }),
    stockCount:      b.mutation<any, any>({ query: (body) => ({ url: '/inventory/count',    method: 'POST', body }), invalidatesTags: ['Inventory'] }),
    createItem:      b.mutation<any, any>({ query: (body) => ({ url: '/inventory/items',    method: 'POST', body }), invalidatesTags: ['Inventory'] }),
  }),
  overrideExisting: false,
});
const { useGetInventoryQuery, useGetAlertsQuery, useGetSuppliersQuery, useAddPurchaseMutation, useRecordWastageMutation, useStockCountMutation, useCreateItemMutation } = inventoryApi;

type Tab = 'all' | 'alerts' | 'purchase' | 'wastage' | 'count' | 'add';
const UNITS = ['g', 'kg', 'ml', 'L', 'pcs', 'box', 'bottle', 'pack', 'can', 'sheet'];

export default function InventoryPage() {
  const { t, isRTL } = useI18n();
  const { data: invRes,    isLoading } = useGetInventoryQuery();
  const { data: alertsRes }            = useGetAlertsQuery();
  const { data: supRes }               = useGetSuppliersQuery();
  const [addPurchase]  = useAddPurchaseMutation();
  const [recordWastage] = useRecordWastageMutation();
  const [stockCount]   = useStockCountMutation();
  const [createItem]   = useCreateItemMutation();

  const [tab, setTab]     = useState<Tab>('all');
  const [form, setForm]   = useState<any>({});
  const [search, setSearch] = useState('');
  const [msg, setMsg]     = useState('');

  const items: any[]    = invRes?.data    || [];
  const alerts: any[]   = alertsRes?.data || [];
  const suppliers: any[] = supRes?.data   || [];
  const tabs: { key: Tab; label: string; icon: string; roles?: string }[] = [
    { key: 'all', label: 'All Items', icon: '📦' },
    { key: 'alerts', label: t('inventory.lowStock'), icon: '⚠️' },
    { key: 'purchase', label: 'Purchase', icon: '🛍' },
    { key: 'wastage', label: 'Wastage', icon: '🗑' },
    { key: 'count', label: 'Stock Count', icon: '🔢' },
    { key: 'add', label: 'Add Item', icon: '➕' },
  ];
  const filtered = items.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()));

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const stockColor = (item: any) => {
    if (item.currentStock <= 0) return 'text-red-600 bg-red-50 border-red-200';
    if (item.currentStock <= item.reorderLevel) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const handleAction = async (action: () => Promise<any>, successMsg: string) => {
    try { await action(); setForm({}); flash(successMsg); }
    catch (e: any) { flash(`❌ ${e?.data?.message || t('failed')}`); }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">📦 Inventory</h1>
        {alerts.length > 0 && (
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold animate-pulse">
            ⚠️ {alerts.length} {t('inventory.lowStock')}
          </span>
        )}
      </div>

      {/* Flash */}
      {msg && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${msg.startsWith('❌') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
          {msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tabItem => (
          <button key={tabItem.key} onClick={() => setTab(tabItem.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1.5 ${
              tab === tabItem.key ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}>
            <span>{tabItem.icon}</span>
            <span>{tabItem.key === 'alerts' && alerts.length > 0 ? `${t('inventory.lowStock')} (${alerts.length})` : tabItem.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {(tab === 'all' || tab === 'alerts') && (
        <div className="flex flex-col flex-1 min-h-0 gap-3">
          {tab === 'all' && (
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Search items..."
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs" />
          )}
          <div className="bg-white rounded-2xl shadow-sm overflow-auto flex-1">
            <table className="w-full">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  {['Item', 'SKU', 'Unit', 'Stock', 'Reorder', 'Safety Stock', 'Avg Cost', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">Loading...</td></tr>
                ) : (tab === 'all' ? filtered : alerts).length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    {tab === 'alerts' ? t('inventory.goodStock') : t('noData')}
                  </td></tr>
                ) : (tab === 'all' ? filtered : alerts).map((item: any) => (
                  <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-800">{item.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{item.sku || '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{item.unit}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-lg text-sm font-bold border ${stockColor(item)}`}>
                        {parseFloat(item.currentStock).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-sm">{item.reorderLevel}</td>
                    <td className="px-4 py-3 text-slate-400 text-sm">{item.safetyStock}</td>
                    <td className="px-4 py-3 text-slate-600 text-sm">{formatCurrency(item.averageCost)}</td>
                    <td className="px-4 py-3">
                      {item.currentStock <= 0 ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-bold">{t('inventory.outOfStock')}</span>
                      ) : item.currentStock <= item.reorderLevel ? (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-600 rounded-full text-xs font-bold">Low</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded-full text-xs font-bold">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'purchase' && (
        <div className="bg-white rounded-2xl shadow-sm p-6 max-w-lg">
          <h3 className="font-bold text-slate-800 mb-4">📥 Record Purchase</h3>
          <div className="space-y-3">
            <select value={form.inventoryItemId || ''} onChange={e => set('inventoryItemId', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm bg-white focus:ring-2 focus:ring-blue-500">
              <option value="">Select Item *</option>
              {items.map((i: any) => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder={`${t('quantity')} *`} value={form.quantity || ''}
                onChange={e => set('quantity', e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm focus:ring-2 focus:ring-blue-500" />
              <input type="number" placeholder="Unit Cost (EGP)" value={form.unitCost || ''}
                onChange={e => set('unitCost', e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <select value={form.supplierId || ''} onChange={e => {
                const sup = suppliers.find((s: any) => s.id === e.target.value);
                setForm((p: any) => ({ ...p, supplierId: e.target.value, supplierName: sup?.name || '' }));
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm bg-white focus:ring-2 focus:ring-blue-500">
              <option value="">{t('inventory.selectSupplier')}</option>
              {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input placeholder={t('inventory.invoiceNumber')} value={form.invoiceNumber || ''}
              onChange={e => set('invoiceNumber', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm focus:ring-2 focus:ring-blue-500" />
            <button onClick={() => {
                const payload = {
                  inventoryItemId: form.inventoryItemId,
                  quantity: parseFloat(form.quantity),
                  unitCost: parseFloat(form.unitCost || '0'),
                  supplierName: form.supplierName || '',
                  invoiceNumber: form.invoiceNumber || '',
                };
                handleAction(() => addPurchase(payload).unwrap(), `✅ ${t('inventory.addPurchase')}`);
              }}
              disabled={!form.inventoryItemId || !form.quantity}
              className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 text-white font-bold rounded-xl transition">
              Record Purchase
            </button>
          </div>
        </div>
      )}

      {tab === 'wastage' && (
        <div className="bg-white rounded-2xl shadow-sm p-6 max-w-lg">
          <h3 className="font-bold text-slate-800 mb-4">🗑 Record Wastage</h3>
          <div className="space-y-3">
            <select value={form.inventoryItemId || ''} onChange={e => set('inventoryItemId', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm bg-white focus:ring-2 focus:ring-blue-500">
              <option value="">Select Item *</option>
              {items.map((i: any) => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
            </select>
            <input type="number" placeholder={`${t('quantity')} *`} value={form.quantity || ''}
              onChange={e => set('quantity', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm focus:ring-2 focus:ring-blue-500" />
            <input placeholder={t('inventory.wastageReasonPh')} value={form.reason || ''}
              onChange={e => set('reason', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm focus:ring-2 focus:ring-blue-500" />
            <button onClick={() => {
                const payload = {
                  inventoryItemId: form.inventoryItemId,
                  quantity: parseFloat(form.quantity),
                  reason: form.reason || '',
                };
                handleAction(() => recordWastage(payload).unwrap(), `✅ ${t('inventory.addWastage')}`);
              }}
              disabled={!form.inventoryItemId || !form.quantity}
              className="w-full py-3 bg-red-500 hover:bg-red-600 disabled:bg-slate-200 text-white font-bold rounded-xl transition">
              Record Wastage
            </button>
          </div>
        </div>
      )}

      {tab === 'count' && (
        <div className="bg-white rounded-2xl shadow-sm p-6 max-w-lg">
          <h3 className="font-bold text-slate-800 mb-1">🔢 Physical Stock Count</h3>
          <p className="text-sm text-slate-500 mb-4">Enter the actual counted quantity. System will record the variance.</p>
          <div className="space-y-3">
            <select value={form.inventoryItemId || ''} onChange={e => {
              const item = items.find((i: any) => i.id === e.target.value);
              set('inventoryItemId', e.target.value);
              if (item) set('_currentStock', item.currentStock);
            }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm bg-white focus:ring-2 focus:ring-blue-500">
              <option value="">Select Item *</option>
              {items.map((i: any) => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
            </select>
            {form._currentStock != null && (
              <div className="px-3 py-2 bg-slate-50 rounded-xl text-sm text-slate-500">
                System stock: <strong>{parseFloat(form._currentStock).toFixed(2)}</strong>
              </div>
            )}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Physically Counted Quantity *</label>
              <input type="number" placeholder="0.00" value={form.countedQuantity || ''}
                onChange={e => set('countedQuantity', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm focus:ring-2 focus:ring-blue-500 text-center text-xl font-bold" />
            </div>
            {form.countedQuantity && form._currentStock != null && (
              <div className={`px-3 py-2 rounded-xl text-sm font-semibold ${
                parseFloat(form.countedQuantity) < parseFloat(form._currentStock)
                  ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
              }`}>
                Variance: {(parseFloat(form.countedQuantity) - parseFloat(form._currentStock)).toFixed(2)}
                {parseFloat(form.countedQuantity) < parseFloat(form._currentStock) ? ' (shortage)' : ' (surplus)'}
              </div>
            )}
            <input placeholder={t('inventory.notesReason')} value={form.notes || ''}
              onChange={e => set('notes', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm focus:ring-2 focus:ring-blue-500" />
            <button
              onClick={() => handleAction(() => stockCount({ inventoryItemId: form.inventoryItemId, actualCount: parseFloat(form.countedQuantity), notes: form.notes }).unwrap(), `✅ ${t('inventory.stockCount')}`)}
              disabled={!form.inventoryItemId || !form.countedQuantity}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold rounded-xl transition">
              Save Count
            </button>
          </div>
        </div>
      )}

      {tab === 'add' && (
        <div className="bg-white rounded-2xl shadow-sm p-6 max-w-lg">
          <h3 className="font-bold text-slate-800 mb-4">➕ Add Inventory Item</h3>
          <div className="space-y-3">
            <input placeholder="Item Name *" value={form.name || ''}
              onChange={e => set('name', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm focus:ring-2 focus:ring-blue-500" />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder={t('inventory.skuOptional')} value={form.sku || ''}
                onChange={e => set('sku', e.target.value.toUpperCase())}
                className="px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm font-mono focus:ring-2 focus:ring-blue-500" />
              <select value={form.unit || ''} onChange={e => set('unit', e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm bg-white focus:ring-2 focus:ring-blue-500">
                <option value="">Unit *</option>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">{t('inventory.currentStock')}</label>
                <input type="number" placeholder="0" value={form.initialStock || ''}
                  onChange={e => set('initialStock', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">{t('inventory.reorderLevel')}</label>
                <input type="number" placeholder="0" value={form.reorderLevel || ''}
                  onChange={e => set('reorderLevel', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">{t('inventory.safetyStock')}</label>
                <input type="number" placeholder="0" value={form.safetyStock || ''}
                  onChange={e => set('safetyStock', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <input placeholder={t('inventory.categoryPh')} value={form.category || ''}
              onChange={e => set('category', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm focus:ring-2 focus:ring-blue-500" />
            <button onClick={() => {
                const payload = {
                  name: form.name,
                  sku: form.sku || '',
                  unit: form.unit || 'pcs',
                  category: form.category || '',
                  initialStock: form.initialStock ? parseFloat(form.initialStock) : 0,
                  reorderLevel: form.reorderLevel ? parseFloat(form.reorderLevel) : 0,
                  safetyStock: form.safetyStock ? parseFloat(form.safetyStock) : 0,
                };
                handleAction(() => createItem(payload).unwrap(), `✅ ${t('inventory.addItem')}`);
              }}
              disabled={!form.name || !form.unit}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold rounded-xl transition">
              Add Item
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
