import { useI18n } from '../../../../i18n';
import { useState } from 'react';
import { baseApi } from '../../../../app/baseApi';
import { Category, Product, ApiResponse } from '../../../../types/api.types';
import { formatCurrency } from '../../../../utils/currency';

const menuApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getCategories: b.query<ApiResponse<Category[]>, void>({ query: () => '/menu/categories', providesTags: ['Category'] }),
    getProducts: b.query<ApiResponse<Product[]>, string | undefined>({
      query: (catId) => catId ? `/menu/products?categoryId=${catId}` : '/menu/products',
      providesTags: ['Product'],
    }),
  }),
  overrideExisting: false,
});
const { useGetCategoriesQuery, useGetProductsQuery } = menuApi;

interface Props { onProductClick: (product: Product) => void; }

export default function ProductGrid({ onProductClick }: Props) {
  const [selectedCat, setSelectedCat] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const { data: catsRes } = useGetCategoriesQuery();
  const { data: prodsRes, isLoading } = useGetProductsQuery(selectedCat);
  const { t, isRTL } = useI18n();

  const categories = catsRes?.data || [];
  const allProducts = prodsRes?.data || [];
  const products = allProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Search */}
      <div className="p-3 border-b border-slate-100">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`🔍 ${t('search')}...`}
          className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          dir="auto"
        />
      </div>

      {/* Category tabs */}
      <div className={`flex gap-2 p-3 overflow-x-auto border-b border-slate-100 flex-shrink-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <button
          onClick={() => setSelectedCat(undefined)}
          className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition
            ${!selectedCat ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          {t('all')}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCat(cat.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition
              ${selectedCat === cat.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="text-center text-slate-400 py-12">{t('loading')}</div>
        ) : products.length === 0 ? (
          <div className="text-center text-slate-400 py-12">{t('noData')}</div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => onProductClick(product)}
                disabled={!product.active}
                className="flex flex-col items-center p-4 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border-2 border-transparent rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
              >
                <div className="text-3xl mb-2">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded-lg" />
                  ) : '🍵'}
                </div>
                <span className="text-xs font-medium text-slate-700 text-center leading-tight">{product.name}</span>
                <span className="text-sm font-bold text-blue-600 mt-1">{formatCurrency(product.sellingPrice)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
