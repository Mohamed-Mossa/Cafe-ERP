import { useI18n } from '../../../i18n';
import { useState, useEffect } from 'react';
import { baseApi } from '../../../app/baseApi';
import { useAppSelector } from '../../../app/hooks';

const settingsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getSettings: b.query<any, void>({ query: () => '/settings', providesTags: ['Settings'] }),
    updateSettings: b.mutation<any, Record<string, string>>({
      query: (body) => ({ url: '/settings', method: 'PUT', body }), invalidatesTags: ['Settings'],
    }),
  }),
  overrideExisting: false,
});

const { useGetSettingsQuery, useUpdateSettingsMutation } = settingsApi;

type Field = { key: string; label: string; type?: string; hint?: string };
type Section = { title: string; icon: string; fields: Field[] };

export default function SettingsPage() {
  const { t, isRTL } = useI18n();
  const role = useAppSelector(s => s.auth.role);
  const isOwner = role === 'OWNER';

  const { data: settingsRes, isLoading } = useGetSettingsQuery();
  const [updateSettings] = useUpdateSettingsMutation();

  const [form, setForm] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  // Defined inside component so t() is available
  const SECTIONS: Section[] = [
    {
      title: t('settings.cafeInfo'), icon: '🏪', fields: [
        { key: 'cafe_name',      label: t('settings.cafeName'),      hint: 'Shown on receipts and KDS' },
        { key: 'cafe_address',   label: t('settings.cafeAddress'),   hint: 'Full address for receipts' },
        { key: 'cafe_phone',     label: t('settings.cafePhone'),     hint: 'Contact number for receipts' },
        { key: 'receipt_footer', label: t('settings.receiptFooter'), hint: 'Thank-you message at bottom of receipt' },
      ],
    },
    {
      title: t('settings.taxPricing'), icon: '💰', fields: [
        { key: 'tax_rate_percent', label: t('settings.taxRate'), type: 'number', hint: 'Set to 0 to disable tax' },
      ],
    },
    {
      title: t('settings.loyaltyProgram'), icon: '⭐', fields: [
        { key: 'loyalty_earn_rate',     label: t('settings.earnRate'),        type: 'number', hint: 'e.g. 10 = earn 10 points per 100 EGP' },
        { key: 'loyalty_redeem_rate',   label: t('settings.redeemRate'),      type: 'number', hint: 'e.g. 10 = 100 points = 10 EGP' },
        { key: 'loyalty_expiry_months', label: t('settings.expiryMonths'),    type: 'number', hint: 'Points expire after this many months' },
        { key: 'silver_threshold',      label: t('settings.silverThreshold'), type: 'number', hint: 'Points needed to reach Silver' },
        { key: 'gold_threshold',        label: t('settings.goldThreshold'),   type: 'number', hint: 'Points needed to reach Gold' },
      ],
    },
    {
      title: t('settings.gamingSection'), icon: '🎮', fields: [
        { key: 'gaming_min_minutes',   label: t('settings.minMinutes'),   type: 'number', hint: 'Minimum session duration to charge (e.g. 15)' },
        { key: 'gaming_alert_minutes', label: t('settings.alertMinutes'), type: 'number', hint: 'Alert cashier N minutes before the current hour ends' },
      ],
    },
  ];

  useEffect(() => {
    if (settingsRes?.data) { setForm(settingsRes.data); setDirty(false); }
  }, [settingsRes]);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleChange = (key: string, value: string) => {
    setForm(p => ({ ...p, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(form).unwrap();
      setDirty(false);
      flash(`✅ ${t('saved')}`);
    } catch (e: any) {
      flash(`❌ ${e?.data?.message || t('failed')}`);
    } finally { setSaving(false); }
  };

  if (isLoading) return <div className="flex items-center justify-center h-full text-slate-400">{t('loading')}</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-800">{t('settings.title')}</h1>
        <div className="flex items-center gap-3">
          {msg && <span className={`text-xs px-3 py-1.5 rounded-full ${msg.startsWith('❌') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>{msg}</span>}
          {dirty && <span className="text-xs text-orange-500 font-medium">{t('settings.unsaved')}</span>}
          {isOwner ? (
            <button onClick={handleSave} disabled={!dirty || saving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold rounded-xl text-sm transition">
              {saving ? t('settings.saving') : t('settings.saveSettings')}
            </button>
          ) : (
            <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl">{t('settings.ownerOnly')}</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 max-w-2xl">
          {SECTIONS.map(section => (
            <div key={section.title} className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-bold text-slate-700 mb-4 text-sm flex items-center gap-2">
                <span className="text-lg">{section.icon}</span>
                {section.title}
              </h2>
              <div className="space-y-4">
                {section.fields.map(field => (
                  <div key={field.key}>
                    <label className="text-sm font-medium text-slate-700 block mb-1">{field.label}</label>
                    <input
                      type={field.type || 'text'}
                      value={form[field.key] || ''}
                      onChange={e => handleChange(field.key, e.target.value)}
                      disabled={!isOwner}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-slate-50 disabled:text-slate-400"
                    />
                    {field.hint && <p className="text-xs text-slate-400 mt-1">{field.hint}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Match Mode */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="font-bold text-slate-700 mb-2 text-sm flex items-center gap-2">
              <span className="text-lg">⚡</span>
              {t('settings.matchMode')}
            </h2>
            <p className="text-xs text-slate-400 mb-3">
              Products flagged as "Available in Match Mode" in the Menu section will appear in Match Mode.
            </p>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Match Mode Product IDs (comma-separated)</label>
              <textarea
                value={form['match_mode_products'] || ''}
                onChange={e => handleChange('match_mode_products', e.target.value)}
                disabled={!isOwner}
                rows={3}
                placeholder={t('settings.matchModePh')}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-xs resize-none disabled:bg-slate-50"
              />
            </div>
          </div>

          {!isOwner && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
              {t('settings.ownerNote')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}