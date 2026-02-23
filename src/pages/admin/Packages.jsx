import { useEffect, useState, useMemo } from 'react';
import api from '../../api/client';
import Modal from '../../components/admin/Modal';
import ConfirmDialog from '../../components/admin/ConfirmDialog';

const PACKAGE_TYPES = [
  { value: 'year_half_part1', label: 'Half Year - Part 1', badge: 'blue' },
  { value: 'year_half_part2', label: 'Half Year - Part 2', badge: 'blue' },
  { value: 'year_full', label: 'Full Year', badge: 'purple' },
  { value: 'master_proff', label: 'Master Proff', badge: 'amber' },
];

const PER_PAGE = 10;

function packageId(id) {
  if (!id) return '—';
  const str = typeof id === 'string' ? id : String(id);
  return `PKG-${str.slice(-5).toUpperCase()}`;
}

function typeBadgeClass(badge) {
  const map = {
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  };
  return map[badge] || 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
}

export default function AdminPackages() {
  const [packages, setPackages] = useState([]);
  const [years, setYears] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [page, setPage] = useState(1);

  const loadPackages = () =>
    api.get('/admin/packages').then(({ data }) => setPackages(Array.isArray(data) ? data : [])).catch(() => setPackages([]));
  const loadYears = () =>
    api.get('/admin/years').then(({ data }) => setYears(data || [])).catch(() => setYears([]));
  const loadModules = () =>
    api.get('/admin/modules').then(({ data }) => setModules(data || [])).catch(() => setModules([]));

  useEffect(() => {
    Promise.all([loadPackages(), loadYears(), loadModules()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (formOpen) loadModules();
  }, [formOpen]);

  const modulesByYear = useMemo(() => {
    const map = {};
    modules.forEach((m) => {
      const yearName = m.year?.name ?? 'Other';
      if (!map[yearName]) map[yearName] = [];
      map[yearName].push(m);
    });
    Object.keys(map).forEach((k) => map[k].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    return map;
  }, [modules]);

  const filtered = useMemo(() => {
    let list = packages;
    const q = searchInput.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p._id || '').toLowerCase().includes(q) ||
          packageId(p._id).toLowerCase().includes(q)
      );
    }
    if (typeFilter) list = list.filter((p) => p.type === typeFilter);
    if (yearFilter !== '') list = list.filter((p) => String(p.year) === yearFilter);
    return list;
  }, [packages, searchInput, typeFilter, yearFilter]);

  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PER_PAGE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, page]);

  const uniqueYears = useMemo(() => {
    const ys = [...new Set(packages.map((p) => p.year).filter((y) => y != null))];
    return ys.sort((a, b) => a - b);
  }, [packages]);

  const avgPrice = useMemo(() => {
    if (packages.length === 0) return 0;
    const sum = packages.reduce((s, p) => s + (p.price || 0), 0);
    return Math.round(sum / packages.length);
  }, [packages]);

  useEffect(() => {
    setPage(1);
  }, [searchInput, typeFilter, yearFilter]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/packages/${id}`);
      loadPackages();
      setDeleteConfirm(null);
    } catch (_) {}
  };

  const start = totalFiltered === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const end = Math.min(page * PER_PAGE, totalFiltered);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Packages</h2>
        <button
          type="button"
          onClick={() => setFormOpen({})}
          className="bg-primary hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-semibold transition-all shadow-sm active:scale-[0.98] w-fit"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Add Package
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search packages by name or ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Filter by Type:</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary py-2 pr-10 pl-3"
          >
            <option value="">All Types</option>
            {PACKAGE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Year:</label>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary py-2 pr-10 pl-3"
          >
            <option value="">All Years</option>
            {uniqueYears.map((y) => (
              <option key={y} value={String(y)}>Year {y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Package Name</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Type</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Year / Part</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Modules</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Price</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">Loading...</td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">No packages found.</td>
                </tr>
              ) : (
                paginated.map((pkg) => {
                  const typeConfig = PACKAGE_TYPES.find((t) => t.value === pkg.type);
                  const typeLabel = typeConfig?.label ?? pkg.type;
                  const badgeClass = typeBadgeClass(typeConfig?.badge ?? 'amber');
                  const moduleCount = pkg.moduleIds?.length ?? 0;
                  return (
                    <tr key={pkg._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{pkg.name || '—'}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">ID: {packageId(pkg._id)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
                          {typeLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {pkg.type === 'master_proff' ? '—' : `Year ${pkg.year ?? '—'}${pkg.part != null ? `, Part ${pkg.part}` : ''}`}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm opacity-50">layers</span>
                          {moduleCount} module{moduleCount !== 1 ? 's' : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-primary font-bold text-lg">Rs {(pkg.price ?? 0).toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setFormOpen(pkg)}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-all"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(pkg)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined">delete</span>
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

        {/* Pagination */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing <span className="font-medium text-slate-900 dark:text-slate-100">{start}</span> to{' '}
            <span className="font-medium text-slate-900 dark:text-slate-100">{end}</span> of{' '}
            <span className="font-medium text-slate-900 dark:text-slate-100">{totalFiltered}</span> results
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span> Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Packages</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="material-symbols-outlined text-blue-500 dark:text-blue-400">inventory_2</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{packages.length}</p>
          <span className="text-xs text-slate-400 dark:text-slate-500">in catalog</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Active Subscriptions</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <span className="material-symbols-outlined text-emerald-500 dark:text-emerald-400">check_circle</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">—</p>
          <span className="text-xs text-slate-400 dark:text-slate-500">across all packages</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Monthly Revenue</span>
            <div className="p-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
              <span className="material-symbols-outlined text-teal-500 dark:text-teal-400">payments</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">—</p>
          <span className="text-xs text-slate-400 dark:text-slate-500">from approved payments</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Avg. Package Price</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <span className="material-symbols-outlined text-amber-500 dark:text-amber-400">analytics</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">Rs {avgPrice.toLocaleString()}</p>
          <span className="text-xs text-slate-400 dark:text-slate-500">based on active list</span>
        </div>
      </div>

      {formOpen && (
        <PackageForm
          package={formOpen._id ? formOpen : null}
          years={years}
          modulesByYear={modulesByYear}
          onSave={() => { loadPackages(); loadYears(); }}
          onClose={() => setFormOpen(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete package"
        message={deleteConfirm ? `Delete "${deleteConfirm.name}"? Users who purchased this package will not be affected, but it will no longer be available for purchase.` : ''}
        confirmLabel="Delete"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm._id)}
        danger
      />
    </div>
  );
}

function PackageForm({ package: pkg, years, modulesByYear, onSave, onClose }) {
  const [name, setName] = useState(pkg?.name ?? '');
  const [type, setType] = useState(pkg?.type ?? 'year_half_part1');
  const [year, setYear] = useState(() => {
    if (pkg?.year != null) return pkg.year;
    const first = years.find((y) => y.order != null);
    return first?.order ?? 1;
  });
  const [part, setPart] = useState(pkg?.part ?? 1);
  const [moduleIds, setModuleIds] = useState(() => {
    const ids = pkg?.moduleIds ?? [];
    return new Set(ids.map((m) => (typeof m === 'object' && m?._id ? m._id : m)));
  });
  const [price, setPrice] = useState(pkg?.price ?? 0);
  const [description, setDescription] = useState(pkg?.description ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isMasterProff = type === 'master_proff';

  const toggleModule = (id) => {
    setModuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        type,
        price: Number(price) || 0,
        description: description.trim(),
        moduleIds: Array.from(moduleIds),
      };
      if (!isMasterProff) {
        payload.year = Number(year) || 1;
        payload.part = type === 'year_full' ? null : Number(part) || 1;
      } else {
        payload.year = null;
        payload.part = null;
      }
      if (pkg?._id) {
        await api.put(`/admin/packages/${pkg._id}`, payload);
      } else {
        await api.post('/admin/packages', payload);
      }
      onSave?.();
      onClose?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={pkg ? 'Edit package' : 'Add package'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-slate-800"
            placeholder="e.g. MS 1 - Part 1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type *</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-slate-800"
          >
            {PACKAGE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {!isMasterProff && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Year</label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-slate-800"
              >
                {years.length === 0 ? (
                  [1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>MS {n}</option>
                  ))
                ) : (
                  years
                    .slice()
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map((y) => (
                      <option key={y._id} value={y.order != null ? y.order : y._id}>
                        {y.name}
                      </option>
                    ))
                )}
              </select>
            </div>
            {type !== 'year_full' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Part</label>
                <select
                  value={part}
                  onChange={(e) => setPart(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-slate-800"
                >
                  <option value={1}>Part 1</option>
                  <option value={2}>Part 2</option>
                </select>
              </div>
            )}
          </>
        )}

        {!isMasterProff && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Modules</label>
            <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-3 bg-slate-50/50 dark:bg-slate-800/50">
              {Object.entries(modulesByYear).map(([yearName, mods]) => (
                <div key={yearName}>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">{yearName}</p>
                  <div className="space-y-1.5">
                    {mods.map((m) => (
                      <label key={m._id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={moduleIds.has(m._id)}
                          onChange={() => toggleModule(m._id)}
                          className="rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-slate-800 dark:text-slate-200">{m.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(modulesByYear).length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">No modules. Create years and modules under Resources first.</p>
              )}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Price (Rs)</label>
          <input
            type="number"
            min={0}
            step={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-slate-800"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-slate-800"
            placeholder="e.g. Foundation Module, Locomotor Module"
          />
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
