import { useI18n } from '../../../i18n';
import { useState } from 'react';
import { baseApi } from '../../../app/baseApi';

const logApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getActivityLog: b.query<any, { page: number; size: number }>({
      query: ({ page, size }) => `/users/activity-log?page=${page}&size=${size}`,
    }),
  }),
  overrideExisting: false,
});
const { useGetActivityLogQuery } = logApi;

const ACTION_ICON: Record<string, string> = {
  LOGIN: '🔑', LOGOUT: '🚪', ORDER_CREATED: '🛒', ORDER_PAID: '💵',
  ORDER_CANCELLED: '✕', DISCOUNT_APPLIED: '%', PROMO_APPLIED: '🎟',
  SHIFT_OPENED: '🟢', SHIFT_CLOSED: '🔴', PURCHASE_RECORDED: '📦',
  WASTAGE_RECORDED: '🗑', USER_CREATED: '👤', PASSWORD_CHANGED: '🔑',
  RESERVATION_CREATED: '📅', SESSION_STARTED: '🎮', SESSION_ENDED: '⏱',
};

export default function ActivityLogPage() {
  const { t, isRTL } = useI18n();
  const [page, setPage] = useState(0);
  const { data, isLoading, isFetching } = useGetActivityLogQuery({ page, size: 50 }, { pollingInterval: 30000 });
  const logs: any[] = data?.data || [];

  const fmtTime = (ts: string) => {
    try { return new Date(ts).toLocaleString('en-EG', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }); }
    catch { return ts; }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">📋 Activity Log</h1>
        <div className="flex items-center gap-2">
          {isFetching && <span className="text-xs text-slate-400">Refreshing...</span>}
          <span className="text-xs text-slate-400">Auto-refreshes every 30s</span>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">Loading activity log...</div>
        ) : logs.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <div className="text-4xl mb-2">📋</div>
              <div>{t('activityLog.noActivity')}</div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr>
                    {['Time', 'User', 'Action', 'Details', 'Entity'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: any) => (
                    <tr key={log.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{fmtTime(log.performedAt)}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-sm text-slate-800">{log.username}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600">
                          <span>{ACTION_ICON[log.action] || '•'}</span>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">{log.details || '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {log.entityType ? <span>{log.entityType}</span> : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
              <span className="text-sm text-slate-400">{t('activityLog.title')} · {t('loading').replace('...','').trim()} {page + 1} · {logs.length} {t('reports.orderCount').toLowerCase()}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-slate-50 transition">
                  {isRTL ? 'السابق →' : '← Prev'}
                </button>
                <button onClick={() => setPage(p => p + 1)} disabled={logs.length < 50}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-slate-50 transition">
                  {isRTL ? '← التالي' : 'Next →'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
