import { useI18n } from '../../../i18n';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { useAppSelector } from '../../../app/hooks';
import { RootState } from '../../../app/store';
import { setCurrentOrder, clearCurrentOrder } from '../store/posSlice';
import { useCreateOrderMutation, useAddLineMutation, useAttachCustomerMutation, useTransferOrderMutation, useGetOrderQuery } from '../api/ordersApi';
import { baseApi } from '../../../app/baseApi';
import { Product, CafeTable, ApiResponse } from '../../../types/api.types';
import { canViewCustomerPhones } from '../../../utils/customerPrivacy';
import ProductGrid from './ProductGrid/ProductGrid';
import OrderPanel from './OrderPanel/OrderPanel';
import PaymentModal from './PaymentModal/PaymentModal';

// Sub-APIs
const posSubApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getTablesForPos: b.query<ApiResponse<CafeTable[]>, void>({ query: () => '/floor/tables' }),
    lookupCustomer: b.query<ApiResponse<any>, string>({ query: (phone) => `/customers/lookup?phone=${phone}` }),
    getCurrentHappyHour: b.query<ApiResponse<any>, void>({ query: () => '/happy-hours/current' }),
  }),
  overrideExisting: false,
});
const { useGetTablesForPosQuery, useLookupCustomerQuery, useGetCurrentHappyHourQuery } = posSubApi;

export default function POSPage() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { currentOrder } = useSelector((s: RootState) => s.pos);
  const role = useAppSelector(s => s.auth.role);
  const { t, isRTL } = useI18n();
  const canSeeCustomerPhone = canViewCustomerPhones(role);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [source, setSource] = useState<'TAKEAWAY' | 'TABLE'>('TAKEAWAY');
  const [pickedTable, setPickedTable] = useState<CafeTable | null>(null);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [gamingOrderId, setGamingOrderId] = useState<string | null>(null);
  const [tableOrderId, setTableOrderId] = useState<string | null>(null);

  const [createOrder] = useCreateOrderMutation();
  const [addLine] = useAddLineMutation();
  const [attachCustomer] = useAttachCustomerMutation();
  const [transferOrder] = useTransferOrderMutation();

  const { data: gamingOrderRes } = useGetOrderQuery(gamingOrderId!, { skip: !gamingOrderId });
  useEffect(() => {
    if (gamingOrderRes?.data && !currentOrder) {
      dispatch(setCurrentOrder(gamingOrderRes.data));
      setSource('GAMING' as any);
      setGamingOrderId(null);
      setPaymentOpen(true);
    }
  }, [gamingOrderRes]);

  const { data: tableOrderRes } = useGetOrderQuery(tableOrderId!, { skip: !tableOrderId });
  useEffect(() => {
    if (tableOrderRes?.data && !currentOrder) {
      const order = tableOrderRes.data;
      dispatch(setCurrentOrder(order));
      setSource('TABLE');
      if (order.tableName) setPickedTable({ id: order.tableId, name: order.tableName } as any);
      setTableOrderId(null);
    }
  }, [tableOrderRes]);

  const { data: tablesRes } = useGetTablesForPosQuery();
  const { data: hhRes } = useGetCurrentHappyHourQuery(undefined, { pollingInterval: 60000 });
  const { data: customerRes } = useLookupCustomerQuery(searchPhone, { skip: searchPhone.length < 7 });

  const freeTables = (tablesRes?.data || []).filter(t => t.status === 'FREE' || t.status === 'RESERVED');
  const happyHour = hhRes?.data;
  const foundCustomer = customerRes?.data;
  const orderLocked = !!currentOrder;

  useEffect(() => {
    const state = location.state as any;
    if (state?.table) { setSource('TABLE'); setPickedTable(state.table); window.history.replaceState({}, document.title); }
    if (state?.gamingOrderId) { setGamingOrderId(state.gamingOrderId); window.history.replaceState({}, document.title); }
    if (state?.tableOrderId) { setTableOrderId(state.tableOrderId); window.history.replaceState({}, document.title); }
  }, []);

  const handleProductClick = async (product: Product) => {
    if (source === 'TABLE' && !pickedTable && !currentOrder) { setShowTablePicker(true); return; }
    try {
      let order = currentOrder;
      if (!order) {
        const body: any = { source };
        if (source === 'TABLE' && pickedTable) { body.tableId = pickedTable.id; body.tableName = pickedTable.name; }
        const res = await createOrder(body).unwrap();
        order = res.data;
        dispatch(setCurrentOrder(order));
      }
      const updated = await addLine({ orderId: order.id, productId: product.id, quantity: 1 }).unwrap();
      dispatch(setCurrentOrder(updated.data));
    } catch (err: any) { alert(err?.data?.message || 'Failed to add item'); }
  };

  const handleClear = () => { dispatch(clearCurrentOrder()); setPickedTable(null); setSource('TAKEAWAY'); };

  const handleAttachCustomer = async (customer: any) => {
    if (!currentOrder) return;
    const res = await attachCustomer({ orderId: currentOrder.id, customerId: customer.id, customerName: customer.fullName }).unwrap();
    dispatch(setCurrentOrder(res.data));
    setShowCustomerSearch(false);
    setCustomerPhone('');
    setSearchPhone('');
  };

  const handleTransfer = async (table: CafeTable) => {
    if (!currentOrder) return;
    const res = await transferOrder({ orderId: currentOrder.id, tableId: table.id, tableName: table.name }).unwrap();
    dispatch(setCurrentOrder(res.data));
    setPickedTable(table);
    setShowTransfer(false);
  };

  const SOURCES = [
    { key: 'TAKEAWAY', icon: '🥡', label: t('pos.takeaway') },
    { key: 'TABLE',    icon: '🪑', label: isRTL ? 'أكل داخل' : 'Dine-In' },
  ];

  const openReceipt = (orderId: string) => {
    window.open(`${window.location.pathname}#/receipt/${orderId}`, '_blank');
  };

  return (
    <div className="h-full flex flex-col gap-3">
      {/* ── Top bar ── */}
      <div className={`flex items-center gap-2 bg-white rounded-2xl shadow-sm px-4 py-2.5 flex-shrink-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <span className="text-sm font-medium text-slate-400">{isRTL ? ':أوردر لـ' : 'Order for:'}</span>
        {SOURCES.map(s => (
          <button key={s.key} disabled={orderLocked}
            onClick={() => { if (!orderLocked) { setSource(s.key as any); setPickedTable(null); } }}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition ${source === s.key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'} disabled:opacity-60`}>
            {s.icon} {s.label}
          </button>
        ))}

        {source === 'TABLE' && (
          <button disabled={orderLocked} onClick={() => { if (!orderLocked) setShowTablePicker(true); }}
            className={`px-3 py-1.5 rounded-xl text-sm font-semibold border-2 transition ${pickedTable ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-dashed border-slate-300 text-slate-400 hover:border-blue-400'} disabled:opacity-60`}>
            {pickedTable ? `🪑 ${pickedTable.name}` : (isRTL ? '+ اختار طاولة' : '+ Pick Table')}
          </button>
        )}

        {currentOrder && (
          <>
            {currentOrder.customerName ? (
              <span className="px-3 py-1.5 rounded-xl text-sm font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                👤 {currentOrder.customerName}
              </span>
            ) : (
              <button onClick={() => setShowCustomerSearch(true)}
                className="px-3 py-1.5 rounded-xl text-sm font-medium bg-slate-100 text-slate-500 hover:bg-amber-50 hover:text-amber-700 border border-transparent hover:border-amber-200 transition">
                {isRTL ? '+ عميل' : '+ Customer'}
              </button>
            )}
            {source === 'TABLE' && (
              <button onClick={() => setShowTransfer(true)}
                className="px-3 py-1.5 rounded-xl text-sm font-medium bg-slate-100 text-slate-500 hover:bg-purple-50 hover:text-purple-700 transition">
                ↔ {t('pos.transferOrder')}
              </button>
            )}
          </>
        )}

        {happyHour?.active && (
          <div className={`${isRTL ? 'mr-auto' : 'ml-auto'} flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-xl`}>
            <span className="text-orange-500 text-sm">⚡</span>
            <span className="text-xs font-bold text-orange-600">{t('pos.happyHourActive')} {happyHour.discountPercent}% OFF</span>
          </div>
        )}
      </div>

      {/* ── Main area ── */}
      <div className={`flex-1 flex gap-4 min-h-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className="flex-1 overflow-hidden"><ProductGrid onProductClick={handleProductClick} /></div>
        <div className="w-96 flex-shrink-0">
          <OrderPanel order={currentOrder} onPay={() => setPaymentOpen(true)} onClearOrder={handleClear} />
        </div>
      </div>

      {/* ── Modals ── */}
      {paymentOpen && currentOrder && (
        <PaymentModal order={currentOrder} onClose={() => setPaymentOpen(false)}
          onSuccess={(orderId) => { 
            setPaymentOpen(false); 
            openReceipt(orderId);
            setTimeout(() => handleClear(), 150); 
          }} />
      )}

      {/* Table picker */}
      {showTablePicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h2 className="font-bold text-lg mb-4">🪑 {t('pos.selectTable')}</h2>
            {freeTables.length === 0
              ? <p className="text-slate-400 text-center py-8">{isRTL ? 'مفيش طاولات فاضية' : 'No free tables available'}</p>
              : <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                {freeTables.map(tb => (
                  <button key={tb.id} onClick={() => { 
                      if (tb.status === 'RESERVED') {
                        if (!window.confirm(isRTL ? 'الطاولة دي محجوزة. متأكد إنك عايز تفتح أوردر؟' : 'This table is reserved. Are you sure you want to open an order?')) return;
                      }
                      setPickedTable(tb); setShowTablePicker(false); 
                    }}
                    className={`p-4 hover:shadow-md border-2 rounded-2xl text-center transition ${
                      tb.status === 'RESERVED' 
                        ? 'bg-purple-50 hover:bg-purple-100 border-purple-200 hover:border-purple-400' 
                        : 'bg-green-50 hover:bg-green-100 border-green-200 hover:border-green-400'
                    }`}>
                    <div className={`font-bold text-lg ${tb.status === 'RESERVED' ? 'text-purple-800' : 'text-green-800'}`}>{tb.name}</div>
                    <div className={`text-xs mt-1 ${tb.status === 'RESERVED' ? 'text-purple-600' : 'text-green-600'}`}>
                      {tb.status === 'RESERVED' ? '🟣 ' : '👥 '}{tb.capacity} {t('floor.seats')}
                    </div>
                  </button>
                ))}
              </div>}
            <button onClick={() => setShowTablePicker(false)} className="mt-4 w-full py-2 border border-slate-200 rounded-xl text-slate-400 text-sm">{t('cancel')}</button>
          </div>
        </div>
      )}

      {/* Transfer order */}
      {showTransfer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h2 className="font-bold text-lg mb-1">↔ {t('pos.transferOrder')}</h2>
            <p className="text-sm text-slate-400 mb-4">{isRTL ? 'انقل الأوردر لطاولة تانية' : 'Move this order to a different table'}</p>
            {freeTables.filter(tb => tb.id !== pickedTable?.id).length === 0
              ? <p className="text-slate-400 text-center py-8">{isRTL ? 'مفيش طاولات تانية فاضية' : 'No other free tables'}</p>
              : <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                {freeTables.filter(tb => tb.id !== pickedTable?.id).map(tb => (
                  <button key={tb.id} onClick={() => handleTransfer(tb)}
                    className="p-4 bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 hover:border-purple-400 rounded-2xl text-center transition">
                    <div className="font-bold text-purple-800 text-lg">{tb.name}</div>
                    <div className="text-xs text-purple-600 mt-1">👥 {tb.capacity}</div>
                  </button>
                ))}
              </div>}
            <button onClick={() => setShowTransfer(false)} className="mt-4 w-full py-2 border border-slate-200 rounded-xl text-slate-400 text-sm">{t('cancel')}</button>
          </div>
        </div>
      )}

      {/* Customer search */}
      {showCustomerSearch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="font-bold text-lg mb-4">👤 {isRTL ? 'إضافة عميل' : 'Attach Customer'}</h2>
            <input value={customerPhone} onChange={e => { setCustomerPhone(e.target.value); if (e.target.value.length >= 7) setSearchPhone(e.target.value); }}
              placeholder={isRTL ? 'رقم الموبايل (7 أرقام على الأقل)' : 'Phone number (min 7 digits)'} autoFocus
              className="w-full px-4 py-3 border-2 border-slate-200 focus:border-blue-500 rounded-xl text-base outline-none mb-3" dir="ltr" />
            {foundCustomer ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-3">
                <div className="font-bold text-green-800">{foundCustomer.fullName}</div>
                {canSeeCustomerPhone && foundCustomer.phone && <div className="text-sm text-green-600">{foundCustomer.phone}</div>}
                <div className="text-xs text-amber-600 font-semibold mt-1">⭐ {foundCustomer.totalPoints} {isRTL ? 'نقطة' : 'points'} · {foundCustomer.tier}</div>
                <button onClick={() => handleAttachCustomer(foundCustomer)}
                  className="mt-3 w-full py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm">
                  {isRTL ? 'إضافة للأوردر' : 'Attach to Order'}
                </button>
              </div>
            ) : customerPhone.length >= 7 ? (
              <p className="text-slate-400 text-sm text-center py-2">{isRTL ? 'مش لاقي العميل' : 'Customer not found'}</p>
            ) : null}
            <button onClick={() => { setShowCustomerSearch(false); setCustomerPhone(''); setSearchPhone(''); }}
              className="w-full py-2 border border-slate-200 rounded-xl text-slate-400 text-sm">{t('cancel')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
