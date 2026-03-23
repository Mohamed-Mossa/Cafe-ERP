import { useState } from 'react';
import { baseApi } from '../../../app/baseApi';
import { useI18n } from '../../../i18n';
import { formatCurrency } from '../../../utils/currency';

const qrApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getQrCategories: b.query<any, void>({ query: () => '/menu/categories' }),
    getQrProducts: b.query<any, void>({ query: () => '/menu/products?all=false' }),
  }),
  overrideExisting: false,
});
const { useGetQrCategoriesQuery, useGetQrProductsQuery } = qrApi;

export default function QRMenuPage() {
  const { t } = useI18n();
  const { data: catRes } = useGetQrCategoriesQuery();
  const { data: prodRes } = useGetQrProductsQuery();
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const categories: any[] = (catRes?.data || []).filter((c: any) => c.active !== false && !c.deleted);
  const allProducts: any[] = prodRes?.data || [];

  const filtered = allProducts.filter(p => {
    const matchCat = !activeCat || p.categoryId === activeCat;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const grouped = activeCat
    ? { [activeCat]: filtered }
    : categories.reduce((acc: any, cat: any) => {
        const prods = filtered.filter(p => p.categoryId === cat.id);
        if (prods.length > 0) acc[cat.id] = prods;
        return acc;
      }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl">☕</div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">{t('nav.menu')}</h1>
              <p className="text-xs text-slate-400">{allProducts.length} items available</p>
            </div>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search menu..."
            className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-amber-400 bg-white" />
        </div>
        {/* Category pills */}
        <div className="max-w-2xl mx-auto px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setActiveCat(null)}
              className={`flex-shrink-0 px-4 py-2 rounded-2xl text-sm font-semibold transition whitespace-nowrap ${
                !activeCat ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              🍽️ All
            </button>
            {categories.map((cat: any) => (
              <button key={cat.id} onClick={() => setActiveCat(activeCat === cat.id ? null : cat.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-2xl text-sm font-semibold transition whitespace-nowrap ${
                  activeCat === cat.id ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {cat.icon || '•'} {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div className="max-w-2xl mx-auto px-4 py-4 pb-20 space-y-8">
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <div className="text-5xl mb-3">🍽️</div>
            <p className="font-medium">{t('noData')}</p>
          </div>
        ) : Object.entries(grouped).map(([catId, products]: [string, any]) => {
          const cat = categories.find((c: any) => c.id === catId);
          return (
            <div key={catId}>
              {!activeCat && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{cat?.icon || '🍽️'}</span>
                  <h2 className="text-lg font-black text-slate-800">{cat?.name || 'Other'}</h2>
                  <div className="flex-1 h-px bg-amber-200 ml-2" />
                </div>
              )}
              <div className="space-y-3">
                {(products as any[]).map((product: any) => (
                  <div key={product.id}
                    className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-4 hover:shadow-md transition">
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                      {cat?.icon || '🍽️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900">{product.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{cat?.name}</div>
                    </div>
                    <div className="text-lg font-black text-amber-600 flex-shrink-0">
                      {formatCurrency(product.sellingPrice)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 text-center py-3 bg-white/80 backdrop-blur-sm border-t border-slate-100">
        <p className="text-xs text-slate-400">☕ Ask staff to place your order</p>
      </div>
    </div>
  );
}
