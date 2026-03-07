import { useEffect, useState, useMemo } from 'react';
import { PlusCircle, Check, ListOrdered, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api/client';
import ConfirmDialog from '../../components/admin/ConfirmDialog';

const PER_PAGE = 10;

function formatDateRange(from, to) {
  if (!from && !to) return '—';
  const opts = { timeZone: 'Asia/Karachi', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' };
  const f = from ? new Date(from).toLocaleString('en-US', opts) : '—';
  const t = to ? new Date(to).toLocaleString('en-US', opts) : '—';
  return `${f} - ${t}`;
}

function daysLeft(validTo) {
  if (!validTo) return null;
  const end = new Date(validTo);
  const now = new Date();
  if (end < now) return null;
  return Math.ceil((end - now) / (24 * 60 * 60 * 1000));
}

function isExpired(promo) {
  if (promo.validTo && new Date(promo.validTo).getTime() < Date.now()) return true;
  if (promo.usageLimit != null && (promo.usageCount || 0) >= promo.usageLimit) return true;
  return false;
}

export default function AdminPromoCodes() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({
    code: '',
    discountType: 'fixed',
    discountValue: '',
    validFrom: '',
    validTo: '',
    usageLimit: '',
    isActive: true,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCodes = () => {
    setLoading(true);
    api.get('/admin/promo-codes').then(({ data }) => setCodes(Array.isArray(data) ? data : [])).catch(() => setCodes([])).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const resetForm = () => {
    setForm({
      code: '',
      discountType: 'fixed',
      discountValue: '',
      validFrom: '',
      validTo: '',
      usageLimit: '',
      isActive: true,
    });
    setEditing(null);
    setError('');
  };

  const handleEdit = (promo) => {
    setEditing(promo);
    // Convert stored UTC timestamps back to PKT datetime-local strings (YYYY-MM-DDThh:mm)
    const from = promo.validFrom
      ? (() => {
        const d = new Date(promo.validFrom);
        // shift UTC -> PKT (UTC+5)
        const pk = new Date(d.getTime() + 5 * 60 * 60 * 1000);
        return pk.toISOString().slice(0, 16);
      })()
      : '';
    const to = promo.validTo
      ? (() => {
        const d = new Date(promo.validTo);
        const pk = new Date(d.getTime() + 5 * 60 * 60 * 1000);
        return pk.toISOString().slice(0, 16);
      })()
      : '';
    setForm({
      code: promo.code || '',
      discountType: promo.discountType || 'fixed',
      discountValue: promo.discountValue ?? '',
      validFrom: from,
      validTo: to,
      usageLimit: promo.usageLimit ?? '',
      isActive: promo.isActive !== false,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue) || 0,
        // Save dates in Pakistan time (PKT / UTC+5). Convert local YYYY-MM-DDThh:mm to UTC ISO.
        validFrom: form.validFrom
          ? new Date(form.validFrom + "+05:00").toISOString()
          : undefined,
        validTo: form.validTo
          ? new Date(form.validTo + "+05:00").toISOString()
          : undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        isActive: form.isActive,
      };
      if (editing) {
        await api.put(`/admin/promo-codes/${editing._id}`, payload);
      } else {
        await api.post('/admin/promo-codes', payload);
      }
      resetForm();
      fetchCodes();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await api.delete(`/admin/promo-codes/${deleteId}`);
      setDeleteId(null);
      fetchCodes();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  const activeCount = useMemo(() => codes.filter((c) => c.isActive !== false && !isExpired(c)).length, [codes]);
  const totalPages = Math.max(1, Math.ceil(codes.length / PER_PAGE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return codes.slice(start, start + PER_PAGE);
  }, [codes, page]);
  const start = codes.length === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const end = Math.min(page * PER_PAGE, codes.length);

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Enhanced Promo Codes Management</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Create, monitor and manage promotional offers for your students.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Create / Edit form - left */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-semibold flex items-center text-slate-900 dark:text-white">
                <PlusCircle className="w-5 h-5 mr-2 text-primary" />
                {editing ? 'Edit Promo Code' : 'Create Promo Code'}
              </h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Coupon Code</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g. SAVE500"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-slate-400 px-3 py-2"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Discount Type</label>
                    <select
                      value={form.discountType}
                      onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-primary transition-all px-3 py-2"
                    >
                      <option value="fixed">Fixed (Rs)</option>
                      <option value="percent">Percentage (%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Value</label>
                    <input
                      type="number"
                      value={form.discountValue}
                      onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                      min={0}
                      step={form.discountType === 'percent' ? 1 : 1}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-primary transition-all px-3 py-2"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Valid From (PKT)</label>
                    <input
                      type="datetime-local"
                      value={form.validFrom}
                      onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-primary transition-all px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Valid To (PKT)</label>
                    <input
                      type="datetime-local"
                      value={form.validTo}
                      onChange={(e) => setForm((f) => ({ ...f, validTo: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-primary transition-all px-3 py-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Usage Limit</label>
                  <input
                    type="number"
                    value={form.usageLimit}
                    onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
                    min={0}
                    placeholder="Unlimited"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-slate-400 px-3 py-2"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-slate-600 dark:text-slate-400">Mark as active immediately</label>
                </div>
                <div className="flex gap-2">
                  {editing && (
                    <button type="button" onClick={resetForm} className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 bg-primary hover:bg-teal-600 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center disabled:opacity-50"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    {saving ? 'Saving...' : editing ? 'Update Promo Code' : 'Create Promo Code'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Table - right */}
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center text-slate-900 dark:text-white">
                <ListOrdered className="w-5 h-5 mr-2 text-primary" />
                Existing Promo Codes
              </h2>
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-xs font-medium rounded-full text-slate-700 dark:text-slate-300">
                {activeCount} Active
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-4 font-semibold">Code &amp; Type</th>
                    <th className="px-6 py-4 font-semibold">Usage Stat</th>
                    <th className="px-6 py-4 font-semibold">Validity</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">Loading...</td>
                    </tr>
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">No promo codes yet. Create one in the form.</td>
                    </tr>
                  ) : (
                    paginated.map((promo) => {
                      const expired = isExpired(promo) || promo.isActive === false;
                      const used = promo.usageCount || 0;
                      const limit = promo.usageLimit;
                      const percent = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
                      const days = daysLeft(promo.validTo);
                      const usageLabel = limit == null ? `${used} used` : `${used}/${limit}`;
                      const statLabel = limit == null ? 'Unlimited' : percent >= 100 ? 'Fully used' : percent >= 80 ? 'Running out' : `${percent}% redeemed`;
                      return (
                        <tr
                          key={promo._id}
                          className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${expired ? 'opacity-75' : ''}`}
                        >
                          <td className="px-6 py-5">
                            <div className={`font-bold ${expired ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                              {promo.code}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {promo.discountType === 'fixed'
                                ? `Fixed Discount (Rs ${(promo.discountValue || 0).toLocaleString()})`
                                : `Percentage (${promo.discountValue || 0}%)`}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center space-x-3 mb-1">
                              <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden min-w-[80px]">
                                <div
                                  className="h-full bg-primary rounded-full transition-all"
                                  style={{
                                    width: limit ? `${percent}%` : '0%',
                                    backgroundColor: percent >= 100 ? 'rgb(203 213 225)' : percent >= 80 ? 'rgb(245 158 11)' : undefined,
                                  }}
                                />
                              </div>
                              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 shrink-0">{usageLabel}</span>
                            </div>
                            <div
                              className={`text-[10px] uppercase tracking-tighter font-semibold ${percent >= 100 ? 'text-slate-400' : percent >= 80 ? 'text-amber-600 dark:text-amber-400' : 'text-primary'
                                }`}
                            >
                              {statLabel}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-sm text-slate-700 dark:text-slate-300">
                              {formatDateRange(promo.validFrom, promo.validTo)}
                            </div>
                            {promo.validTo && (
                              <div className="text-[10px] font-medium mt-0.5">
                                {days != null ? (
                                  <span className="text-primary">{days} days left</span>
                                ) : new Date(promo.validTo) < new Date() ? (
                                  <span className="text-slate-400">Expired</span>
                                ) : (
                                  <span className="text-slate-400 italic">Year-long promo</span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-5">
                            {expired ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5 shrink-0" />
                                Expired
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 shrink-0" />
                                Active
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => handleEdit(promo)}
                                className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-all"
                                title="Edit"
                              >
                                <Pencil className="w-5 h-5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteId(promo._id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all"
                                title="Delete"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
              <span>Showing {start} to {end} of {codes.length} codes</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {(() => {
                  const show = Math.min(5, totalPages);
                  let start = Math.max(1, Math.min(page - Math.floor(show / 2), totalPages - show + 1));
                  if (totalPages <= show) start = 1;
                  return Array.from({ length: show }, (_, i) => start + i).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`px-3 py-1 rounded font-medium transition-all ${page === p ? 'bg-primary text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                      {p}
                    </button>
                  ));
                })()}
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete promo code"
        message="Are you sure you want to delete this promo code?"
        onConfirm={handleDelete}
      />
    </div>
  );
}
