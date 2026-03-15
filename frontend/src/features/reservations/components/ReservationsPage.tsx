import { useI18n } from '../../../i18n';
import { useState } from 'react';
import { baseApi } from '../../../app/baseApi';

const resApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getAllReservations: b.query<any, void>({ query: () => '/reservations' }),
    createReservation: b.mutation<any, any>({ query: (body) => ({ url: '/reservations', method: 'POST', body }) }),
    updateResStatus: b.mutation<any, { id: string; status: string }>({
      query: ({ id, status }) => ({ url: `/reservations/${id}/status`, method: 'PATCH', body: { status } }),
    }),
    markDepositPaid: b.mutation<any, string>({ query: (id) => ({ url: `/reservations/${id}/deposit`, method: 'PATCH' }) }),
    deleteReservation: b.mutation<any, string>({ query: (id) => ({ url: `/reservations/${id}`, method: 'DELETE' }) }),
  }),
  overrideExisting: false,
});
const { useGetAllReservationsQuery, useCreateReservationMutation, useUpdateResStatusMutation, useMarkDepositPaidMutation, useDeleteReservationMutation } = resApi;

const STATUS_STYLE: Record<string, string> = {
  PENDING:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  CONFIRMED: 'bg-green-50  text-green-700  border-green-200',
  SEATED:    'bg-blue-50   text-blue-700   border-blue-200',
  COMPLETED: 'bg-slate-100 text-slate-500  border-slate-200',
  CANCELLED: 'bg-red-50    text-red-500    border-red-200',
};

const today = new Date().toISOString().split('T')[0];
const BLANK = { customerName: '', customerPhone: '', tableName: '', partySize: '2', reservationDate: today, reservationTime: '19:00', durationMinutes: '120', depositAmount: '0', notes: '' };

export default function ReservationsPage() {
  const { t, isRTL } = useI18n();
  const { data, isLoading, refetch } = useGetAllReservationsQuery();
  const [create] = useCreateReservationMutation();
  const [updateStatus] = useUpdateResStatusMutation();
  const [markDeposit] = useMarkDepositPaidMutation();
  const [deleteRes] = useDeleteReservationMutation();

  const reservations = data?.data || [];
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<any>(BLANK);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const set = (k: string, v: string) => setForm((p: any) => ({ ...p, [k]: v }));

  const handleCreate = async () => {
    if (!form.customerName || !form.customerPhone || !form.reservationDate || !form.reservationTime) {
      setError('Name, phone, date and time are required'); return;
    }
    setSaving(true); setError('');
    try {
      await create(form).unwrap();
      setShowCreate(false); setForm(BLANK); refetch();
    } catch (e: any) { setError(e?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const filtered = filterStatus === 'ALL' ? reservations : reservations.filter((r: any) => r.status === filterStatus);

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">📅 Reservations</h1>
        <button onClick={() => { setShowCreate(true); setError(''); }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm">
          + New Reservation
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['ALL', 'PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELLED'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${filterStatus === s ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:bg-slate-100'}`}>
            {s} {s !== 'ALL' && `(${reservations.filter((r: any) => r.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-slate-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400">No reservations found</div>
        ) : (
          <div className="overflow-auto h-full">
            <table className="w-full">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  {['Customer', 'Date & Time', 'Party', 'Table', 'Deposit', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r: any) => (
                  <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{r.customerName}</div>
                      <div className="text-xs text-slate-400">{r.customerPhone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-slate-700">{r.reservationDate}</div>
                      <div className="text-xs text-slate-400">{r.reservationTime} · {r.durationMinutes}min</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-slate-700">👥 {r.partySize}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{r.tableName || '—'}</td>
                    <td className="px-4 py-3">
                      {r.depositAmount > 0 ? (
                        <div>
                          <div className="text-sm font-semibold text-slate-700">{r.depositAmount} EGP</div>
                          {r.depositPaid
                            ? <span className="text-xs text-green-600 font-bold">✓ Paid</span>
                            : <button onClick={async () => { await markDeposit(r.id); refetch(); }}
                                className="text-xs text-amber-600 hover:text-amber-800 font-bold">Mark Paid</button>}
                        </div>
                      ) : <span className="text-xs text-slate-300">No deposit</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold border ${STATUS_STYLE[r.status] || ''}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {r.status === 'PENDING' && (
                          <button onClick={async () => { await updateStatus({ id: r.id, status: 'CONFIRMED' }); refetch(); }}
                            className="text-xs px-2 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg font-medium">Confirm</button>
                        )}
                        {r.status === 'CONFIRMED' && (
                          <button onClick={async () => { await updateStatus({ id: r.id, status: 'SEATED' }); refetch(); }}
                            className="text-xs px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-medium">Seated</button>
                        )}
                        {r.status === 'SEATED' && (
                          <button onClick={async () => { await updateStatus({ id: r.id, status: 'COMPLETED' }); refetch(); }}
                            className="text-xs px-2 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg font-medium">Done</button>
                        )}
                        {!['COMPLETED','CANCELLED'].includes(r.status) && (
                          <button onClick={async () => { await updateStatus({ id: r.id, status: 'CANCELLED' }); refetch(); }}
                            className="text-xs px-2 py-1 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg font-medium">Cancel</button>
                        )}
                        {['COMPLETED','CANCELLED'].includes(r.status) && (
                          <button onClick={async () => { if (confirm('Delete this reservation permanently?')) { await deleteRes(r.id); refetch(); } }}
                            className="text-xs px-2 py-1 bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg font-medium">🗑 Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-lg mb-4">📅 New Reservation</h2>
            {error && <div className="mb-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
            <div className="space-y-3">
              <input value={form.customerName} onChange={e => set('customerName', e.target.value)}
                placeholder="Customer Name *" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={form.customerPhone} onChange={e => set('customerPhone', e.target.value)}
                placeholder="Phone Number *" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Date *</label>
                  <input type="date" value={form.reservationDate} onChange={e => set('reservationDate', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Time *</label>
                  <input type="time" value={form.reservationTime} onChange={e => set('reservationTime', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Party Size</label>
                  <input type="number" value={form.partySize} onChange={e => set('partySize', e.target.value)} min={1}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Duration (min)</label>
                  <input type="number" value={form.durationMinutes} onChange={e => set('durationMinutes', e.target.value)} min={30} step={30}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Deposit (EGP)</label>
                  <input type="number" value={form.depositAmount} onChange={e => set('depositAmount', e.target.value)} min={0}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <input value={form.tableName} onChange={e => set('tableName', e.target.value)}
                placeholder="Table name/preference (optional)" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                placeholder="Notes..." rows={2}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowCreate(false); setError(''); setForm(BLANK); }}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 text-sm">Cancel</button>
              <button onClick={handleCreate} disabled={saving}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-sm">
                {saving ? 'Saving...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
