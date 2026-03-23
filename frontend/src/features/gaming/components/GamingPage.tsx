import { useI18n } from '../../../i18n';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../app/hooks';
import { baseApi } from '../../../app/baseApi';
import { Device, GamingSession, ApiResponse, Product } from '../../../types/api.types';
import { formatCurrency } from '../../../utils/currency';
import { canViewCustomerPhones, customerMetaText, customerPhoneHiddenLabel } from '../../../utils/customerPrivacy';

const gamingApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getDevices: b.query<ApiResponse<Device[]>, void>({ query: () => '/gaming/devices', providesTags: ['Gaming'] }),
    getActiveSessions: b.query<any, void>({ query: () => '/gaming/sessions/active', providesTags: ['Gaming'] }),
    startSession: b.mutation<any, any>({ query: (body) => ({ url: '/gaming/sessions', method: 'POST', body }), invalidatesTags: ['Gaming'] }),
    searchCustomers: b.query<any, string>({ query: (q) => `/customers?search=${encodeURIComponent(q)}&size=10` }),
    getActiveCustomerPackages: b.query<any, string>({ query: (customerId) => `/memberships/customers/${customerId}/active` }),
    switchType: b.mutation<any, { id: string; newType: string }>({
      query: ({ id, newType }) => ({ url: `/gaming/sessions/${id}/type`, method: 'PATCH', body: { newType } }), invalidatesTags: ['Gaming'],
    }),
    endSession: b.mutation<any, string>({ query: (id) => ({ url: `/gaming/sessions/${id}/end`, method: 'POST' }), invalidatesTags: ['Gaming'] }),
    endSessionWithPackage: b.mutation<any, { id: string; customerPackageId: string }>({
      query: ({ id, customerPackageId }) => ({ url: `/gaming/sessions/${id}/end-with-package`, method: 'POST', body: { customerPackageId } }),
      invalidatesTags: ['Gaming'],
    }),
    transferSession: b.mutation<any, { id: string; targetDeviceId: string }>({ query: ({ id, ...body }) => ({ url: `/gaming/sessions/${id}/transfer`, method: 'POST', body }), invalidatesTags: ['Gaming'] }),
    addFnbItem: b.mutation<any, { id: string; productId: string; quantity: number }>({
      query: ({ id, ...body }) => ({ url: `/gaming/sessions/${id}/order`, method: 'POST', body }), invalidatesTags: ['Gaming'],
    }),
    createDevice: b.mutation<any, any>({ query: (body) => ({ url: '/gaming/devices', method: 'POST', body }), invalidatesTags: ['Gaming'] }),
    updateDevice: b.mutation<any, { id: string } & any>({
      query: ({ id, ...body }) => ({ url: `/gaming/devices/${id}`, method: 'PATCH', body }), invalidatesTags: ['Gaming'],
    }),
    deleteDevice: b.mutation<any, string>({ query: (id) => ({ url: `/gaming/devices/${id}`, method: 'DELETE' }), invalidatesTags: ['Gaming'] }),
    getGamingProducts: b.query<any, void>({ query: () => '/menu/products?all=false' }),
  }),
  overrideExisting: false,
});
const { useGetDevicesQuery, useGetActiveSessionsQuery, useStartSessionMutation, useSwitchTypeMutation,
  useSearchCustomersQuery, useGetActiveCustomerPackagesQuery, useEndSessionMutation, useEndSessionWithPackageMutation,
  useTransferSessionMutation, useAddFnbItemMutation, useCreateDeviceMutation, useUpdateDeviceMutation,
  useDeleteDeviceMutation, useGetGamingProductsQuery } = gamingApi;

function LiveTimer({ startedAt, alertMinutes = 5 }: { startedAt: string; alertMinutes?: number }) {
  const [tick, setTick] = useState(0);
  const [alerted, setAlerted] = useState<number>(-1);
  useEffect(() => {
    const interval = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(interval);
  }, [startedAt]);
  const seconds = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  // Alert when N minutes remain before next hour
  const minutesIntoHour = m;
  const minutesUntilNextHour = 60 - minutesIntoHour;
  const isAlertZone = minutesUntilNextHour <= alertMinutes && minutesUntilNextHour > 0;

  useEffect(() => {
    if (isAlertZone && alerted !== h) {
      setAlerted(h);
      // Play beep via Web Audio API
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        for (let i = 0; i < 3; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.value = 880;
          gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.3);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.3 + 0.25);
          osc.start(ctx.currentTime + i * 0.3);
          osc.stop(ctx.currentTime + i * 0.3 + 0.25);
        }
      } catch { /* audio not supported */ }
    }
  }, [isAlertZone, h, alerted]);

  return (
    <span className={`font-mono font-bold text-lg tabular-nums ${isAlertZone ? 'text-red-500 animate-pulse' : ''}`}>
      {h > 0 ? `${h}:` : ''}{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
      {isAlertZone && <span className="ml-1 text-xs">⚠️{minutesUntilNextHour}m</span>}
    </span>
  );
}

function packageMatchesSession(pkg: any, deviceType?: string, sessionType?: string) {
  const packageDeviceType = String(pkg?.deviceType || 'ANY').toUpperCase();
  const packageSessionType = String(pkg?.sessionType || 'ANY').toUpperCase();
  const matchesDevice = !deviceType || packageDeviceType === 'ANY' || packageDeviceType === deviceType.toUpperCase();
  const matchesSession = !sessionType || packageSessionType === 'ANY' || packageSessionType === sessionType.toUpperCase();
  return matchesDevice && matchesSession;
}

export default function GamingPage() {
  const { t, isRTL } = useI18n();
  const navigate = useNavigate();
  const role = useAppSelector(s => s.auth.role);
  const canSeeCustomerPhone = canViewCustomerPhones(role);
  const hiddenPhoneLabel = customerPhoneHiddenLabel(isRTL);
  const { data: devicesRes, isLoading } = useGetDevicesQuery(undefined, { pollingInterval: 10000 });
  const { data: sessionsRes } = useGetActiveSessionsQuery(undefined, { pollingInterval: 5000 });
  const { data: productsRes } = useGetGamingProductsQuery();
  const [startSession] = useStartSessionMutation();
  const [switchType] = useSwitchTypeMutation();
  const [endSessionWithPackage] = useEndSessionWithPackageMutation();
  const [endSession] = useEndSessionMutation();
  const [transferSession] = useTransferSessionMutation();
  const [addFnbItem] = useAddFnbItemMutation();
  const [createDevice] = useCreateDeviceMutation();
  const [updateDevice] = useUpdateDeviceMutation();
  const [deleteDevice] = useDeleteDeviceMutation();

  const [tab, setTab] = useState<'floor' | 'devices'>('floor');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  // Per-device session type — each device card has its own SINGLE/MULTI selection
  const [deviceSessionTypes, setDeviceSessionTypes] = useState<Record<string, 'SINGLE' | 'MULTI'>>({});
  const getDeviceType = (deviceId: string): 'SINGLE' | 'MULTI' => deviceSessionTypes[deviceId] ?? 'SINGLE';
  const setDeviceType = (deviceId: string, type: 'SINGLE' | 'MULTI') =>
    setDeviceSessionTypes(prev => ({ ...prev, [deviceId]: type }));
  const [showFnb, setShowFnb] = useState<GamingSession | null>(null);
  const [showTransfer, setShowTransfer] = useState<GamingSession | null>(null);
  const [endingSession, setEndingSession] = useState<GamingSession | null>(null);
  const [fnbSearch, setFnbSearch] = useState('');
  const [startCustomerSearch, setStartCustomerSearch] = useState('');
  const [startSelectedCustomer, setStartSelectedCustomer] = useState<any>(null);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [showEditDevice, setShowEditDevice] = useState<Device | null>(null);
  const [deviceForm, setDeviceForm] = useState({ name: '', type: 'PS4', singleRate: '30', multiRate: '50' });
  const [msg, setMsg] = useState('');

  const devices: Device[] = devicesRes?.data || [];
  const sessions: GamingSession[] = sessionsRes?.data || [];
  const products: Product[] = productsRes?.data || [];
  const { data: customerSearchRes } = useSearchCustomersQuery(startCustomerSearch, {
    skip: !selectedDevice || startCustomerSearch.length < 2,
  });
  const { data: activePackagesRes, isFetching: loadingPackages } = useGetActiveCustomerPackagesQuery(endingSession?.customerId!, {
    skip: !endingSession?.customerId,
  });
  const customerOptions: any[] = customerSearchRes?.data?.customers || customerSearchRes?.data || [];
  const activePackages: any[] = activePackagesRes?.data || [];
  const endingDevice = endingSession ? devices.find(d => d.id === endingSession.deviceId) : null;
  const compatiblePackages = endingSession
    ? activePackages.filter(pkg => packageMatchesSession(pkg, endingDevice?.type, endingSession.currentType))
    : [];

  const getSession = (deviceId: string) => sessions.find(s => s.deviceId === deviceId);
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };
  const resetStartSessionModal = () => {
    setSelectedDevice(null);
    setStartSelectedCustomer(null);
    setStartCustomerSearch('');
  };

  const handleStart = async (device: Device) => {
    try {
      await startSession({
        deviceId: device.id,
        sessionType: getDeviceType(device.id),
        customerId: startSelectedCustomer?.id,
      }).unwrap();
      resetStartSessionModal();
      flash(`✅ ${t('gaming.startSession')}`);
    } catch (e: any) { flash('❌ ' + (e?.data?.message || t('failed'))); }
  };

  const finishSession = async (session: GamingSession, customerPackageId?: string) => {
    try {
      const res = customerPackageId
        ? await endSessionWithPackage({ id: session.id, customerPackageId }).unwrap()
        : await endSession(session.id).unwrap();
      const linkedOrderId = res?.data?.linkedOrderId;
      setEndingSession(null);
      flash(res?.data?.packageUsed
        ? `✅ ${t('gaming.endSession')} · ${Number(res?.data?.deductedHours || 0).toFixed(2)}h from package`
        : `✅ ${t('gaming.endSession')}`);
      setTimeout(() => {
        if (linkedOrderId) {
          navigate('/pos', { state: { gamingOrderId: linkedOrderId } });
        }
      }, 800);
    } catch (e: any) { flash('❌ ' + (e?.data?.message || t('failed'))); }
  };

  const handleEnd = async (session: GamingSession) => {
    if (!session.customerId) {
      if (!confirm(`${t('gaming.endSession')} ${session.deviceName}?`)) return;
      await finishSession(session);
      return;
    }
    setEndingSession(session);
  };

  const handleSwitch = async (session: GamingSession) => {
    const newType = session.currentType === 'SINGLE' ? 'MULTI' : 'SINGLE';
    try {
      await switchType({ id: session.id, newType }).unwrap();
      flash(`✅ ${t('gaming.switchType')} → ${newType}`);
    } catch (e: any) { flash('❌ ' + (e?.data?.message || t('failed'))); }
  };

  const handleAddFnb = async (session: GamingSession, productId: string) => {
    try {
      await addFnbItem({ id: session.id, productId, quantity: 1 }).unwrap();
      flash(`✅ ${t('pos.addItem')}`);
    } catch (e: any) { flash('❌ ' + (e?.data?.message || t('failed'))); }
  };

  const handleTransferSession = async (targetDeviceId: string) => {
    if (!showTransfer) return;
    try {
      await transferSession({ id: showTransfer.id, targetDeviceId }).unwrap();
      setShowTransfer(null);
      flash(`✅ ${t('gaming.transferDevice')}`);
    } catch (e: any) { flash('❌ ' + (e?.data?.message || t('failed'))); }
  };

  const handleCreateDevice = async () => {
    try {
      await createDevice(deviceForm).unwrap();
      setShowAddDevice(false);
      setDeviceForm({ name: '', type: 'PS4', singleRate: '30', multiRate: '50' });
      flash(`✅ ${t('gaming.addDevice')}`);
    } catch { flash(`❌ ${t('failed')}`); }
  };

  const handleUpdateDevice = async () => {
    if (!showEditDevice) return;
    try {
      await updateDevice({ id: showEditDevice.id, ...deviceForm }).unwrap();
      setShowEditDevice(null);
      flash(`✅ ${t('gaming.editDevice')}`);
    } catch { flash(`❌ ${t('failed')}`); }
  };

  const handleDeleteDevice = async (d: Device) => {
    if (!confirm(`${t('delete')} "${d.name}"?`)) return;
    try {
      await deleteDevice(d.id).unwrap();
      flash(`✅ ${t('gaming.deleteDevice')}`);
    } catch { flash(`❌ ${t('failed')}`); }
  };

  const ps4 = devices.filter(d => d.type === 'PS4');
  const ps5 = devices.filter(d => d.type === 'PS5');

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <h1 className="text-xl font-bold text-slate-800">{t('gaming.title')}</h1>
        <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <button onClick={() => setTab('floor')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === 'floor' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            {isRTL ? 'الأجهزة' : 'Floor'}
          </button>
          <button onClick={() => setTab('devices')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === 'devices' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            ⚙️ {isRTL ? 'إعدادات' : 'Devices'}
          </button>
        </div>
      </div>

      {msg && <div className={`px-4 py-3 rounded-xl text-sm font-medium ${msg.startsWith('❌') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>{msg}</div>}

      {/* ── FLOOR TAB ── */}
      {tab === 'floor' && (
        <div className="flex-1 overflow-auto space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-slate-400">{t('loading')}</div>
          ) : [{ label: 'PlayStation 5', devices: ps5, color: 'blue' }, { label: 'PlayStation 4', devices: ps4, color: 'slate' }].map(group => (
            group.devices.length === 0 ? null : (
              <div key={group.label}>
                <h2 className="font-bold text-slate-700 mb-3">{group.label}</h2>
                <div className="grid grid-cols-3 gap-4">
                  {group.devices.map(device => {
                    const session = getSession(device.id);
                    const isActive = !!session;
                    return (
                      <div key={device.id}
                        className={`rounded-2xl p-5 transition-all ${isActive ? 'bg-gradient-to-br from-blue-600 to-purple-700 text-white shadow-lg' : 'bg-white border-2 border-slate-200 hover:shadow-md'}`}>
                        {/* Device header */}
                        <div className={`flex items-start justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div>
                            <div className={`font-black text-xl ${isActive ? 'text-white' : 'text-slate-800'}`}>{device.name}</div>
                            <div className={`text-xs mt-0.5 ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>{device.type}</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            {isActive ? `● ${t('gaming.active')}` : `○ ${t('gaming.idle')}`}
                          </span>
                        </div>

                        {/* Active session details */}
                        {session && (
                          <div className={`mb-4 space-y-2 ${isRTL ? 'text-right' : ''}`}>
                            <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <span className="text-blue-200 text-xs">{t('gaming.duration')}</span>
                              <LiveTimer startedAt={session.startedAt} />
                            </div>
                            <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <span className="text-blue-200 text-xs">{t('gaming.sessionType')}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${session.currentType === 'SINGLE' ? 'bg-blue-200/30 text-blue-100' : 'bg-purple-300/30 text-purple-100'}`}>
                                {session.currentType === 'SINGLE' ? `👤 ${t('gaming.single')}` : `👥 ${t('gaming.multi')}`}
                              </span>
                            </div>
                            {session.customerId && (
                              <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <span className="text-blue-200 text-xs">👤 Customer</span>
                                <span className="text-xs font-semibold text-white">Linked</span>
                              </div>
                            )}
                            <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <span className="text-blue-200 text-xs">{t('gaming.gamingFee')}</span>
                              <span className="font-bold text-white">{formatCurrency(session.gamingAmount || 0)}</span>
                            </div>
                          </div>
                        )}

                        {/* Rates */}
                        {!session && (
                          <div className={`mb-4 text-xs text-slate-400 space-y-1 ${isRTL ? 'text-right' : ''}`}>
                            <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}><span>{t('gaming.single')}</span><span className="font-semibold">{formatCurrency(device.singleRate)}/hr</span></div>
                            <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}><span>{t('gaming.multi')}</span><span className="font-semibold">{formatCurrency(device.multiRate)}/hr</span></div>
                          </div>
                        )}

                        {/* Actions */}
                        {!isActive ? (
                          <>
                            <div className={`flex gap-2 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              {(['SINGLE', 'MULTI'] as const).map(sessionType => (
                                <button key={sessionType} onClick={() => setDeviceType(device.id, sessionType)}
                                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition ${getDeviceType(device.id) === sessionType ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-blue-300'}`}>
                                  {sessionType === 'SINGLE' ? '👤' : '👥'} {sessionType === 'SINGLE' ? t('gaming.single') : t('gaming.multi')}
                                </button>
                              ))}
                            </div>
                            <button onClick={() => { setSelectedDevice(device); setStartSelectedCustomer(null); setStartCustomerSearch(''); }}
                              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition">
                              ▶ {t('gaming.startSession')}
                            </button>
                          </>
                        ) : (
                          <div className="space-y-2">
                            <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <button onClick={() => handleSwitch(session)}
                                className="flex-1 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-semibold transition">
                                ↔ {t('gaming.switchType')}
                              </button>
                              <button onClick={() => setShowFnb(session)}
                                className="flex-1 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-semibold transition">
                                🍔 {t('gaming.addFnB')}
                              </button>
                            </div>
                            <button onClick={() => setShowTransfer(session)}
                              className="w-full py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-semibold transition">
                              📲 {t('gaming.transferDevice')}
                            </button>
                            <button onClick={() => handleEnd(session)}
                              className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm transition">
                              ⏹ {t('gaming.endSession')}
                            </button>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {/* ── DEVICES TAB ── */}
      {tab === 'devices' && (
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex justify-end">
            <button onClick={() => { setShowAddDevice(true); setDeviceForm({ name: '', type: 'PS4', singleRate: '30', multiRate: '50' }); }}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-xl text-sm hover:bg-blue-700 transition">
              + {t('gaming.addDevice')}
            </button>
          </div>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  {['Device', 'Type', 'Status', 'Single Rate/hr', 'Multi Rate/hr', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {devices.map(d => (
                  <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-800">{d.name}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{d.type}</span></td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${d.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{formatCurrency(d.singleRate)}</td>
                    <td className="px-4 py-3 text-sm">{formatCurrency(d.multiRate)}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => { setShowEditDevice(d); setDeviceForm({ name: d.name, type: d.type, singleRate: String(d.singleRate), multiRate: String(d.multiRate) }); }}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-medium transition">Edit</button>
                      <button onClick={() => handleDeleteDevice(d)}
                        className="px-3 py-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg text-xs font-medium transition">{t('delete')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* F&B Modal */}
      {showFnb && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="font-bold text-lg">🍔 Add F&B — {showFnb.deviceName}</h2>
                <p className="text-xs text-slate-400">Tap any product to add to this session's order</p>
              </div>
              <button onClick={() => setShowFnb(null)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
            </div>
            <div className="px-4 pt-3 pb-2 flex-shrink-0">
              <input
                placeholder="🔍 Search products..."
                value={fnbSearch}
                onChange={e => setFnbSearch(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3">
              {products
                .filter((p: Product) => !fnbSearch || p.name.toLowerCase().includes(fnbSearch.toLowerCase()))
                .map((p: Product) => (
                <button key={p.id} onClick={() => handleAddFnb(showFnb, p.id)}
                  className="p-4 bg-slate-50 hover:bg-blue-50 hover:border-blue-400 border-2 border-slate-200 rounded-2xl text-left transition active:scale-95">
                  <div className="font-semibold text-slate-800 text-sm leading-tight">{p.name}</div>
                  <div className="text-blue-600 font-bold text-sm mt-1.5">{formatCurrency(p.sellingPrice)}</div>
                </button>
              ))}
              {products.filter((p: Product) => !fnbSearch || p.name.toLowerCase().includes(fnbSearch.toLowerCase())).length === 0 && (
                <div className="col-span-2 text-center text-slate-400 py-8">{t('noData')}</div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 flex-shrink-0">
              <button onClick={() => { setShowFnb(null); setFnbSearch(''); }} className="w-full py-2.5 border border-slate-200 rounded-xl text-slate-500 text-sm font-medium">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Device Modals */}
      {showTransfer && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="font-bold text-lg mb-1">📲 Transfer Session</h2>
            <p className="text-sm text-slate-400 mb-4">Move <strong>{showTransfer.deviceName}</strong> session to another free device</p>
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto mb-4">
              {devices.filter(d => d.id !== showTransfer.deviceId && d.status !== 'ACTIVE').map(d => (
                <button key={d.id} onClick={() => handleTransferSession(d.id)}
                  className="p-4 bg-green-50 hover:bg-green-100 border-2 border-green-200 hover:border-green-400 rounded-2xl text-center transition">
                  <div className="font-bold text-green-800">{d.name}</div>
                  <div className="text-xs text-green-600 mt-1">{d.type} · Free</div>
                </button>
              ))}
              {devices.filter(d => d.id !== showTransfer.deviceId && d.status !== 'ACTIVE').length === 0 && (
                <p className="col-span-2 text-center text-slate-400 py-6">{t('gaming.idle')}</p>
              )}
            </div>
            <button onClick={() => setShowTransfer(null)} className="w-full py-2.5 border border-slate-200 rounded-xl text-slate-500 text-sm">{t('cancel')}</button>
          </div>
        </div>
      )}

      {selectedDevice && !getSession(selectedDevice.id) && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="font-bold text-lg mb-1">▶ {t('gaming.startSession')} - {selectedDevice.name}</h2>
            <p className="text-sm text-slate-500 mb-4">
              {isRTL
                ? `هتبدأ جلسة ${getDeviceType(selectedDevice.id) === 'SINGLE' ? t('gaming.single') : t('gaming.multi')}`
                : `Starting a ${getDeviceType(selectedDevice.id).toLowerCase()} session.`}
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">{isRTL ? 'العميل اختياري' : 'Customer (optional)'}</label>
                <input
                  value={startCustomerSearch}
                  onChange={e => { setStartCustomerSearch(e.target.value); if (startSelectedCustomer) setStartSelectedCustomer(null); }}
                  placeholder={isRTL ? 'ابحث عن عميل...' : 'Search customer...'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              {startSelectedCustomer ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-blue-800">{startSelectedCustomer.fullName}</div>
                    <div className="text-xs text-blue-600">
                      {customerMetaText(startSelectedCustomer.phone, startSelectedCustomer.tier, canSeeCustomerPhone, hiddenPhoneLabel)}
                    </div>
                  </div>
                  <button
                    onClick={() => { setStartSelectedCustomer(null); setStartCustomerSearch(''); }}
                    className="text-xs text-blue-500 hover:text-blue-700"
                  >
                    {t('edit')}
                  </button>
                </div>
              ) : customerOptions.length > 0 ? (
                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                  {customerOptions.map((customer: any) => (
                    <button
                      key={customer.id}
                      onClick={() => { setStartSelectedCustomer(customer); setStartCustomerSearch(customer.fullName); }}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50 transition"
                    >
                      <div className="font-semibold text-slate-800 text-sm">{customer.fullName}</div>
                      <div className="text-xs text-slate-500">
                        {customerMetaText(customer.phone, customer.tier, canSeeCustomerPhone, hiddenPhoneLabel)}
                      </div>
                    </button>
                  ))}
                </div>
              ) : startCustomerSearch.length >= 2 ? (
                <div className="text-sm text-slate-400">{t('noData')}</div>
              ) : null}
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                {isRTL ? 'لو العميل عنده باقة، هتقدر تختارها وقت إنهاء الجلسة.' : 'If this customer has a package, you can use it when ending the session.'}
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={resetStartSessionModal}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 text-sm">{t('cancel')}</button>
              <button onClick={() => handleStart(selectedDevice)}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm">{t('confirm')}</button>
            </div>
          </div>
        </div>
      )}

      {endingSession && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="font-bold text-lg mb-1">⏹ {t('gaming.endSession')} - {endingSession.deviceName}</h2>
            <p className="text-sm text-slate-500 mb-4">
              {isRTL ? 'اختار لو عايز تخصم الوقت من باقة العميل أو تتحاسب عادي.' : 'Choose whether to use a package or bill the session normally.'}
            </p>
            <div className="space-y-3">
              {loadingPackages ? (
                <div className="text-sm text-slate-400">{t('loading')}</div>
              ) : compatiblePackages.length > 0 ? (
                <div className="space-y-2">
                  {compatiblePackages.map((pkg: any) => (
                    <button
                      key={pkg.id}
                      onClick={() => finishSession(endingSession, pkg.id)}
                      className="w-full rounded-xl border border-green-200 bg-green-50 hover:bg-green-100 px-4 py-3 text-left transition"
                    >
                      <div className="font-bold text-green-800">{pkg.packageName}</div>
                      <div className="text-xs text-green-700">
                        {Number(pkg.hoursRemaining || 0).toFixed(2)}h left · {pkg.deviceType}/{pkg.sessionType} · Expires {pkg.expiresAt}
                      </div>
                    </button>
                  ))}
                </div>
              ) : activePackages.length > 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  {isRTL ? 'العميل عنده باقات، لكن مفيش واحدة مناسبة لنوع الجهاز أو نوع الجلسة دي.' : 'This customer has packages, but none match this device or session type.'}
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  {isRTL ? 'مفيش باقات صالحة للعميل ده حاليًا.' : 'This customer has no active packages right now.'}
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setEndingSession(null)}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 text-sm">{t('cancel')}</button>
              <button onClick={() => finishSession(endingSession)}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm">
                {isRTL ? 'تحاسب عادي' : 'Charge Normally'}
              </button>
            </div>
          </div>
        </div>
      )}

      {(showAddDevice || showEditDevice) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="font-bold text-lg mb-4">{showAddDevice ? '➕ Add Device' : '✏️ Edit Device'}</h2>
            <div className="space-y-3">
              <input placeholder="Device Name *" value={deviceForm.name}
                onChange={e => setDeviceForm(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              <select value={deviceForm.type} onChange={e => setDeviceForm(p => ({ ...p, type: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none text-sm focus:ring-2 focus:ring-blue-500">
                <option value="PS4">PlayStation 4</option>
                <option value="PS5">PlayStation 5</option>
              </select>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Single Rate/hr (EGP)</label>
                  <input type="number" value={deviceForm.singleRate}
                    onChange={e => setDeviceForm(p => ({ ...p, singleRate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Multi Rate/hr (EGP)</label>
                  <input type="number" value={deviceForm.multiRate}
                    onChange={e => setDeviceForm(p => ({ ...p, multiRate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setShowAddDevice(false); setShowEditDevice(null); }}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 text-sm">{t('cancel')}</button>
              <button onClick={showAddDevice ? handleCreateDevice : handleUpdateDevice}
                disabled={!deviceForm.name}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold rounded-xl text-sm">
                {showAddDevice ? 'Add' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
