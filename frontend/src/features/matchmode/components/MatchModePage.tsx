import { useI18n } from '../../../i18n';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { baseApi } from '../../../app/baseApi';
import { formatCurrency } from '../../../utils/currency';

const matchApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getMatchProducts: b.query<any, void>({ query: () => '/menu/products?all=false', providesTags: ['Menu'] }),
    getAllMenuProducts: b.query<any, void>({ query: () => '/menu/products?all=true', providesTags: ['Menu'] }),
    getMatchSettings: b.query<any, void>({ query: () => '/settings', providesTags: ['Settings'] }),
    saveMatchSettings: b.mutation<any, Record<string, string>>({
      query: (body) => ({ url: '/settings', method: 'PUT', body }), invalidatesTags: ['Settings', 'Menu'],
    }),
    createMatchOrder: b.mutation<any, any>({ query: (body) => ({ url: '/orders', method: 'POST', body }), invalidatesTags: ['Order'] }),
    addMatchLine: b.mutation<any, { orderId: string; productId: string; quantity: number }>({
      query: ({ orderId, ...body }) => ({ url: `/orders/${orderId}/lines`, method: 'POST', body }), invalidatesTags: ['Order'],
    }),
    closeMatchOrder: b.mutation<any, { orderId: string; payments: any[] }>({
      query: ({ orderId, payments }) => ({ url: `/orders/${orderId}/pay`, method: 'POST', body: { payments } }), invalidatesTags: ['Order'],
    }),
    getOpenOrders: b.query<any, void>({ query: () => '/orders/open', providesTags: ['Order'] }),
  }),
  overrideExisting: false,
});

const { useGetMatchProductsQuery, useGetAllMenuProductsQuery, useGetMatchSettingsQuery,
  useSaveMatchSettingsMutation, useCreateMatchOrderMutation,
  useAddMatchLineMutation, useCloseMatchOrderMutation } = matchApi;

interface CartItem { productId: string; productName: string; price: number; qty: number; }

function LiveRevenueTicker({ startTime }: { startTime: number }) {
  const { t } = useI18n();
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setElapsed(Date.now() - startTime), 1000);
    return () => clearInterval(interval);
  }, [startTime]);
  return <span className="font-mono text-yellow-300 text-xs">{t('matchMode.session')}: {Math.floor(elapsed/60000)}m</span>;
}

export default function MatchModePage() {
  const { t, isRTL } = useI18n();
  const navigate = useNavigate();
  const { data: productsRes } = useGetMatchProductsQuery(undefined, { pollingInterval: 30000 });
  const { data: allProductsRes } = useGetAllMenuProductsQuery();
  const { data: settingsRes } = useGetMatchSettingsQuery();
  const [saveSettings] = useSaveMatchSettingsMutation();
  const [createOrder] = useCreateMatchOrderMutation();
  const [addLine] = useAddMatchLineMutation();
  const [closeOrder] = useCloseMatchOrderMutation();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [sessionStart] = useState(Date.now());
  const [msg, setMsg] = useState('');
  const [lastOrderTotal, setLastOrderTotal] = useState<number | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [showManageModal, setShowManageModal] = useState(false);
  const [manageSearch, setManageSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allProducts: any[] = productsRes?.data || [];
  const allMenuProducts: any[] = allProductsRes?.data || allProducts;
  const settings = settingsRes?.data || {};
  const matchProductIds: string[] = (settings.match_mode_products || '').split(',').filter(Boolean);
  const products = matchProductIds.length > 0
    ? allProducts.filter((p: any) => matchProductIds.includes(p.id))
    : allProducts.filter((p: any) => p.availableInMatchMode);

  // Fallback: show all products if none tagged for match mode
  const displayProducts = products.length > 0 ? products : allProducts.slice(0, 20);

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const flash = (m: string, ms = 2500) => { setMsg(m); setTimeout(() => setMsg(''), ms); };

  // Sync selectedIds when manage modal opens
  const openManageModal = () => {
    setSelectedIds(new Set(matchProductIds));
    setManageSearch('');
    setShowManageModal(true);
  };

  const toggleProduct = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const saveMatchItems = async () => {
    try {
      await saveSettings({ match_mode_products: Array.from(selectedIds).join(',') }).unwrap();
      setShowManageModal(false);
      flash(`✅ ${t('saved')}`, 2000);
    } catch (e: any) {
      flash('❌ ' + (e?.data?.message || t('failed')));
    }
  };

  const tapProduct = (p: any) => {
    setCart(prev => {
      const ex = prev.find(i => i.productId === p.id);
      if (ex) return prev.map(i => i.productId === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { productId: p.id, productName: p.name, price: p.sellingPrice, qty: 1 }];
    });
  };

  const repeatLastOrder = () => {
    if (!lastOrderTotal) { flash(t('matchMode.noRepeat')); return; }
    flash(t('matchMode.repeatHint'));
  };

  const quickClose = async () => {
    if (cart.length === 0) { flash('❌ Cart is empty'); return; }
    try {
      let oid = orderId;
      if (!oid) {
        const res = await createOrder({ source: 'TAKEAWAY' }).unwrap();
        oid = res.data.id;
        setOrderId(oid);
      }
      for (const item of cart) {
        await addLine({ orderId: oid!, productId: item.productId, quantity: item.qty }).unwrap();
      }
      await closeOrder({ orderId: oid!, payments: [{ method: 'CASH', amount: cartTotal }] }).unwrap();
      setLastOrderTotal(cartTotal);
      setSessionTotal(s => s + cartTotal);
      setCart([]);
      setOrderId(null);
      flash(`✅ ${formatCurrency(cartTotal)} — ${t('pos.cash')}`, 2000);
    } catch (e: any) {
      flash('❌ ' + (e?.data?.message || t('failed')));
    }
  };

  const removeFromCart = (productId: string) => setCart(prev => prev.filter(i => i.productId !== productId));
  const adjustQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(i => i.productId === productId
      ? { ...i, qty: Math.max(0, i.qty + delta) }
      : i).filter(i => i.qty > 0));
  };

  return (
    <div className="h-full flex flex-col bg-gray-950 text-white overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black text-yellow-400">{t('matchMode.title')}</span>
          <LiveRevenueTicker startTime={sessionStart} />
          <span className="text-xs text-green-400 font-mono">{t('matchMode.sessionTotal')}: {formatCurrency(sessionTotal)}</span>
        </div>
        <div className="flex items-center gap-2">
          {msg && <span className={`text-xs px-3 py-1 rounded-full ${msg.startsWith('❌') ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`}>{msg}</span>}
          <button onClick={openManageModal}
            className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded-lg text-xs font-bold transition">
            {t('matchMode.manageItems')}
          </button>
          <button onClick={repeatLastOrder}
            className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 rounded-lg text-xs font-bold transition">
            {t('matchMode.repeatLast')}
          </button>
          <button onClick={() => navigate('/pos')}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition">
            {t('matchMode.normalPOS')}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Product Grid */}
        <div className="flex-1 p-3 overflow-y-auto">
          {displayProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <div className="text-4xl mb-3">🎮</div>
              <div className="text-lg font-bold mb-1">{t('matchMode.noProducts')}</div>
              <div className="text-sm">{t('matchMode.noProductsHint')}</div>
            </div>
          ) : (
            <div className="grid grid-cols-4 xl:grid-cols-5 gap-2">
              {displayProducts.map((p: any) => {
                const inCart = cart.find(i => i.productId === p.id);
                return (
                  <button key={p.id} onClick={() => tapProduct(p)}
                    className={`relative rounded-xl p-3 text-left transition-all active:scale-95 select-none
                      ${inCart ? 'bg-yellow-600 ring-2 ring-yellow-400 shadow-lg shadow-yellow-900/30' : 'bg-gray-800 hover:bg-gray-700'}`}>
                    <div className="text-2xl mb-1">🍔</div>
                    <div className="text-xs font-bold leading-tight line-clamp-2">{p.name}</div>
                    <div className="text-yellow-400 font-black text-sm mt-1">{formatCurrency(p.sellingPrice)}</div>
                    {inCart && (
                      <div className="absolute top-1.5 right-1.5 bg-yellow-400 text-gray-900 text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">
                        {inCart.qty}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart Panel */}
        <div className="w-72 flex flex-col bg-gray-900 border-l border-gray-800">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <span className="font-bold text-sm">🛒 {t('matchMode.cart')} ({cart.reduce((s, i) => s + i.qty, 0)})</span>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-xs text-red-400 hover:text-red-300">{t('matchMode.clearCart')}</button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {cart.length === 0 ? (
              <div className="text-center text-gray-600 text-sm py-8">{t('matchMode.tapToAdd')}</div>
            ) : cart.map(item => (
              <div key={item.productId} className="bg-gray-800 rounded-lg px-3 py-2 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{item.productName}</div>
                  <div className="text-yellow-400 text-xs font-bold">{formatCurrency(item.price * item.qty)}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => adjustQty(item.productId, -1)}
                    className="w-5 h-5 bg-gray-700 hover:bg-gray-600 rounded text-xs flex items-center justify-center">−</button>
                  <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                  <button onClick={() => adjustQty(item.productId, 1)}
                    className="w-5 h-5 bg-gray-700 hover:bg-gray-600 rounded text-xs flex items-center justify-center">+</button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-gray-800 space-y-2">
            <div className="flex justify-between text-lg font-black">
              <span>{t('total')}</span>
              <span className="text-yellow-400">{formatCurrency(cartTotal)}</span>
            </div>
            <button onClick={quickClose} disabled={cart.length === 0}
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-900 font-black rounded-xl transition active:scale-95 text-sm">
              {t('matchMode.quickClose')}
            </button>
            <button onClick={() => { if (cart.length > 0) setShowPayModal(true); }} disabled={cart.length === 0}
              className="w-full py-2 bg-blue-700 hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold rounded-xl transition text-xs">
              {t('matchMode.otherPayment')}
            </button>
          </div>
        </div>
      </div>

      {/* Other Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-80">
            <h2 className="font-bold text-lg mb-4 text-white">{t('matchMode.selectPayment')}</h2>
            <div className="text-2xl font-black text-yellow-400 mb-4 text-center">{formatCurrency(cartTotal)}</div>
            {['CASH','CARD','EWALLET'].map(method => (
              <button key={method} onClick={async () => {
                try {
                  let oid = orderId;
                  if (!oid) {
                    const res = await createOrder({ source: 'TAKEAWAY' }).unwrap();
                    oid = res.data.id;
                    setOrderId(oid);
                  }
                  for (const item of cart) {
                    await addLine({ orderId: oid!, productId: item.productId, quantity: item.qty }).unwrap();
                  }
                  await closeOrder({ orderId: oid!, payments: [{ method, amount: cartTotal }] }).unwrap();
                  setLastOrderTotal(cartTotal);
                  setSessionTotal(s => s + cartTotal);
                  setCart([]);
                  setOrderId(null);
                  setShowPayModal(false);
                  flash(`✅ ${formatCurrency(cartTotal)} — ${method}`, 2000);
                } catch (e: any) { flash('❌ ' + (e?.data?.message || t('failed'))); setShowPayModal(false); }
              }}
                className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-white font-bold mb-2 transition">
                {method === 'CASH' ? '💵' : method === 'CARD' ? '💳' : '📱'} {method === 'CASH' ? t('pos.cash') : method === 'CARD' ? t('pos.card') : t('pos.ewallet')}
              </button>
            ))}
            <button onClick={() => setShowPayModal(false)}
              className="w-full py-2 text-gray-400 text-sm hover:text-gray-300">{t('cancel')}</button>
          </div>
        </div>
      )}

      {/* ── Manage Match Mode Items Modal ─────────────────────────────────── */}
      {showManageModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg flex flex-col max-h-[85vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
              <h2 className="font-bold text-base text-white">{t('matchMode.manageItemsTitle')}</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{selectedIds.size} {isRTL ? 'محدد' : 'selected'}</span>
                <button onClick={() => setShowManageModal(false)}
                  className="text-gray-400 hover:text-white text-lg leading-none px-1">✕</button>
              </div>
            </div>

            {/* Search */}
            <div className="px-4 pt-3 pb-2">
              <input
                type="text"
                value={manageSearch}
                onChange={e => setManageSearch(e.target.value)}
                placeholder={t('matchMode.searchProducts')}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:border-yellow-500"
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>

            {/* Quick actions */}
            <div className="px-4 pb-2 flex gap-2">
              <button
                onClick={() => setSelectedIds(new Set(allMenuProducts.map((p: any) => p.id)))}
                className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition">
                {isRTL ? 'تحديد الكل' : 'Select all'}
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition">
                {isRTL ? 'إلغاء الكل' : 'Clear all'}
              </button>
            </div>

            {/* Product list */}
            <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-1">
              {allMenuProducts
                .filter((p: any) =>
                  !manageSearch ||
                  p.name?.toLowerCase().includes(manageSearch.toLowerCase()) ||
                  p.sku?.toLowerCase().includes(manageSearch.toLowerCase())
                )
                .map((p: any) => {
                  const checked = selectedIds.has(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleProduct(p.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition
                        ${checked ? 'bg-yellow-600/30 border border-yellow-500/50' : 'bg-gray-800 border border-transparent hover:bg-gray-700'}`}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    >
                      {/* Checkbox visual */}
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border-2 transition
                        ${checked ? 'bg-yellow-500 border-yellow-500' : 'border-gray-500'}`}>
                        {checked && <span className="text-gray-900 text-xs font-black">✓</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{p.name}</div>
                        {p.categoryName && (
                          <div className="text-xs text-gray-400 truncate">{p.categoryName}</div>
                        )}
                      </div>
                      <div className="text-yellow-400 text-sm font-bold flex-shrink-0">
                        {formatCurrency(p.sellingPrice)}
                      </div>
                    </button>
                  );
                })}
            </div>

            {/* Save button */}
            <div className="px-4 py-3 border-t border-gray-700">
              <button
                onClick={saveMatchItems}
                className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-black rounded-xl transition text-sm">
                {t('matchMode.saveItems')} ({selectedIds.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
