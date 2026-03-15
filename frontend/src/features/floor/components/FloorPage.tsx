import { useI18n } from '../../../i18n';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { baseApi } from '../../../app/baseApi';
import { CafeTable, ApiResponse } from '../../../types/api.types';
import { formatCurrency } from '../../../utils/currency';
import { clearCurrentOrder } from '../../pos/store/posSlice';

const floorApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getTables: b.query<ApiResponse<CafeTable[]>, void>({ query: () => '/floor/tables', providesTags: ['Order'] }),
    createTable: b.mutation<any, any>({ query: (body) => ({ url: '/floor/tables', method: 'POST', body }), invalidatesTags: ['Order'] }),
    updateTable: b.mutation<any, { id: string } & any>({
      query: ({ id, ...body }) => ({ url: `/floor/tables/${id}`, method: 'PATCH', body }), invalidatesTags: ['Order'],
    }),
    deleteTable: b.mutation<any, string>({ query: (id) => ({ url: `/floor/tables/${id}`, method: 'DELETE' }), invalidatesTags: ['Order'] }),
    mergeTables: b.mutation<any, { sourceTableId: string; targetTableId: string }>({
      query: (body) => ({ url: '/floor/tables/merge', method: 'POST', body }), invalidatesTags: ['Order'],
    }),
  }),
  overrideExisting: false,
});
const { useGetTablesQuery, useCreateTableMutation, useUpdateTableMutation, useDeleteTableMutation, useMergeTablesMutation } = floorApi;

const STATUS_STYLE: Record<string, string> = {
  'FREE':     'bg-green-50  border-green-300  text-green-800',
  'OCCUPIED': 'bg-blue-50   border-blue-400   text-blue-800',
  'BILLING':  'bg-yellow-50 border-yellow-400 text-yellow-800',
  'RESERVED': 'bg-purple-50 border-purple-300 text-purple-700',
};
const STATUS_ICON: Record<string, string> = { FREE: '🟢', OCCUPIED: '🔵', BILLING: '🟡', RESERVED: '🟣' };

export default function FloorPage() {
  const { t, isRTL } = useI18n();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data, isLoading } = useGetTablesQuery(undefined, { pollingInterval: 8000 });
  const [createTable] = useCreateTableMutation();
  const [updateTable] = useUpdateTableMutation();
  const [deleteTable] = useDeleteTableMutation();
  const [mergeTables] = useMergeTablesMutation();

  const [contextTable, setContextTable] = useState<CafeTable | null>(null);
  const [showAddTable, setShowAddTable] = useState(false);
  const [showEditTable, setShowEditTable] = useState<CafeTable | null>(null);
  const [addForm, setAddForm] = useState({ name: '', capacity: '4' });
  const [editForm, setEditForm] = useState({ name: '', capacity: '' });
  const [showAdmin, setShowAdmin] = useState(false);
  const [mergeSource, setMergeSource] = useState<CafeTable | null>(null);
  const [msg, setMsg] = useState('');

  const tables = data?.data || [];
  const counts = tables.reduce((acc, t) => ({ ...acc, [t.status]: (acc[t.status] || 0) + 1 }), {} as Record<string, number>);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleTableClick = (t: CafeTable) => {
    if (mergeSource) {
      if (mergeSource.id === t.id) { setMergeSource(null); return; }
      if (t.status === 'OCCUPIED' || t.status === 'BILLING') {
        if (confirm(`Merge "${mergeSource.name}" → "${t.name}"? All items from ${mergeSource.name} will be moved to ${t.name}.`)) {
          mergeTables({ sourceTableId: mergeSource.id, targetTableId: t.id })
            .unwrap()
            .then(() => { flash(`✅ Tables merged into ${t.name}`); })
            .catch((e) => flash('❌ ' + (e?.data?.message || 'Merge failed')));
        }
        setMergeSource(null);
      } else {
        flash('❌ Target table must have an open order');
        setMergeSource(null);
      }
      return;
    }
    setContextTable(t);
  };

  const openPosForTable = (t: CafeTable) => {
    dispatch(clearCurrentOrder());
    navigate('/pos', { state: { table: t } });
    setContextTable(null);
  };

  const viewOrder = (t: CafeTable) => {
    if (t.currentOrderId) {
      window.open(`/receipt/${t.currentOrderId}`, '_blank');
    }
    setContextTable(null);
  };

  const handleAddTable = async () => {
    if (!addForm.name) return;
    try {
      await createTable({ name: addForm.name, capacity: parseInt(addForm.capacity) || 4 }).unwrap();
      setShowAddTable(false);
      setAddForm({ name: '', capacity: '4' });
      flash('✅ Table added');
    } catch { flash('❌ Failed to add table'); }
  };

  const handleEditTable = async () => {
    if (!showEditTable) return;
    try {
      await updateTable({ id: showEditTable.id, name: editForm.name, capacity: parseInt(editForm.capacity) }).unwrap();
      setShowEditTable(null);
      flash('✅ Table updated');
    } catch { flash('❌ Failed to update table'); }
  };

  const handleDeleteTable = async (t: CafeTable) => {
    if (!confirm(`Delete table "${t.name}"?`)) return;
    try {
      await deleteTable(t.id).unwrap();
      flash('✅ Table deleted');
    } catch { flash('❌ Cannot delete table with active order'); }
  };

  return (
    <div className="h-full flex flex-col" onClick={() => setContextTable(null)}>
      {/* Header */}
      <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <h1 className="text-xl font-bold text-slate-800">{t('floor.title')}</h1>
        <div className={`flex gap-2 items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
          {Object.entries(STATUS_ICON).map(([s, e]) => (
            <span key={s} className="px-3 py-1.5 bg-white rounded-full border border-slate-200 text-slate-600 text-xs font-medium">
              {e} {t(`floor.${s.toLowerCase()}`) || s} ({counts[s] || 0})
            </span>
          ))}
          <button onClick={e => { e.stopPropagation(); setShowAdmin(v => !v); }}
            className="px-3 py-1.5 bg-slate-700 text-white rounded-xl text-xs font-medium hover:bg-slate-800 transition">
            {t('floor.manageTables')}
          </button>
        </div>
      </div>

      {msg && <div className={`mb-3 px-4 py-2 rounded-xl text-sm font-medium ${msg.startsWith('❌') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>{msg}</div>}

      {/* Merge mode banner */}
      {mergeSource && (
        <div className={`mb-3 px-4 py-3 bg-amber-50 border border-amber-300 rounded-xl text-sm font-medium text-amber-800 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <span>🔀 {t('floor.mergeMode')}</span>
          <button onClick={() => setMergeSource(null)} className="text-xs text-amber-600 hover:text-amber-800 underline">{t('cancel')}</button>
        </div>
      )}

      {/* Admin bar */}
      {showAdmin && (
        <div className={`mb-4 bg-slate-800 rounded-2xl p-4 flex gap-3 items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
          <span className="text-slate-300 text-sm font-medium">{isRTL ? 'إدارة الطاولات:' : 'Table Admin:'}</span>
          <button onClick={e => { e.stopPropagation(); setShowAddTable(true); }}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition">
            {t('floor.addTable')}
          </button>
          <span className="text-slate-500 text-xs">{isRTL ? 'اضغط على أي طاولة لتعديلها أو حذفها' : 'Click any table to edit or delete it in manage mode'}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400">{t('loading')}</div>
      ) : tables.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-400">{t('noData')}</div>
      ) : (
        <div className="grid grid-cols-4 gap-4 content-start flex-1">
          {tables.map(table => (
            <div key={table.id} onClick={e => { e.stopPropagation(); handleTableClick(table); }}
              className={`rounded-2xl border-2 p-5 transition-all hover:shadow-md cursor-pointer select-none ${STATUS_STYLE[table.status] || 'bg-slate-50 border-slate-200'}`}>
              <div className={`flex justify-between items-start mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="font-bold text-xl">{table.name}</span>
                <span>{STATUS_ICON[table.status] || '⚪'}</span>
              </div>
              <div className="text-xs opacity-70 mb-1">👥 {table.capacity} {t('floor.seats')}</div>
              <div className="text-xs font-bold uppercase tracking-wide">{t(`floor.${table.status.toLowerCase()}`) || table.status}</div>
              {table.currentAmount != null && table.currentAmount > 0 && (
                <div className="mt-2 font-bold text-sm">{formatCurrency(table.currentAmount)}</div>
              )}
              {table.status === 'FREE' && <div className="mt-2 text-xs opacity-50">{t('floor.tapToOpen')}</div>}

              {/* Context menu */}
              {contextTable?.id === table.id && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
                  onClick={e => { e.stopPropagation(); setContextTable(null); }}>
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-64 overflow-hidden"
                  onClick={e => e.stopPropagation()}>
                  {(table.status === 'FREE' || table.status === 'RESERVED') && (
                    <button onClick={() => {
                        if (table.status === 'RESERVED') {
                            if (!window.confirm(isRTL ? 'الطاولة دي محجوزة. متأكد إنك عايز تفتح أوردر؟' : 'This table is reserved. Are you sure you want to open an order?')) return;
                        }
                        openPosForTable(table);
                      }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-green-50 text-green-700 font-semibold flex items-center gap-2 transition">
                      {t('floor.openOrder')}
                    </button>
                  )}
                  {table.status === 'FREE' && (
                    <button onClick={() => { updateTable({ id: table.id, status: 'RESERVED' }); setContextTable(null); }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-purple-50 text-purple-700 font-semibold flex items-center gap-2 transition">
                      🟣 {isRTL ? 'حجز الطاولة' : 'Mark Reserved'}
                    </button>
                  )}
                  {table.status === 'RESERVED' && (
                    <button onClick={() => { updateTable({ id: table.id, status: 'FREE' }); setContextTable(null); }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-green-50 text-green-700 font-semibold flex items-center gap-2 transition">
                      🟢 {isRTL ? 'إلغاء الحجز' : 'Mark Free'}
                    </button>
                  )}
                  {(table.status === 'OCCUPIED' || table.status === 'BILLING') && (
                    <>
                      <button onClick={() => viewOrder(table)}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-blue-50 text-blue-700 font-semibold flex items-center gap-2 transition">
                        {t('floor.viewReceipt')}
                      </button>
                      <button onClick={() => { navigate('/pos', { state: table.currentOrderId ? { tableOrderId: table.currentOrderId } : { table: table } }); setContextTable(null); }}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 text-slate-600 flex items-center gap-2 transition">
                        {t('floor.goToPOS')}
                      </button>
                      <button onClick={() => { setMergeSource(table); setContextTable(null); }}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-amber-50 text-amber-700 flex items-center gap-2 transition">
                        {t('floor.mergeTable')}
                      </button>
                    </>
                  )}
                  {showAdmin && (
                    <>
                      <div className="border-t border-slate-100" />
                      <button onClick={() => { setShowEditTable(table); setEditForm({ name: table.name, capacity: String(table.capacity) }); setContextTable(null); }}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 text-slate-600 flex items-center gap-2 transition">
                        {t('floor.editTable')}
                      </button>
                      <button onClick={() => { handleDeleteTable(table); setContextTable(null); }}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-red-50 text-red-500 flex items-center gap-2 transition">
                        🗑 {t('floor.deleteTable')}
                      </button>
                    </>
                  )}
                  <button onClick={() => setContextTable(null)}
                    className="w-full px-4 py-2 text-center text-xs text-slate-400 hover:bg-slate-50 transition">
                    {t('cancel')}
                  </button>
                </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Table Modal */}
      {showAddTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="font-bold text-lg mb-4">{t('floor.addTable')}</h2>
            <div className="space-y-3">
              <input placeholder={t('floor.tableName')} value={addForm.name}
                onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              <div>
                <label className="text-xs text-slate-500 block mb-1">{t('floor.capacity')}</label>
                <input type="number" value={addForm.capacity} min="1" max="30"
                  onChange={e => setAddForm(p => ({ ...p, capacity: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            </div>
            <div className={`flex gap-2 mt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button onClick={() => setShowAddTable(false)} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 text-sm">{t('cancel')}</button>
              <button onClick={handleAddTable} disabled={!addForm.name}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 text-white font-bold rounded-xl text-sm">{t('add')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Table Modal */}
      {showEditTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="font-bold text-lg mb-4">✏️ {t('floor.editTable')}</h2>
            <div className="space-y-3">
              <input placeholder={t('floor.tableName')} value={editForm.name}
                onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              <div>
                <label className="text-xs text-slate-500 block mb-1">{t('floor.capacity')}</label>
                <input type="number" value={editForm.capacity}
                  onChange={e => setEditForm(p => ({ ...p, capacity: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            </div>
            <div className={`flex gap-2 mt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button onClick={() => setShowEditTable(null)} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 text-sm">{t('cancel')}</button>
              <button onClick={handleEditTable}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm">{t('save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
