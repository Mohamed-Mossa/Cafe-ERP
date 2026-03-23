import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { baseApi } from '../../app/baseApi';
import { logout } from '../../features/auth/store/authSlice';
import { useI18n } from '../../i18n';

const pwApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    changePassword: b.mutation<any, { currentPassword: string; newPassword: string }>({
      query: (body) => ({ url: '/users/me/password', method: 'POST', body }),
    }),
  }),
  overrideExisting: false,
});
const { useChangePasswordMutation } = pwApi;

export default function AppShell() {
  const { role, fullName, username } = useAppSelector(s => s.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t, lang, setLang, isRTL } = useI18n();

  const [showPwModal, setShowPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [changePassword, { isLoading: pwLoading }] = useChangePasswordMutation();

  const NAV_SECTIONS = [
    {
      title: isRTL ? 'العمليات' : 'Operations',
      items: [
        { to: '/pos',           icon: '🛒', label: t('nav.pos'),          roles: ['OWNER','MANAGER','SUPERVISOR','CASHIER','WAITER'] },
        { to: '/floor',         icon: '🪑', label: t('nav.floor'),        roles: ['OWNER','MANAGER','SUPERVISOR','CASHIER','WAITER'] },
        { to: '/kds',           icon: '👨‍🍳', label: t('nav.kds'),          roles: ['OWNER','MANAGER','SUPERVISOR','CASHIER','KITCHEN','BARISTA'] },
        { to: '/gaming',        icon: '🎮', label: t('nav.gaming'),       roles: ['OWNER','MANAGER','SUPERVISOR','CASHIER'] },
        { to: '/reservations',  icon: '📅', label: t('nav.reservations'), roles: ['OWNER','MANAGER','SUPERVISOR','CASHIER'] },
        { to: '/shifts',        icon: '🕐', label: t('nav.shifts'),       roles: ['OWNER','MANAGER','SUPERVISOR','CASHIER'] },
      ],
    },
    {
      title: isRTL ? 'الإدارة' : 'Management',
      items: [
        { to: '/inventory',      icon: '📦', label: t('nav.inventory'),     roles: ['OWNER','MANAGER','SUPERVISOR'] },
        { to: '/stock-forecast', icon: '📈', label: t('nav.stockForecast'), roles: ['OWNER','MANAGER','SUPERVISOR'] },
        { to: '/suppliers',      icon: '🏭', label: t('nav.suppliers'),     roles: ['OWNER','MANAGER','SUPERVISOR'] },
        { to: '/customers',      icon: '👥', label: t('nav.customers'),     roles: ['OWNER','MANAGER','SUPERVISOR','CASHIER'] },
        { to: '/memberships',    icon: '🎟', label: t('nav.memberships'),   roles: ['OWNER','MANAGER','SUPERVISOR','CASHIER'] },
        { to: '/tournaments',    icon: '🏆', label: t('nav.tournaments'),   roles: ['OWNER','MANAGER','SUPERVISOR','CASHIER'] },
        { to: '/menu',           icon: '🍽️', label: t('nav.menu'),         roles: ['OWNER','MANAGER'] },
        { to: '/promotions',     icon: '🎁', label: t('nav.promotions'),    roles: ['OWNER','MANAGER'] },
        { to: '/happy-hours',    icon: '🎉', label: t('nav.happyHours'),    roles: ['OWNER','MANAGER'] },
      ],
    },
    {
      title: isRTL ? 'الأدمن' : 'Admin',
      items: [
        { to: '/match-mode',    icon: '⚡',  label: t('nav.matchMode'),    roles: ['OWNER','MANAGER','SUPERVISOR','CASHIER'] },
        { to: '/expenses',      icon: '💸',  label: t('nav.expenses'),     roles: ['OWNER','MANAGER'] },
        { to: '/debt',          icon: '💳',  label: t('nav.debt'),         roles: ['OWNER','MANAGER','SUPERVISOR'] },
        { to: '/staff',         icon: '👤',  label: t('nav.staff'),        roles: ['OWNER','MANAGER'] },
        { to: '/reports',       icon: '📊',  label: t('nav.reports'),      roles: ['OWNER','MANAGER'] },
        { to: '/order-history', icon: '🗂️', label: t('nav.orderHistory'), roles: ['OWNER','MANAGER','SUPERVISOR','KITCHEN','BARISTA'] },
        { to: '/activity-log',  icon: '📋',  label: t('nav.activityLog'),  roles: ['OWNER','MANAGER'] },
        { to: '/settings',      icon: '⚙️', label: t('nav.settings'),     roles: ['OWNER'] },
      ],
    },
  ];

  const handlePwChange = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword) { setPwError(t('required')); return; }
    if (pwForm.newPassword !== pwForm.confirm) { setPwError(t('staff.passwordMismatch')); return; }
    if (pwForm.newPassword.length < 6) { setPwError(t('staff.passwordTooShort')); return; }
    setPwError('');
    try {
      await changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }).unwrap();
      setPwSuccess(true);
      setTimeout(() => { setShowPwModal(false); setPwForm({ currentPassword: '', newPassword: '', confirm: '' }); setPwSuccess(false); }, 1500);
    } catch (e: any) {
      setPwError(e?.data?.message || 'Failed');
    }
  };

  return (
    <div className={`flex h-screen bg-slate-100 overflow-hidden ${isRTL ? 'flex-row-reverse' : ''}`}>

      {/* ── Sidebar ── */}
      <aside className="w-52 flex-shrink-0 bg-slate-900 flex flex-col overflow-y-auto">
        {/* Logo + language toggle */}
        <div className="p-4 border-b border-slate-700/60 flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <div className="text-white font-black text-lg tracking-tight">☕ {t('appName')}</div>
            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="text-xs px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold transition"
              title="Switch language / تغيير اللغة"
            >
              {lang === 'en' ? 'ع' : 'EN'}
            </button>
          </div>
          <div className="text-slate-300 text-sm truncate font-medium">{fullName || username}</div>
          <div className="text-slate-500 text-xs mt-0.5">{role}</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2">
          {NAV_SECTIONS.map(section => {
            const visible = section.items.filter(n => !role || n.roles.includes(role));
            if (!visible.length) return null;
            return (
              <div key={section.title} className="mb-1">
                <div className={`px-4 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest ${isRTL ? 'text-right' : ''}`}>
                  {section.title}
                </div>
                {visible.map(({ to, icon, label }) => (
                  <NavLink key={to} to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2 text-sm transition-all ${isRTL ? 'flex-row-reverse' : ''} ${
                        isActive
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`
                    }>
                    <span className="text-base w-5 flex-shrink-0 text-center">{icon}</span>
                    <span className="truncate">{label}</span>
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="border-t border-slate-700/60 flex-shrink-0">
          <button onClick={() => { setShowPwModal(true); setPwError(''); setPwSuccess(false); }}
            className={`w-full px-4 py-2.5 text-slate-400 hover:text-white text-sm hover:bg-slate-800 transition flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span>🔑</span> {t('staff.resetPassword')}
          </button>
          <button onClick={() => { dispatch(logout()); navigate('/login'); }}
            className={`w-full px-4 py-2.5 text-slate-400 hover:text-red-400 text-sm hover:bg-slate-800 transition flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span>🚪</span> {t('logout')}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-auto p-5">
        <Outlet />
      </main>

      {/* ── Password Modal ── */}
      {showPwModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="font-bold text-lg mb-4">🔑 {t('staff.resetPassword')}</h2>
            {pwSuccess ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-2">✅</div>
                <div className="font-semibold text-green-700">{t('staff.passwordChanged')}</div>
              </div>
            ) : (
              <div className="space-y-3">
                {pwError && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{pwError}</div>}
                {[
                  { key: 'currentPassword', ph: t('password') },
                  { key: 'newPassword',     ph: t('staff.newPassword') },
                  { key: 'confirm',         ph: `${t('confirm')} ${t('staff.newPassword')}` },
                ].map(({ key, ph }) => (
                  <input key={key} type="password" placeholder={ph}
                    value={pwForm[key as keyof typeof pwForm]}
                    onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                ))}
                <div className="flex gap-3 pt-1">
                  <button onClick={() => setShowPwModal(false)}
                    className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm">{t('cancel')}</button>
                  <button onClick={handlePwChange} disabled={pwLoading}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-sm">
                    {pwLoading ? '...' : t('save')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
