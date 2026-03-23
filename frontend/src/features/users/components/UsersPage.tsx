import { useI18n } from '../../../i18n';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../app/store';
import { baseApi } from '../../../app/baseApi';

const usersApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getAllUsers: b.query<any, void>({ query: () => '/users' }),
    createUser: b.mutation<any, any>({ query: (body) => ({ url: '/users', method: 'POST', body }) }),
    toggleUserStatus: b.mutation<any, string>({ query: (id) => ({ url: `/users/${id}/status`, method: 'PATCH' }) }),
    changePassword: b.mutation<any, { currentPassword: string; newPassword: string }>({
      query: (body) => ({ url: '/users/me/password', method: 'POST', body }),
    }),
    resetUserPassword: b.mutation<any, { id: string; newPassword: string }>({
      query: ({ id, newPassword }) => ({ url: `/users/${id}/password`, method: 'POST', body: { newPassword } }),
    }),
    updateUser: b.mutation<any, { id: string } & any>({ query: ({ id, ...body }) => ({ url: `/users/${id}`, method: 'PATCH', body }) }),
    getActivityLog: b.query<any, void>({ query: () => '/users/activity-log' }),
  }),
  overrideExisting: false,
});
const { useGetAllUsersQuery, useCreateUserMutation, useToggleUserStatusMutation, useChangePasswordMutation, useResetUserPasswordMutation, useUpdateUserMutation, useGetActivityLogQuery } = usersApi;

const ROLES = ['CASHIER', 'WAITER', 'SUPERVISOR', 'MANAGER', 'OWNER', 'KITCHEN', 'BARISTA'];

const ROLE_BADGE: Record<string, string> = {
  OWNER:      'bg-purple-100 text-purple-700',
  MANAGER:    'bg-blue-100   text-blue-700',
  SUPERVISOR: 'bg-indigo-100 text-indigo-700',
  CASHIER:    'bg-green-100  text-green-700',
  WAITER:     'bg-slate-100  text-slate-600',
  KITCHEN:    'bg-orange-100 text-orange-700',
  BARISTA:    'bg-amber-100  text-amber-700',
};
const BLANK = { username: '', password: '', fullName: '', role: 'CASHIER', pin: '', maxDiscountPercent: '0' };

type Tab = 'staff' | 'log' | 'password';

export default function UsersPage() {
  const { t, isRTL } = useI18n();
  const { role, username } = useSelector((s: RootState) => s.auth);
  const { data: usersRes, isLoading, refetch } = useGetAllUsersQuery();
  const { data: logRes } = useGetActivityLogQuery(undefined, { skip: role !== 'OWNER' && role !== 'MANAGER' });
  const [createUser] = useCreateUserMutation();
  const [toggleStatus] = useToggleUserStatusMutation();
  const [updateUser] = useUpdateUserMutation();
  const [changePassword] = useChangePasswordMutation();
  const [resetUserPassword] = useResetUserPasswordMutation();

  // Map role enum → translated display label
  const ROLE_LABEL: Record<string, string> = {
    OWNER:      t('staff.owner'),
    MANAGER:    t('staff.manager'),
    SUPERVISOR: t('staff.supervisor'),
    CASHIER:    t('staff.cashier'),
    WAITER:     t('staff.waiter'),
    KITCHEN:    t('staff.kitchen'),
    BARISTA:    t('staff.barista'),
  };

  const users = usersRes?.data || [];
  const logs = logRes?.data || [];

  const [tab, setTab] = useState<Tab>('staff');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<any>(BLANK);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [resetTarget, setResetTarget] = useState<any>(null);
  const [resetForm, setResetForm] = useState({ newPassword: '', confirm: '' });
  const [resetError, setResetError] = useState('');
  const [resetSaving, setResetSaving] = useState(false);

  const set = (k: string, v: string) => setForm((p: any) => ({ ...p, [k]: v }));

  const handleCreate = async () => {
    if (!form.username || !form.password || !form.fullName) {
      setFormError(t('required')); return;
    }
    setSaving(true); setFormError('');
    try { await createUser(form).unwrap(); setShowCreate(false); setForm(BLANK); refetch(); }
    catch (e: any) { setFormError(e?.data?.message || t('failed')); }
    finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!editForm.fullName) { setEditError(t('required')); return; }
    setEditSaving(true); setEditError('');
    try {
      await updateUser({ id: editTarget.id, fullName: editForm.fullName, role: editForm.role, maxDiscountPercent: parseInt(editForm.maxDiscountPercent || '0') }).unwrap();
      setEditTarget(null); refetch();
    } catch (e: any) { setEditError(e?.data?.message || t('failed')); }
    finally { setEditSaving(false); }
  };

  const handlePasswordChange = async () => {
    setPwError(''); setPwSuccess('');
    if (!pwForm.currentPassword || !pwForm.newPassword) { setPwError(t('required')); return; }
    if (pwForm.newPassword !== pwForm.confirm) { setPwError(t('staff.passwordMismatch')); return; }
    if (pwForm.newPassword.length < 6) { setPwError(t('staff.passwordTooShort')); return; }
    try {
      await changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }).unwrap();
      setPwSuccess(t('staff.passwordChanged'));
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (e: any) { setPwError(e?.data?.message || t('failed')); }
  };

  const canResetStaffPassword = (user: any) => {
    if ((role !== 'OWNER' && role !== 'MANAGER') || username === user.username) return false;
    if (role === 'OWNER') return true;
    return user.role !== 'OWNER' && user.role !== 'MANAGER';
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    setResetError('');
    if (!resetForm.newPassword) { setResetError(t('required')); return; }
    if (resetForm.newPassword !== resetForm.confirm) { setResetError(t('staff.passwordMismatch')); return; }
    if (resetForm.newPassword.length < 6) { setResetError(t('staff.passwordTooShort')); return; }
    setResetSaving(true);
    try {
      await resetUserPassword({ id: resetTarget.id, newPassword: resetForm.newPassword }).unwrap();
      setResetTarget(null);
      setResetForm({ newPassword: '', confirm: '' });
    } catch (e: any) {
      setResetError(e?.data?.message || t('failed'));
    } finally {
      setResetSaving(false);
    }
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: 'staff',    label: `👤 ${t('staff.title')}` },
    { key: 'password', label: `🔑 ${t('staff.myPassword')}` },
    ...(role === 'OWNER' || role === 'MANAGER' ? [{ key: 'log' as Tab, label: `📋 ${t('activityLog.title')}` }] : []),
  ];

  return (
    <div className="h-full flex flex-col gap-4">
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <h1 className="text-xl font-bold text-slate-800">👤 {t('staff.title')}</h1>
        {tab === 'staff' && (role === 'OWNER' || role === 'MANAGER') && (
          <button onClick={() => { setShowCreate(true); setFormError(''); }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm">
            + {t('staff.addStaff')}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {TABS.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${tab === tb.key ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 hover:bg-slate-100'}`}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* Staff tab */}
      {tab === 'staff' && (
        <div className="flex-1 bg-white rounded-2xl shadow-sm overflow-hidden">
          {isLoading ? <div className="flex items-center justify-center h-full text-slate-400">{t('loading')}</div>
          : <div className="overflow-auto h-full">
            <table className="w-full">
              <thead className="bg-slate-50 sticky top-0">
                <tr>{[t('name'), t('username'), t('staff.role'), t('staff.maxDiscount'), t('status'), ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-semibold text-slate-800">{u.fullName}</td>
                    <td className="px-4 py-3 font-mono text-sm text-slate-400">@{u.username}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${ROLE_BADGE[u.role] || 'bg-slate-100 text-slate-600'}`}>
                        {ROLE_LABEL[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{u.maxDiscountPercent}%</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.active ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'}`}>
                        {u.active ? `● ${t('active')}` : `○ ${t('inactive')}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {(role === 'OWNER' || role === 'MANAGER') && (
                        <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <button onClick={() => { setEditTarget(u); setEditForm({ fullName: u.fullName, role: u.role, maxDiscountPercent: String(u.maxDiscountPercent) }); setEditError(''); }}
                            className="px-3 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium transition">{t('edit')}</button>
                          {canResetStaffPassword(u) && (
                            <button onClick={() => { setResetTarget(u); setResetForm({ newPassword: '', confirm: '' }); setResetError(''); }}
                              className="px-3 py-1 text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg font-medium transition">
                              {t('staff.resetStaffPassword')}
                            </button>
                          )}
                          <button onClick={async () => { await toggleStatus(u.id); refetch(); }}
                            className={`px-3 py-1 text-xs rounded-lg font-medium transition ${u.active ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                            {u.active ? t('inactive') : t('active')}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
        </div>
      )}

      {/* Password tab */}
      {tab === 'password' && (
        <div className="flex-1 flex items-start justify-center pt-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 w-full max-w-sm">
            <h2 className="font-bold text-lg mb-2">🔑 {t('staff.myPassword')}</h2>
            <p className="text-sm text-slate-500 mb-4">{t('staff.myPasswordHelp')}</p>
            {pwError && <div className="mb-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{pwError}</div>}
            {pwSuccess && <div className="mb-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-semibold">{pwSuccess}</div>}
            <div className="space-y-3">
              <input type="password" value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                placeholder={t('password')} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="password" value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                placeholder={`${t('staff.newPassword')} (min 6)`} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="password" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                placeholder={t('confirm')} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={handlePasswordChange} className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl">
              {t('update')}
            </button>
          </div>
        </div>
      )}

      {/* Activity log tab */}
      {tab === 'log' && (
        <div className="flex-1 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-auto h-full">
            <table className="w-full">
              <thead className="bg-slate-50 sticky top-0">
                <tr>{[t('staff.title'), t('actions'), t('description'), t('date')].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {logs.length === 0
                  ? <tr><td colSpan={4} className="px-4 py-16 text-center text-slate-400">{t('noData')}</td></tr>
                  : logs.map((l: any) => (
                    <tr key={l.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-medium text-slate-700">{l.username}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{l.action}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{l.entityType} {l.details && <span className="text-xs">({l.details})</span>}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{l.performedAt ? new Date(l.performedAt).toLocaleString('en-EG') : '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit staff modal */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="font-bold text-lg mb-4">✏️ {t('staff.editStaff')}: {editTarget.fullName}</h2>
            {editError && <div className="mb-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{editError}</div>}
            <div className="space-y-3">
              <input value={editForm.fullName} onChange={e => setEditForm((p: any) => ({ ...p, fullName: e.target.value }))}
                placeholder={`${t('name')} *`}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">{t('staff.role')}</label>
                  <select value={editForm.role} onChange={e => setEditForm((p: any) => ({ ...p, role: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white outline-none">
                    {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r] || r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">{t('staff.maxDiscount')}</label>
                  <input type="number" value={editForm.maxDiscountPercent}
                    onChange={e => setEditForm((p: any) => ({ ...p, maxDiscountPercent: e.target.value }))} min={0} max={100}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setEditTarget(null); setEditError(''); }}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 text-sm">{t('cancel')}</button>
              <button onClick={handleUpdate} disabled={editSaving}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-sm">
                {editSaving ? t('loading') : t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create staff modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="font-bold text-lg mb-4">+ {t('staff.addStaff')}</h2>
            {formError && <div className="mb-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{formError}</div>}
            <div className="space-y-3">
              <input value={form.fullName} onChange={e => set('fullName', e.target.value)}
                placeholder={`${t('name')} *`}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={form.username} onChange={e => set('username', e.target.value.toLowerCase().replace(/\s/g,''))}
                placeholder={`${t('username')} *`}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                placeholder={`${t('password')} *`}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">{t('staff.role')} *</label>
                  <select value={form.role} onChange={e => set('role', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white outline-none">
                    {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r] || r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">{t('pin')}</label>
                  <input value={form.pin} onChange={e => set('pin', e.target.value.replace(/\D/g,'').slice(0,4))}
                    placeholder="4 digits" maxLength={4}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono text-center tracking-widest outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">{t('staff.maxDiscount')}</label>
                  <input type="number" value={form.maxDiscountPercent} onChange={e => set('maxDiscountPercent', e.target.value)}
                    placeholder="0" min={0} max={100}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-center" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowCreate(false); setFormError(''); setForm(BLANK); }}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 text-sm">{t('cancel')}</button>
              <button onClick={handleCreate} disabled={saving}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-sm">
                {saving ? t('loading') : t('create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {resetTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="font-bold text-lg mb-2">🔑 {t('staff.resetStaffPassword')}</h2>
            <p className="text-sm text-slate-500 mb-4">{resetTarget.fullName} (@{resetTarget.username})</p>
            {resetError && <div className="mb-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{resetError}</div>}
            <div className="space-y-3">
              <input
                type="password"
                value={resetForm.newPassword}
                onChange={e => setResetForm(p => ({ ...p, newPassword: e.target.value }))}
                placeholder={`${t('staff.newPassword')} (min 6)`}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                value={resetForm.confirm}
                onChange={e => setResetForm(p => ({ ...p, confirm: e.target.value }))}
                placeholder={t('confirm')}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setResetTarget(null); setResetError(''); }}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 text-sm">{t('cancel')}</button>
              <button onClick={handleResetPassword} disabled={resetSaving}
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-sm">
                {resetSaving ? t('loading') : t('update')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
