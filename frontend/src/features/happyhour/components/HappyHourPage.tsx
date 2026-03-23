import { useI18n } from '../../../i18n';
import { useState } from 'react';
import { baseApi } from '../../../app/baseApi';

const hhApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getHappyHours: b.query<any, void>({ query: () => '/happy-hours', providesTags: ['HappyHour'] }),
    createHH: b.mutation<any, any>({ query: (body) => ({ url: '/happy-hours', method: 'POST', body }), invalidatesTags: ['HappyHour'] }),
    toggleHH: b.mutation<any, string>({ query: (id) => ({ url: `/happy-hours/${id}/toggle`, method: 'PATCH' }), invalidatesTags: ['HappyHour'] }),
    deleteHH: b.mutation<any, string>({ query: (id) => ({ url: `/happy-hours/${id}`, method: 'DELETE' }), invalidatesTags: ['HappyHour'] }),
  }),
  overrideExisting: false,
});
const { useGetHappyHoursQuery, useCreateHHMutation, useToggleHHMutation, useDeleteHHMutation } = hhApi;

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const BLANK = { name: '', discountPercent: '', startTime: '15:00', endTime: '17:00', daysOfWeek: 'MON,TUE,WED,THU,FRI,SAT,SUN' };

export default function HappyHourPage() {
  const { t, isRTL } = useI18n();
  const { data, isLoading, refetch } = useGetHappyHoursQuery();
  const [createHH] = useCreateHHMutation();
  const [toggleHH] = useToggleHHMutation();
  const [deleteHH] = useDeleteHHMutation();

  const hours = data?.data || [];
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<any>(BLANK);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const toggleDay = (day: string) => {
    const current = form.daysOfWeek ? form.daysOfWeek.split(',').filter(Boolean) : [];
    const next = current.includes(day) ? current.filter((d: string) => d !== day) : [...current, day];
    set('daysOfWeek', next.join(','));
  };

  const handleCreate = async () => {
    if (!form.name || !form.discountPercent) { setError(`${t('promotions.title')} — ${t('required')}`); return; }
    setSaving(true); setError('');
    try { await createHH(form).unwrap(); setShowCreate(false); setForm(BLANK); refetch(); }
    catch (e: any) { setError(e?.data?.message || t('failed')); }
    finally { setSaving(false); }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">{`⚡ ${t('nav.happyHours')}`}</h1>
        <button onClick={() => { setShowCreate(true); setError(''); }}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-sm">
          + Add Happy Hour
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center flex-1 text-slate-400">Loading...</div>
      ) : hours.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-slate-300">
            <div className="text-6xl mb-3">⚡</div>
            <div className="text-lg font-medium">{t('noData')}</div>
            <div className="text-sm mt-1">{t('promotions.title')}</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {hours.map((h: any) => (
            <div key={h.id} className={`bg-white rounded-2xl shadow-sm border-2 p-5 ${h.active ? 'border-orange-200' : 'border-slate-100 opacity-60'}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-bold text-slate-800 text-lg">{h.name}</div>
                  <div className="text-3xl font-black text-orange-500 mt-1">{h.discountPercent}% OFF</div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${h.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                  {h.active ? '● Active' : '○ Off'}
                </span>
              </div>
              <div className="text-slate-600 text-sm font-medium mb-2">
                🕒 {h.startTime} — {h.endTime}
              </div>
              <div className="flex gap-1 flex-wrap mb-4">
                {DAYS.map(d => (
                  <span key={d} className={`px-2 py-0.5 rounded-lg text-xs font-bold ${(h.daysOfWeek||'').includes(d) ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-300'}`}>{d}</span>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={async () => { await toggleHH(h.id); refetch(); }}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${h.active ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                  {h.active ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={async () => { if (confirm(`${t('delete')}?`)) { await deleteHH(h.id); refetch(); } }}
                  className="px-3 py-2 rounded-xl text-sm font-semibold bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition">
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="font-bold text-lg mb-4">⚡ New Happy Hour</h2>
            {error && <div className="mb-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
            <div className="space-y-3">
              <input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Name (e.g. Afternoon Happy Hour) *"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-orange-400" />
              <div>
                <label className="text-xs text-slate-500 block mb-1">Discount %</label>
                <input type="number" value={form.discountPercent} onChange={e => set('discountPercent', e.target.value)}
                  placeholder="e.g. 20" min={1} max={100}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">{t('promotions.startTime')}</label>
                  <input type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">{t('promotions.endTime')}</label>
                  <input type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-2">Days</label>
                <div className="flex gap-1.5 flex-wrap">
                  {DAYS.map(d => {
                    const active = (form.daysOfWeek||'').includes(d);
                    return (
                      <button key={d} type="button" onClick={() => toggleDay(d)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${active ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowCreate(false); setError(''); setForm(BLANK); }}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 text-sm">{t('cancel')}</button>
              <button onClick={handleCreate} disabled={saving}
                className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white font-bold rounded-xl text-sm">
                {saving ? 'Saving...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
