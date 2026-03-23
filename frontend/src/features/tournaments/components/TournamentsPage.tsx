import { useI18n } from '../../../i18n';
import { useState } from 'react';
import { baseApi } from '../../../app/baseApi';
import { formatCurrency } from '../../../utils/currency';

const tournApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getTournaments: b.query<any, void>({ query: () => '/tournaments', providesTags: ['Tournament'] }),
    getTournamentDetail: b.query<any, string>({ query: (id) => `/tournaments/${id}`, providesTags: ['Tournament'] }),
    createTournament: b.mutation<any, any>({ query: (body) => ({ url: '/tournaments', method: 'POST', body }), invalidatesTags: ['Tournament'] }),
    updateTournamentStatus: b.mutation<any, { id: string; status: string }>({
      query: ({ id, status }) => ({ url: `/tournaments/${id}/status`, method: 'PATCH', body: { status } }), invalidatesTags: ['Tournament'],
    }),
    deleteTournament: b.mutation<any, string>({ query: (id) => ({ url: `/tournaments/${id}`, method: 'DELETE' }), invalidatesTags: ['Tournament'] }),
    registerPlayer: b.mutation<any, { id: string } & any>({
      query: ({ id, ...body }) => ({ url: `/tournaments/${id}/players`, method: 'POST', body }), invalidatesTags: ['Tournament'],
    }),
    updatePlayer: b.mutation<any, { playerId: string } & any>({
      query: ({ playerId, ...body }) => ({ url: `/tournaments/players/${playerId}`, method: 'PATCH', body }), invalidatesTags: ['Tournament'],
    }),
    removePlayer: b.mutation<any, string>({ query: (id) => ({ url: `/tournaments/players/${id}`, method: 'DELETE' }), invalidatesTags: ['Tournament'] }),
  }),
  overrideExisting: false,
});

const { useGetTournamentsQuery, useGetTournamentDetailQuery, useCreateTournamentMutation,
  useUpdateTournamentStatusMutation, useDeleteTournamentMutation,
  useRegisterPlayerMutation, useUpdatePlayerMutation, useRemovePlayerMutation } = tournApi;

const STATUS_STYLE: Record<string, string> = {
  UPCOMING:  'bg-blue-100 text-blue-700',
  ACTIVE:    'bg-green-100 text-green-700',
  COMPLETED: 'bg-slate-100 text-slate-600',
  CANCELLED: 'bg-red-100 text-red-500',
};

const BLANK_T = { name: '', gameName: 'FIFA', tournamentDate: '', entryFee: '0', maxPlayers: '16', prizePool: '0', notes: '' };

export default function TournamentsPage() {
  const { t, isRTL } = useI18n();
  const { data: tournsRes, isLoading } = useGetTournamentsQuery();
  const [createTournament] = useCreateTournamentMutation();
  const [updateStatus] = useUpdateTournamentStatusMutation();
  const [deleteTournament] = useDeleteTournamentMutation();
  const [registerPlayer] = useRegisterPlayerMutation();
  const [updatePlayer] = useUpdatePlayerMutation();
  const [removePlayer] = useRemovePlayerMutation();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState(BLANK_T);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [playerForm, setPlayerForm] = useState({ playerName: '', playerPhone: '', feePaid: false, notes: '' });
  const [msg, setMsg] = useState('');

  const { data: detailRes } = useGetTournamentDetailQuery(selectedId!, { skip: !selectedId, pollingInterval: 5000 });

  const tournaments = tournsRes?.data || [];
  const detail = detailRes?.data;

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleCreate = async () => {
    if (!form.name || !form.tournamentDate) { flash(`❌ ${t('required')}`); return; }
    try {
      await createTournament(form).unwrap();
      setShowCreateForm(false); setForm(BLANK_T);
      flash(`✅ ${t('saved')}`);
    } catch (e: any) { flash('❌ ' + (e?.data?.message || t('failed'))); }
  };

  const handleRegister = async () => {
    if (!playerForm.playerName) { flash(`❌ ${t('required')}`); return; }
    try {
      await registerPlayer({ id: selectedId!, ...playerForm, feeAmount: detail?.tournament?.entryFee }).unwrap();
      setShowRegisterForm(false); setPlayerForm({ playerName: '', playerPhone: '', feePaid: false, notes: '' });
      flash(`✅ ${t('saved')}`);
    } catch (e: any) { flash('❌ ' + (e?.data?.message || t('failed'))); }
  };

  const toggleFeePaid = async (player: any) => {
    try { await updatePlayer({ playerId: player.id, feePaid: !player.feePaid }).unwrap(); }
    catch { flash(`❌ ${t('failed')}`); }
  };

  const toggleCheckIn = async (player: any) => {
    try { await updatePlayer({ playerId: player.id, checkedIn: !player.checkedIn }).unwrap(); }
    catch { flash(`❌ ${t('failed')}`); }
  };

  return (
    <div className="h-full flex gap-4">
      {/* Left: Tournament List */}
      <div className="w-72 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-slate-800">{t('tournaments.title')}</h1>
          <button onClick={() => setShowCreateForm(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition">
            + New
          </button>
        </div>
        {msg && <div className={`mb-2 px-3 py-1.5 rounded-xl text-xs font-medium ${msg.startsWith('❌') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>{msg}</div>}
        <div className="flex-1 overflow-y-auto space-y-2">
          {isLoading ? <div className="text-slate-400 text-sm text-center py-8">Loading...</div> :
            tournaments.length === 0 ? <div className="text-slate-400 text-sm text-center py-8">{t('noData')}</div> :
            tournaments.map((t: any) => (
              <button key={t.id} onClick={() => setSelectedId(t.id)}
                className={`w-full text-left rounded-xl p-3 border transition ${selectedId === t.id ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                <div className="font-bold text-sm text-slate-800">{t.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{t.gameName} · {t.tournamentDate}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[t.status] || ''}`}>{t.status}</span>
                  <span className="text-xs text-slate-500">Entry: {formatCurrency(t.entryFee)}</span>
                </div>
              </button>
            ))}
        </div>
      </div>

      {/* Right: Tournament Detail */}
      <div className="flex-1 flex flex-col">
        {!selectedId ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <div className="text-5xl mb-3">🏆</div>
              <div className="font-semibold">{t('tournaments.selectTournament')}</div>
            </div>
          </div>
        ) : !detail ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">Loading...</div>
        ) : (
          <>
            {/* Tournament Header */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{detail.tournament.name}</h2>
                  <div className="text-sm text-slate-500 mt-1">{detail.tournament.gameName} · {detail.tournament.tournamentDate}</div>
                </div>
                <div className="flex gap-2">
                  <select value={detail.tournament.status}
                    onChange={async (e) => { try { await updateStatus({ id: selectedId, status: e.target.value }).unwrap(); } catch { flash(`❌ ${t('failed')}`); } }}
                    className="text-sm border border-slate-200 rounded-xl px-3 py-1.5 outline-none">
                    {['UPCOMING','ACTIVE','COMPLETED','CANCELLED'].map(s => <option key={s}>{s}</option>)}
                  </select>
                  <button onClick={async () => { if (confirm(`${t('delete')}?`)) { try { await deleteTournament(selectedId).unwrap(); setSelectedId(null); flash('✅ Deleted'); } catch { flash('❌ Failed to delete'); } } }}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl text-xs transition">
                    🗑 Delete
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 mt-4">
                {[
                  { label: 'Entry Fee', value: formatCurrency(detail.tournament.entryFee), color: 'blue' },
                  { label: 'Max Players', value: detail.tournament.maxPlayers, color: 'purple' },
                  { label: 'Registered', value: detail.registeredCount, color: 'green' },
                  { label: 'Collected', value: formatCurrency(detail.totalCollected), color: 'amber' },
                ].map(s => (
                  <div key={s.label} className={`rounded-xl p-3 bg-${s.color}-50`}>
                    <div className="text-xs text-slate-500">{s.label}</div>
                    <div className={`font-black text-lg text-${s.color}-700`}>{s.value}</div>
                  </div>
                ))}
              </div>
              {detail.tournament.notes && <p className="text-sm text-slate-500 mt-3 italic">{detail.tournament.notes}</p>}
            </div>

            {/* Players */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-700">Players ({detail.players?.length || 0}/{detail.tournament.maxPlayers})</h3>
              <button onClick={() => setShowRegisterForm(true)}
                disabled={detail.tournament.status === 'COMPLETED' || detail.tournament.status === 'CANCELLED'}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 text-white rounded-xl text-xs font-bold transition">
                + Register Player
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {(!detail.players || detail.players.length === 0) ? (
                <div className="text-center text-slate-400 py-8">{t('noData')}</div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {['#','Player','Phone','Fee Paid','Checked In','Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {detail.players.map((p: any, idx: number) => (
                        <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-400 text-xs">{idx + 1}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{p.playerName}</td>
                          <td className="px-4 py-3 text-slate-500">{p.playerPhone || '—'}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => toggleFeePaid(p)}
                              className={`text-xs px-2.5 py-1 rounded-full font-medium transition ${p.feePaid ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-500 hover:bg-red-200'}`}>
                              {p.feePaid ? '✅ Paid' : '❌ Unpaid'}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => toggleCheckIn(p)}
                              className={`text-xs px-2.5 py-1 rounded-full font-medium transition ${p.checkedIn ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                              {p.checkedIn ? '✅ In' : '⬜ Out'}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => { if (confirm(`Remove ${p.playerName}?`)) removePlayer(p.id); }}
                              className="text-xs text-red-400 hover:text-red-600 transition">🗑</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Create Tournament Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="font-bold text-lg mb-4">🏆 Create Tournament</h2>
            <div className="space-y-3">
              <input placeholder="Tournament name*" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Game (e.g. FIFA)" value={form.gameName} onChange={e => setForm(p => ({ ...p, gameName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm" />
                <input type="date" value={form.tournamentDate} onChange={e => setForm(p => ({ ...p, tournamentDate: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Entry Fee (EGP)</label>
                  <input type="number" value={form.entryFee} onChange={e => setForm(p => ({ ...p, entryFee: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">{t('tournaments.maxPlayers')}</label>
                  <input type="number" value={form.maxPlayers} onChange={e => setForm(p => ({ ...p, maxPlayers: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">{t('tournaments.prizePool')}</label>
                  <input type="number" value={form.prizePool} onChange={e => setForm(p => ({ ...p, prizePool: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm" />
                </div>
              </div>
              <textarea placeholder="Notes..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                rows={2} className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm resize-none" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowCreateForm(false)} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 text-sm">{t('cancel')}</button>
              <button onClick={handleCreate} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm">{t('create')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Register Player Modal */}
      {showRegisterForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="font-bold text-lg mb-4">👤 Register Player</h2>
            <div className="space-y-3">
              <input placeholder="Player name*" value={playerForm.playerName} onChange={e => setPlayerForm(p => ({ ...p, playerName: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              <input placeholder="Phone (optional)" value={playerForm.playerPhone} onChange={e => setPlayerForm(p => ({ ...p, playerPhone: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm" />
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={playerForm.feePaid} onChange={e => setPlayerForm(p => ({ ...p, feePaid: e.target.checked }))}
                  className="w-4 h-4 rounded" />
                <span className="text-sm text-slate-700">Entry fee paid ({formatCurrency(detail?.tournament?.entryFee || 0)})</span>
              </label>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowRegisterForm(false)} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 text-sm">{t('cancel')}</button>
              <button onClick={handleRegister} className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm">{t('confirm')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
