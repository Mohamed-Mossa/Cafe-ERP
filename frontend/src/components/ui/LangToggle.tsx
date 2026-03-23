import { useI18n } from '../../i18n';

/**
 * Pill toggle: EN ↔ ع
 * Use anywhere — AppShell already includes it in the sidebar.
 * Useful for LoginPage and any standalone pages.
 */
export default function LangToggle({ className = '' }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
      title="Switch language / تغيير اللغة"
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-sm font-bold text-slate-700 shadow-sm transition ${className}`}
    >
      <span className="text-base">🌐</span>
      <span>{lang === 'en' ? 'العربية' : t('language')}</span>
    </button>
  );
}
