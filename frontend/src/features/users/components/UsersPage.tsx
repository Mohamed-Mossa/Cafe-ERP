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
    updateUser: b.mutation<any, { id: string } & any>({ query: ({ id, ...body }) => ({ url: `/users/${id}`, method: 'PATCH', body }) }),
    getActivityLog: b.query<any, void>({ query: () => '/users/activity-log' }),
  }),
  overrideExisting: false,
});
const { useGetAllUsersQuery, useCreateUserMutation, useToggleUserStatusMutation, useChangePasswordMutation, useUpdateUserMutation, useGetActivityLogQuery } = usersApi;

const ROLES = ['CASHIER', 'WAITER', 'SUPERVISOR', 'MANAGER', 'OWNER'];
const ROLE_BADGE: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-700', MANAGER: 'bg-blue-100 text-blue-700',
  SUPERVISOR: 'bg-indigo-100 text-indigo-700', CASHIER: 'bg-green-100 text-green-700', WAITER: 'bg-slate-100 text-slate-600',
};
const BLANK = { username: '', password: '', fullName: '', role: 'CASHIER', pin: '', maxDiscountPercent: '0' };

type Tab = 'staff' | 'log' | 'password';

export default function UsersPage() {
  const { t, isRTL } = useI18n();
  const { role } = useSelector((s: RootState) => s.auth);
  const { data: usersRes, isLoading, refetch } = useGetAllUsersQuery();
  const { data: logRes } = useGetActivityLogQuery(undefined, { skip: role !== 'OWNER' && role !== 'MANAGER' });
  const [createUser] = useCreateUserMutation();
  const [toggleStatus] = useToggleUserStatusMutation();
  const [updateUser] = useUpdateUserMutation();
  const [changePassword] = useChangePasswordMutation();

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

  // password change state
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const set = (k: string, v: string) => setForm((p: any) => ({ ...p, [k]: v }));

  const handleCreate = async () => {
    if (!form.username || !form.password || !form.fullName) { setFormError('Username, password and full name required'); return; }
    setSaving(true); setFormError('');
    try { await createUser(form).unwrap(); setShowCreate(false); setForm(BLANK); refetch(); }
    catch (e: any) { setFormError(e?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!editForm.fullName) { setEditError('Full name required'); return; }
    setEditSaving(true); setEditError('');
    try {
      await updateUser({ id: editTarget.id, fullName: editForm.fullName, role: editForm.role, maxDiscountPercent: parseInt(editForm.maxDiscountPercent || '0') }).unwrap();
      setEditTarget(null); refetch();
    } catch (e: any) { setEditError(e?.data?.message || 'Failed'); }
    finally { setEditSaving(false); }
  };

  const handlePasswordChange = async () => {
    setPwError(''); setPwSuccess('');
    if (!pwForm.currentPassword || !pwForm.newPassword) { setPwError('All fields required'); return; }
    if (pwForm.newPassword !== pwForm.confirm) { setPwError('Passwords do not match'); return; }
    if (pwForm.newPassword.length < 6) { setPwError('New password must be at least 6 characters'); return; }
    try {
      await changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }).unwrap();
      setPwSuccess('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (e: any) { setPwError(e?.data?.message || 'Failed'); }
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: 'staff', label: '👤 Staff' },
    { key: 'password', label: '🔑 Change Password' },
    ...(role === 'OWNER' || role === 'MANAGER' ? [{ key: 'log' as Tab, label: '📋 Activity Log' }] : []),
  ];

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">👤 Users & Access</h1>
        {tab === 'staff' && (role === 'OWNER' || role === 'MANAGER') && (
          <button onClick={() => { setShowCreate(true); setFormError(''); }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm">+ Add Staff</button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${tab === t.key ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 hover:bg-slate-100'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Staff tab */}
      {tab === 'staff' && (
        <div className="flex-1 bg-white rounded-2xl shadow-sm overflow-hidden">
          {isLoading ? <div className="flex items-center justify-center h-full text-slate-400">Loading...</div>
          : <div className="overflow-auto h-full">
            <table className="w-full">
              <thead className="bg-slate-50 sticky top-0">
                <tr>{['Full Name','Username','Role','Max Discount','Status',''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-semibold text-slate-800">{u.fullName}</td>
                    <td className="px-4 py-3 font-mono text-sm text-slate-400">@{u.username}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${ROLE_BADGE[u.role]||''}`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{u.maxDiscountPercent}%</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.active ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'}`}>
                        {u.active ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {(role === 'OWNER' || role === 'MANAGER') && (
                        <div className="flex gap-2">
                        <button onClick={() => { setEditTarget(u); setEditForm({ fullName: u.fullName, role: u.role, maxDiscountPercent: String(u.maxDiscountPercent) }); setEditError(''); }}
                          className="px-3 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium transition">Edit</button>
                        <button onClick={async () => { await toggleStatus(u.id); refetch(); }}
                          className={`px-3 py-1 text-xs rounded-lg font-medium transition ${u.active ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                          {u.active ? 'Deactivate' : 'Activate'}
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
            <h2 className="font-bold text-lg mb-4">🔑 Change Password</h2>
            {pwError && <div className="mb-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{pwError}</div>}
            {pwSuccess && <div className="mb-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-semibold">{pwSuccess}</div>}
            <div className="space-y-3">
              <input type="password" value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                placeholder="Current Password" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="password" value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                placeholder="New Password (min 6 chars)" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="password" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                placeholder="Confirm New Password" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={handlePasswordChange} className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl">
              Update Password
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
                <tr>{['User','Action','Entity','Time'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {logs.length === 0
                  ? <tr><td colSpan={4} className="px-4 py-16 text-center text-slate-400">No activity logs yet</td></tr>
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
            <h2 className="font-bold text-lg mb-4">✏️ Edit {editTarget.fullName}</h2>
            {editError && <div className="mb-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{editError}</div>}
            <div className="space-y-3">
              <input value={editForm.fullName} onChange={e => setEditForm((p: any) => ({ ...p, fullName: e.target.value }))} placeholder="Full Name *"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Role</label>
                  <select value={editForm.role} onChange={e => setEditForm((p: any) => ({ ...p, role: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white outline-none">
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Max Discount %</label>
                  <input type="number" value={editForm.maxDiscountPercent} onChange={e => setEditForm((p: any) => ({ ...p, maxDiscountPercent: e.target.value }))} min={0} max={100}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setEditTarget(null); setEditError(''); }}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 text-sm">Cancel</button>
              <button onClick={handleUpdate} disabled={editSaving}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-sm">
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create staff modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="font-bold text-lg mb-4">Add Staff Member</h2>
            {formError && <div className="mb-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{formError}</div>}
            <div className="space-y-3">
              <input value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Full Name *"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={form.username} onChange={e => set('username', e.target.value.toLowerCase().replace(/\s/g,''))} placeholder="Username *"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Password *"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Role *</label>
                  <select value={form.role} onChange={e => set('role', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white outline-none">
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">PIN (optional)</label>
                  <input value={form.pin} onChange={e => set('pin', e.target.value.replace(/\D/g,'').slice(0,4))}
                    placeholder="4 digits" maxLength={4}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono text-center tracking-widest outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Max Discount %</label>
                  <input type="number" value={form.maxDiscountPercent} onChange={e => set('maxDiscountPercent', e.target.value)}
                    placeholder="0" min={0} max={100}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-center" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowCreate(false); setFormError(''); setForm(BLANK); }}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 text-sm">Cancel</button>
              <button onClick={handleCreate} disabled={saving}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-sm">
                {saving ? 'Creating...' : 'Create Staff'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
