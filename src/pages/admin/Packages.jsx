import { useEffect, useState, useMemo } from 'react';
import api from '../../api/client';
import Modal from '../../components/admin/Modal';
import { Plus, Pencil, Trash2, Package as PackageIcon } from 'lucide-react';

const PACKAGE_TYPES = [
  { value: 'year_half_part1', label: 'Half Year – Part 1' },
  { value: 'year_half_part2', label: 'Half Year – Part 2' },
  { value: 'year_full', label: 'Full Year' },
  { value: 'master_proff', label: 'Master Proff' },
];

export default function AdminPackages() {
  const [packages, setPackages] = useState([]);
  const [years, setYears] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadPackages = () =>
    api.get('/admin/packages').then(({ data }) => setPackages(data)).catch(() => setPackages([]));
  const loadYears = () =>
    api.get('/admin/years').then(({ data }) => setYears(data || [])).catch(() => setYears([]));
  const loadModules = () =>
    api.get('/admin/modules').then(({ data }) => setModules(data || [])).catch(() => setModules([]));

  useEffect(() => {
    Promise.all([loadPackages(), loadYears(), loadModules()]).finally(() => setLoading(false));
  }, []);

  // Refetch modules when opening form so dropdown is always up to date
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

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/packages/${id}`);
      loadPackages();
      setDeleteConfirm(null);
    } catch (_) {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-gray-900">Packages</h1>
        <button
          type="button"
          onClick={() => setFormOpen({})}
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-medium shadow-sm hover:shadow transition-shadow"
        >
          <Plus className="w-5 h-5" /> Add package
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/80">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Year / Part</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Modules</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Price</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {packages.map((pkg) => (
              <tr key={pkg._id} className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="py-3 px-4 font-medium text-gray-900">{pkg.name}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{PACKAGE_TYPES.find((t) => t.value === pkg.type)?.label ?? pkg.type}</td>
                <td className="py-3 px-4 text-sm text-gray-500">
                  {pkg.type === 'master_proff' ? '—' : `Year ${pkg.year ?? '—'}${pkg.part != null ? `, Part ${pkg.part}` : ''}`}
                </td>
                <td className="py-3 px-4 text-sm text-gray-500">
                  {pkg.moduleIds?.length ? (
                    <span title={pkg.moduleIds.map((m) => (m?.name ?? m)).join(', ')}>
                      {pkg.moduleIds.length} module{pkg.moduleIds.length !== 1 ? 's' : ''}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="py-3 px-4 text-right font-medium text-primary">₨{pkg.price ?? 0}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setFormOpen(pkg)}
                      className="p-2 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-lg"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(pkg)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {packages.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 mt-4">
          <PackageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No packages yet</p>
          <button type="button" onClick={() => setFormOpen({})} className="mt-4 text-primary font-medium hover:underline">
            Add first package
          </button>
        </div>
      )}

      {formOpen && (
        <PackageForm
          package={formOpen._id ? formOpen : null}
          years={years}
          modulesByYear={modulesByYear}
          onSave={() => { loadPackages(); loadYears(); }}
          onClose={() => setFormOpen(null)}
        />
      )}

      {deleteConfirm && (
        <Modal open onClose={() => setDeleteConfirm(null)} title="Delete package">
          <p className="text-gray-600 mb-4">
            Delete &quot;{deleteConfirm.name}&quot;? Users who purchased this package will not be affected, but it will no longer be available for purchase.
          </p>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border rounded-lg">
              Cancel
            </button>
            <button type="button" onClick={() => handleDelete(deleteConfirm._id)} className="px-4 py-2 bg-red-600 text-white rounded-lg">
              Delete
            </button>
          </div>
        </Modal>
      )}
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="e.g. MS 1 - Part 1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
            {PACKAGE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {!isMasterProff && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Part</label>
                <select
                  value={part}
                  onChange={(e) => setPart(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Modules</label>
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-3 bg-gray-50/50">
              {Object.entries(modulesByYear).map(([yearName, mods]) => (
                <div key={yearName}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{yearName}</p>
                  <div className="space-y-1.5">
                    {mods.map((m) => (
                      <label key={m._id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={moduleIds.has(m._id)}
                          onChange={() => toggleModule(m._id)}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-gray-800">{m.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(modulesByYear).length === 0 && (
                <p className="text-sm text-gray-500">No modules. Create years and modules under Resources first.</p>
              )}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price (₨)</label>
          <input
            type="number"
            min={0}
            step={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="e.g. Foundation Module, Locomotor Module"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
