import { useParams } from 'react-router-dom';
import { useGetReceiptQuery } from '../../pos/api/ordersApi';
import { useI18n } from '../../../i18n';
import { formatCurrency } from '../../../utils/currency';

export default function ReceiptPage() {
  const { t } = useI18n();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useGetReceiptQuery(id!);
  const order = data?.data;

  if (isLoading) return <div className="flex items-center justify-center h-full text-slate-400">Loading receipt...</div>;
  if (!order) return <div className="flex items-center justify-center h-full text-red-400">{t('noData')}</div>;

  const paidOn = order.closedAt ? new Date(order.closedAt as any).toLocaleString('en-EG') : '—';

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white w-72 shadow-2xl rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white text-center p-5">
          <div className="text-2xl mb-1">☕</div>
          <div className="font-black text-lg tracking-tight">{t('appName')}</div>
          <div className="text-xs text-slate-400 mt-1">{t('receipt.receipt')}</div>
        </div>

        <div className="p-4 space-y-3 font-mono text-xs">
          {/* Order info */}
          <div className="border-b border-dashed border-slate-200 pb-3 space-y-1">
            <div className="flex justify-between"><span className="text-slate-400">Order #</span><span className="font-bold">{order.orderNumber}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Date</span><span>{paidOn}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">{t('receipt.cashier')}</span><span>{order.cashierName}</span></div>
            {order.tableName && <div className="flex justify-between"><span className="text-slate-400">{t('receipt.table')}</span><span>{order.tableName}</span></div>}
            {order.customerName && <div className="flex justify-between"><span className="text-slate-400">{t('pos.customer')}</span><span>{order.customerName}</span></div>}
            <div className="flex justify-between"><span className="text-slate-400">Type</span><span>{order.source}</span></div>
          </div>

          {/* Items */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wide">
              <span>{t('receipt.item')}</span><span>{t('receipt.total')}</span>
            </div>
            {order.lines.map(line => (
              <div key={line.id} className="flex justify-between">
                <div className="flex-1 mr-2">
                  <div>{line.productName}</div>
                  <div className="text-slate-400">{line.quantity} × {formatCurrency(line.unitPrice)}</div>
                </div>
                <div className="font-bold whitespace-nowrap">{formatCurrency(line.totalPrice)}</div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-dashed border-slate-200 pt-3 space-y-1">
            <div className="flex justify-between"><span className="text-slate-400">{t('receipt.subtotal')}</span><span>{formatCurrency(order.subtotal)}</span></div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount {order.promoCodeApplied ? `(${order.promoCodeApplied})` : ''}</span>
                <span>- {formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            {order.taxAmount > 0 && <div className="flex justify-between"><span className="text-slate-400">Tax</span><span>{formatCurrency(order.taxAmount)}</span></div>}
            <div className="flex justify-between font-black text-base border-t border-slate-200 pt-1 mt-1">
              <span>{t('receipt.grandTotal')}</span><span>{formatCurrency(order.grandTotal)}</span>
            </div>
          </div>

          {/* Payments */}
          {order.payments && order.payments.length > 0 && (
            <div className="border-t border-dashed border-slate-200 pt-3 space-y-1">
              {order.payments.map((p: any, i: number) => (
                <div key={i} className="flex justify-between">
                  <span className="text-slate-400">{p.method}</span>
                  <span>{formatCurrency(p.amount)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Loyalty */}
          {order.loyaltyPointsEarned != null && order.loyaltyPointsEarned > 0 && (
            <div className="border-t border-dashed border-slate-200 pt-3 text-center text-amber-600 font-bold">
              ⭐ +{order.loyaltyPointsEarned} loyalty points earned!
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-dashed border-slate-200 pt-3 text-center text-slate-400 text-[10px]">
            <div>{t('receipt.thankYou')}</div>
            <div className="mt-1">{t('appName')}</div>
          </div>
        </div>

        {/* Print button */}
        <div className="p-4 border-t border-slate-100">
          <button onClick={() => window.print()}
            className="w-full py-2 bg-slate-900 hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition print:hidden">
            🖨️ Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
