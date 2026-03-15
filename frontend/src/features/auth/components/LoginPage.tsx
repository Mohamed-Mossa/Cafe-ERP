import { useState, FormEvent } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useLoginMutation } from '../api/authApi';
import { setCredentials } from '../store/authSlice';
import { useI18n } from '../../../i18n';
import LangToggle from '../../../components/ui/LangToggle';

export default function LoginPage() {
  const { t, isRTL } = useI18n();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const result = await login({ username, password }).unwrap();
      dispatch(setCredentials(result.data));
      navigate('/', { replace: true });
    } catch {
      setError(t('loginError'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Lang toggle top-right */}
        <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'} mb-4`}>
          <LangToggle />
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">☕</div>
          <h1 className="text-2xl font-bold text-slate-800">{t('appName')}</h1>
          <p className="text-slate-500 text-sm mt-1">
            {isRTL ? 'نظام إدارة الكافيه' : 'Management System'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('username')}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder={t('username')}
              required
              autoFocus
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder={t('password')}
              required
              dir="ltr"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl transition"
          >
            {isLoading ? '...' : t('loginButton')}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6" dir="ltr">
          Default: owner / Admin@123
        </p>
      </div>
    </div>
  );
}
