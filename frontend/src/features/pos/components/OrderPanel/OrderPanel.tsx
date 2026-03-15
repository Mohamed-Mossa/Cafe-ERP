import { useI18n } from '../../../../i18n';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../../app/store';
import { Order } from '../../../../types/api.types';
import {
  useRemoveLineMutation, useApplyDiscountMutation,
  useApplyPromoMutation, useUpdateLineNotesMutation, useCancelOrderMutation,
} from '../../api/ordersApi';
import { setCurrentOrder } from '../../store/posSlice';
import { formatCurrency } from '../../../../utils/currency';

interface Props { order: Order | null; onPay: () => void; onClearOrder: () => void; }

export default function OrderPanel({ order, onPay, onClearOrder }: Props) {
  const dispatch = useDispatch();
  const { maxDiscountPercent } = useSelector((s: RootState) => s.auth);
  const { t, isRTL } = useI18n();

  const [removeLine] = useRemoveLineMutation();
  const [applyDiscount] = useApplyDiscountMutation();
  const [applyPromo] = useApplyPromoMutation();
  const [updateLineNotes] = useUpdateLineNotesMutation();
  const [cancelOrder] = useCancelOrderMutation();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const handleCancelOrder = async () => {
    if (!order) return;
    try {
      await cancelOrder({ orderId: order.id, reason: cancelReason || undefined }).unwrap();
      onClearOrder();
      setShowCancelConfirm(false);
      setCancelReason('');
    } catch (err: any) { alert(err?.data?.message || 'Cancel failed'); }
  };

  const [mode, setMode] = useState<'none' | 'discount' | 'promo'>('none');
  const [discountVal, setDiscountVal] = useState('');
  const [promoVal, setPromoVal] = useState('');
  const [promoError, setPromoError] = useState('');
  const [editingNoteFor, setEditingNoteFor] = useState<string | null>(null);
  const [noteVal, setNoteVal] = useState('');

  const handleRemoveLine = async (lineId: string) => {
    if (!order) return;
    try {
      const res = await removeLine({ orderId: order.id, lineId }).unwrap();
      dispatch(setCurrentOrder(res.data));
    } catch (err: any) { console.error('Remove line failed:', err?.data?.message); }
  };

  const handleApplyDiscount = async () => {
    if (!order || !discountVal) return;
    const pct = parseFloat(discountVal);
    if (isNaN(pct) || pct < 0) return;
    try {
      const res = await applyDiscount({ orderId: order.id, discountPercent: pct }).unwrap();
      dispatch(setCurrentOrder(res.data));
      setMode('none'); setDiscountVal('');
    } catch (err: any) { alert(err?.data?.message || 'Discount failed'); }
  };

  const handleApplyPromo = async () => {
    if (!order || !promoVal.trim()) return;
    setPromoError('');
    try {
      const res = await applyPromo({ orderId: order.id, promoCode: promoVal.trim() }).unwrap();
      dispatch(setCurrentOrder(res.data));
      setMode('none'); setPromoVal('');
    } catch (err: any) { setPromoError(err?.data?.message || 'Invalid promo code'); }
  };

  const openNoteEditor = (lineId: string, currentNote: string) => {
    setEditingNoteFor(lineId);
    setNoteVal(currentNote || '');
  };

  const saveNote = async () => {
    if (!order || !editingNoteFor) return;
    try {
      const res = await updateLineNotes({ orderId: order.id, lineId: editingNoteFor, notes: noteVal }).unwrap();
      dispatch(setCurrentOrder(res.data));
    } catch {}
    setEditingNoteFor(null);
  };

  if (!order) {
    return (
      <div className="h-full bg-white rounded-2xl shadow-sm flex flex-col items-center justify-center text-slate-400 gap-3">
        <span className="text-6xl">🛒</span>
        <p className="text-sm font-medium">{t('pos.empty')}</p>
        <p className="text-xs">{isRTL ? 'اضغط على صنف عشان تبدأ' : 'Click a product to start'}</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-white rounded-2xl shadow-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className={`p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div>
          <div className="font-bold text-slate-800">{t('pos.orderNum')}{order.orderNumber}</div>
          <div className="text-xs text-slate-500">
            {order.source}{order.tableName ? ` · ${order.tableName}` : ''}
            {order.customerName ? ` · ${order.customerName}` : ''}
          </div>
        </div>
        <button onClick={() => setShowCancelConfirm(true)} className="text-xs text-red-400 hover:text-red-600 px-2 py-1 hover:bg-red-50 rounded-lg transition">
          🚫 {t('pos.cancelOrder')}
        </button>
      </div>

      {/* Lines */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {order.lines.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-8">{t('pos.empty')}</p>
        ) : order.lines.map(line => (
          <div key={line.id} className="p-3 bg-slate-50 rounded-xl group">
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800 truncate">{line.productName}</div>
                <div className="text-xs text-slate-400 mt-0.5">× {line.quantity} @ {formatCurrency(line.unitPrice)}</div>
              </div>
              <div className="text-sm font-bold text-slate-800 flex-shrink-0">{formatCurrency(line.totalPrice)}</div>
              <button
                onClick={() => openNoteEditor(line.id, line.notes || '')}
                title="Add note"
                className="text-slate-300 hover:text-blue-400 w-6 h-6 flex items-center justify-center rounded-full hover:bg-blue-50 transition flex-shrink-0 text-sm leading-none"
              >✏️</button>
              <button onClick={() => handleRemoveLine(line.id)}
                className="text-slate-300 hover:text-red-500 w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 transition flex-shrink-0 text-lg leading-none">
                ×
              </button>
            </div>

            {/* Inline note editor */}
            {editingNoteFor === line.id ? (
              <div className="mt-2 flex gap-1">
                <input
                  value={noteVal}
                  onChange={e => setNoteVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveNote(); if (e.key === 'Escape') setEditingNoteFor(null); }}
                  placeholder="e.g. no sugar, well done..."
                  autoFocus
                  className="flex-1 px-2 py-1 text-xs rounded-lg border border-blue-300 outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                />
                <button onClick={saveNote} className="px-2 py-1 bg-blue-500 text-white text-xs rounded-lg font-medium hover:bg-blue-600">✓</button>
                <button onClick={() => setEditingNoteFor(null)} className="px-2 py-1 bg-slate-200 text-slate-500 text-xs rounded-lg hover:bg-slate-300">✕</button>
              </div>
            ) : line.notes ? (
              <div className="mt-1 text-xs text-blue-600 italic pl-1 cursor-pointer hover:text-blue-800"
                onClick={() => openNoteEditor(line.id, line.notes || '')}>
                📝 {line.notes}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {/* Discount / Promo controls */}
      <div className="px-3 pb-2">
        {mode === 'none' && (
          <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button onClick={() => setMode('discount')}
              className="flex-1 py-2 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition">
              % {t('pos.discount')}
            </button>
            <button onClick={() => { setMode('promo'); setPromoError(''); }}
              className="flex-1 py-2 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-green-50 hover:text-green-600 rounded-xl transition">
              🎟 {t('pos.promoCode')}
            </button>
          </div>
        )}
        {mode === 'discount' && (
          <div className="flex gap-2 items-center">
            <input type="number" value={discountVal}
              onChange={e => setDiscountVal(e.target.value)}
              placeholder={`0–${maxDiscountPercent ?? 100}%`}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm text-center font-bold outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus min={0} max={maxDiscountPercent ?? 100} />
            <button onClick={handleApplyDiscount} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl">OK</button>
            <button onClick={() => { setMode('none'); setDiscountVal(''); }} className="px-3 py-2 bg-slate-100 text-slate-500 text-sm rounded-xl">✕</button>
          </div>
        )}
        {mode === 'promo' && (
          <div className="space-y-1">
            <div className={`flex gap-2 items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
              <input value={promoVal}
                onChange={e => { setPromoVal(e.target.value.toUpperCase()); setPromoError(''); }}
                placeholder={isRTL ? 'ادخل الكود' : 'ENTER CODE'}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono uppercase tracking-widest text-center outline-none focus:ring-2 focus:ring-green-500"
                autoFocus dir="ltr" />
              <button onClick={handleApplyPromo} className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl">{t('pos.applyPromo')}</button>
              <button onClick={() => { setMode('none'); setPromoVal(''); setPromoError(''); }} className="px-3 py-2 bg-slate-100 text-slate-500 text-sm rounded-xl">✕</button>
            </div>
            {promoError && <p className="text-xs text-red-500 px-1">{promoError}</p>}
          </div>
        )}
      </div>

      {/* Totals + Pay */}
      <div className="p-4 border-t border-slate-100 space-y-2">
        <div className={`flex justify-between text-sm text-slate-500 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <span>{t('pos.subtotal')}</span><span>{formatCurrency(order.subtotal)}</span>
        </div>
        {order.discountAmount > 0 && (
          <div className={`flex justify-between text-sm text-green-600 font-medium ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span>{t('pos.discount')} {order.promoCodeApplied ? `(${order.promoCodeApplied})` : ''}</span>
            <span>− {formatCurrency(order.discountAmount)}</span>
          </div>
        )}
        {order.taxAmount > 0 && (
          <div className={`flex justify-between text-sm text-slate-500 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span>{t('pos.tax')}</span><span>{formatCurrency(order.taxAmount)}</span>
          </div>
        )}
        <div className={`flex justify-between font-black text-slate-900 text-xl pt-2 border-t border-slate-100 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <span>{t('pos.grandTotal')}</span><span>{formatCurrency(order.grandTotal)}</span>
        </div>
        <button onClick={onPay} disabled={order.lines.length === 0}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black py-4 rounded-2xl text-lg transition">
          💵 {t('pos.pay')} {formatCurrency(order.grandTotal)}
        </button>
      </div>

      {/* Cancel order confirmation */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="font-bold text-lg text-red-600 mb-1">🚫 {t('pos.cancelOrder')}</h2>
            <p className="text-sm text-slate-500 mb-4">{isRTL ? `سيتم إلغاء الأوردر رقم #${order.orderNumber} — مش هيتراجع فيه.` : `Order #${order.orderNumber} will be voided. This cannot be undone.`}</p>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder={isRTL ? 'سبب الإلغاء (اختياري)' : 'Reason for cancellation (optional)'}
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-400 resize-none mb-4"
            />
            <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button onClick={() => { setShowCancelConfirm(false); setCancelReason(''); }}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm font-medium">{isRTL ? 'خليه' : 'Keep Order'}</button>
              <button onClick={handleCancelOrder}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm transition">{t('confirm')} {t('cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
