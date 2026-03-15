import { useI18n } from '../../../../i18n';
import { useState } from 'react';
import { Order, PaymentMethod } from '../../../../types/api.types';
import { useProcessPaymentMutation } from '../../api/ordersApi';
import { baseApi } from '../../../../app/baseApi';
import { formatCurrency } from '../../../../utils/currency';

interface PayEntry { method: PaymentMethod; amount: string; reference: string; }
interface Props { order: Order; onClose: () => void; onSuccess: (orderId: string) => void; }

const creditApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getCustomerCredit: b.query<any, string>({ query: (id) => `/customers/${id}/credit` }),
  }),
  overrideExisting: false,
});
const { useGetCustomerCreditQuery } = creditApi;

const METHOD_META: Record<PaymentMethod, { label: string; icon: string }> = {
  CASH:    { label: 'Cash',    icon: '💵' },
  CARD:    { label: 'Card',    icon: '💳' },
  EWALLET: { label: 'Wallet',  icon: '📱' },
  CREDIT:  { label: 'Credit',  icon: '📋' },
};

const blankEntry = (method: PaymentMethod = 'CASH', amount = ''): PayEntry => ({ method, amount, reference: '' });

export default function PaymentModal({ order, onClose, onSuccess }: Props) {
  const [entries, setEntries] = useState<PayEntry[]>([blankEntry('CASH', String(order.grandTotal))]);
  const [error, setError] = useState('');
  const [processPayment, { isLoading }] = useProcessPaymentMutation();

  const { data: creditRes } = useGetCustomerCreditQuery(order.customerId!, { skip: !order.customerId });
  const availableCredit: number = creditRes?.data ?? 0;

  const totalEntered = entries.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const remaining = order.grandTotal - totalEntered;
  const isExact = totalEntered >= order.grandTotal;
  const change = totalEntered - order.grandTotal;
  const creditUsed = entries.filter(e => e.method === 'CREDIT').reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const creditExceeded = creditUsed > availableCredit;

  const setEntry = (i: number, patch: Partial<PayEntry>) =>
    setEntries(prev => prev.map((e, idx) => idx === i ? { ...e, ...patch } : e));

  const addEntry = () => {
    const rem = Math.max(0, remaining);
    setEntries(prev => [...prev, blankEntry('CARD', String(rem || ''))]);
  };

  const removeEntry = (i: number) => setEntries(prev => prev.filter((_, idx) => idx !== i));

  const handleConfirm = async () => {
    if (!isExact) { setError(`Still ${formatCurrency(remaining)} short`); return; }
    if (creditExceeded) { setError(`Credit used (${formatCurrency(creditUsed)}) exceeds balance (${formatCurrency(availableCredit)})`); return; }
    setError('');
    try {
      await processPayment({
        orderId: order.id,
        payments: entries.map(e => ({
          method: e.method,
          amount: parseFloat(e.amount) || 0,
          reference: e.reference || undefined,
        })),
      }).unwrap();
      onSuccess(order.id);
    } catch (e: any) { setError(e?.data?.message || 'Payment failed'); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-bold text-lg text-slate-800">Process Payment</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Order #{order.orderNumber}
              {order.customerName && ` · ${order.customerName}`}
              {order.loyaltyPointsEarned != null && order.loyaltyPointsEarned > 0 &&
                <span className="ml-2 text-amber-600 font-semibold">+{order.loyaltyPointsEarned} pts</span>}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Amount due */}
          <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center">
            <span className="text-sm text-slate-500">Total Due</span>
            <span className="text-2xl font-black text-slate-900">{formatCurrency(order.grandTotal)}</span>
          </div>

          {/* Customer credit balance banner */}
          {order.customerId && (
            <div className={`rounded-xl p-3 flex justify-between items-center text-sm ${availableCredit > 0 ? 'bg-purple-50 border border-purple-200' : 'bg-slate-50'}`}>
              <span className="text-slate-600">📋 Customer Credit Balance</span>
              <span className={`font-bold ${availableCredit > 0 ? 'text-purple-700' : 'text-slate-400'}`}>
                {formatCurrency(availableCredit)}
              </span>
            </div>
          )}

          {/* Payment entries */}
          {entries.map((entry, i) => (
            <div key={i} className="border-2 border-slate-100 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Payment {entries.length > 1 ? `#${i + 1}` : ''}
                </span>
                {entries.length > 1 && (
                  <button onClick={() => removeEntry(i)} className="text-red-400 hover:text-red-600 text-sm">Remove</button>
                )}
              </div>
              {/* Method selector */}
              <div className="grid grid-cols-4 gap-1.5">
                {(Object.keys(METHOD_META) as PaymentMethod[]).map(m => (
                  <button key={m} onClick={() => setEntry(i, { method: m })}
                    disabled={m === 'CREDIT' && !order.customerId}
                    className={`flex flex-col items-center py-2 rounded-xl border-2 text-xs font-semibold transition ${
                      entry.method === m ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : m === 'CREDIT' && !order.customerId ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                      : 'border-slate-200 text-slate-400 hover:border-slate-300'
                    }`}>
                    <span className="text-base">{METHOD_META[m].icon}</span>
                    {METHOD_META[m].label}
                  </button>
                ))}
              </div>
              {/* Credit hint */}
              {entry.method === 'CREDIT' && order.customerId && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-purple-600">Available: {formatCurrency(availableCredit)}</span>
                  <button onClick={() => setEntry(i, { amount: String(Math.min(availableCredit, parseFloat(entry.amount) || order.grandTotal)) })}
                    className="text-purple-600 underline hover:text-purple-800">Use max</button>
                </div>
              )}
              {/* Amount */}
              <input type="number"
                value={entry.amount}
                onChange={e => setEntry(i, { amount: e.target.value })}
                placeholder="Amount"
                className={`w-full px-3 py-2 border-2 rounded-xl text-xl font-black text-center outline-none ${
                  entry.method === 'CREDIT' && creditExceeded ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                }`}
                autoFocus={i === 0} />
              {/* Reference for card/ewallet */}
              {(entry.method === 'CARD' || entry.method === 'EWALLET') && (
                <input value={entry.reference}
                  onChange={e => setEntry(i, { reference: e.target.value })}
                  placeholder="Reference / Transaction ID"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />
              )}
            </div>
          ))}

          {/* Add split button */}
          <button onClick={addEntry}
            className="w-full py-2 border-2 border-dashed border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-500 rounded-xl text-sm font-medium transition">
            + Split Payment
          </button>

          {/* Summary */}
          <div className="bg-slate-50 rounded-xl p-3 space-y-1">
            <div className="flex justify-between text-sm text-slate-500">
              <span>Total entered</span><span className="font-semibold">{formatCurrency(totalEntered)}</span>
            </div>
            {remaining > 0 && (
              <div className="flex justify-between text-sm text-red-500 font-semibold">
                <span>Still needed</span><span>{formatCurrency(remaining)}</span>
              </div>
            )}
            {entries.length === 1 && entries[0].method === 'CASH' && change > 0 && (
              <div className="flex justify-between text-sm text-green-600 font-bold">
                <span>Change due</span><span>{formatCurrency(change)}</span>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm font-medium">{error}</div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 pt-0 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 text-sm font-medium">Cancel</button>
          <button onClick={handleConfirm} disabled={isLoading || !isExact || creditExceeded}
            className="flex-1 py-3 bg-green-500 hover:bg-green-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-xl transition">
            {isLoading ? '...' : `✓ Confirm ${formatCurrency(order.grandTotal)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
