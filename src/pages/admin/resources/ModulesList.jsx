import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Droplet, Heart, Wind, Plus, Search, ChevronDown, SlidersHorizontal, Pencil, Trash2, ArrowRight, Calendar, ClipboardList } from 'lucide-react';
import api from '../../../api/client';
import ResourceBreadcrumb from '../../../components/admin/ResourceBreadcrumb';
import Modal from '../../../components/admin/Modal';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';
import { ModuleForm } from '../../../components/admin/ResourceForms';

const PER_PAGE = 10;

const MODULE_ROW_STYLES = [
  { Icon: BookOpen, bg: 'bg-sky-100 dark:bg-sky-500/10', iconCl: 'text-primary' },
  { Icon: Droplet, bg: 'bg-red-100 dark:bg-red-500/10', iconCl: 'text-red-500' },
  { Icon: Heart, bg: 'bg-green-100 dark:bg-green-500/10', iconCl: 'text-green-600 dark:text-green-400' },
  { Icon: Wind, bg: 'bg-orange-100 dark:bg-orange-500/10', iconCl: 'text-orange-600 dark:text-orange-400' },
];

function getModuleRowStyle(index) {
  return MODULE_ROW_STYLES[index % MODULE_ROW_STYLES.length] || MODULE_ROW_STYLES[0];
}

const YEAR_BADGE_STYLES = [
  'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400',
];

function getYearBadgeClass(index) {
  return YEAR_BADGE_STYLES[index % YEAR_BADGE_STYLES.length] || YEAR_BADGE_STYLES[0];
}

function subjectInitials(name) {
  if (!name || typeof name !== 'string') return '??';
  return name.trim().slice(0, 2).toUpperCase() || '??';
}

export default function ModulesList() {
  const [modules, setModules] = useState([]);
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formOpen, setFormOpen] = useState(null);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [yearFilter, setYearFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = () =>
    api
      .get('/admin/modules')
      .then(({ data }) => setModules(Array.isArray(data) ? data : []))
      .catch(() => setModules([]));
  const loadYears = () =>
    api
      .get('/admin/years')
      .then(({ data }) => setYears(Array.isArray(data) ? data : []))
      .catch(() => setYears([]));

  const yearsSorted = useMemo(() => [...years].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)), [years]);

  const filteredModules = useMemo(() => {
    let list = modules;
    if (yearFilter) {
      list = list.filter((mod) => (mod.year?._id || mod.year) === yearFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((mod) => (mod.name || '').toLowerCase().includes(q));
    return list;
  }, [modules, yearFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredModules.length / PER_PAGE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return filteredModules.slice(start, start + PER_PAGE);
  }, [filteredModules, page]);
  const start = filteredModules.length === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const end = Math.min(page * PER_PAGE, filteredModules.length);

  const yearOrderMap = useMemo(() => {
    const m = new Map();
    yearsSorted.forEach((y, i) => m.set(y._id, i));
    return m;
  }, [yearsSorted]);

  useEffect(() => {
    Promise.all([load(), loadYears()]).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/modules/${id}`);
      load();
      setDeleteConfirm(null);
    } catch (_) {}
  };

  const avgModulesPerYear = useMemo(() => {
    const byYear = new Set(modules.map((m) => m.year?._id || m.year).filter(Boolean)).size;
    if (!byYear) return '0';
    return (modules.length / byYear).toFixed(1);
  }, [modules]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-slate-500 dark:text-slate-400">Loading modules...</div>
      </div>
    );
  }

  return (
    <>
      <ResourceBreadcrumb items={[{ label: 'Resources', path: '/admin/resources' }, { label: 'Modules', path: null }]} />
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Modules</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
              All modules across academic years. Manage subject hierarchy, content structure, and learning progression.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddFormOpen(true)}
            className="bg-primary hover:bg-sky-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-sky-500/20 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>Add module</span>
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search modules by name..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-primary focus:border-primary dark:text-slate-200 text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="relative min-w-[180px]">
              <label className="absolute -top-2 left-3 px-1 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Filter by Year
              </label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-primary focus:border-primary dark:text-slate-200 text-sm appearance-none"
              >
                <option value="">All years</option>
                {yearsSorted.map((y) => (
                  <option key={y._id} value={y._id}>
                    {y.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-5 h-5 absolute right-3 top-3 text-slate-400 pointer-events-none" />
            </div>
            <button type="button" className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all" title="Filters">
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Module Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Year</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Subjects</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      {modules.length === 0
                        ? 'No modules yet. Add a module to get started.'
                        : yearFilter || search
                          ? 'No modules match your filters.'
                          : 'No modules.'}
                    </td>
                  </tr>
                ) : (
                  paginated.map((mod, idx) => {
                    const yearId = mod.year?._id || mod.year;
                    const rowStyle = getModuleRowStyle((page - 1) * PER_PAGE + idx);
                    const RowIcon = rowStyle.Icon;
                    const yearIdx = yearId ? yearOrderMap.get(yearId) ?? idx : 0;
                    const subjects = mod.subjectIds || [];
                    const showSubjects = subjects.slice(0, 2);
                    const extra = subjects.length > 2 ? subjects.length - 2 : 0;
                    return (
                      <tr key={mod._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${rowStyle.bg} ${rowStyle.iconCl}`}>
                              <RowIcon className="w-5 h-5" />
                            </div>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">{mod.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getYearBadgeClass(yearIdx)}`}>
                            {mod.year?.name ?? '—'}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex -space-x-2">
                            {showSubjects.map((s) => (
                              <div
                                key={s._id}
                                className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-300"
                                title={typeof s === 'object' && s.name ? s.name : ''}
                              >
                                {subjectInitials(typeof s === 'object' ? s.name : s)}
                              </div>
                            ))}
                            {extra > 0 && (
                              <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                +{extra}
                              </div>
                            )}
                            {subjects.length === 0 && (
                              <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {yearId && (
                              <button
                                type="button"
                                onClick={() => setFormOpen(mod)}
                                className="p-2 text-slate-400 hover:text-primary hover:bg-sky-50 dark:hover:bg-sky-500/10 rounded-lg transition-all"
                                title="Edit"
                              >
                                <Pencil className="w-5 h-5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm(mod)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                            {yearId && (
                              <Link
                                to={`/admin/resources/years/${yearId}/modules/${mod._id}`}
                                className="ml-2 flex items-center text-primary font-semibold text-sm hover:underline"
                              >
                                Open <ArrowRight className="w-4 h-4 ml-1" />
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing <span className="font-semibold text-slate-900 dark:text-slate-200">{start}</span> to{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-200">{end}</span> of{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-200">{filteredModules.length}</span> modules
            </p>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 transition-all text-sm font-medium"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 transition-all text-sm font-medium"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Modules</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{modules.length}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Avg. Modules/Year</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{avgModulesPerYear}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Incomplete Drafts</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">0</p>
            </div>
          </div>
        </div>
      </div>

      {formOpen && (
        <ModuleForm
          yearId={formOpen.year?._id || formOpen.year}
          module={formOpen}
          onSave={() => {
            load();
            loadYears();
          }}
          onClose={() => setFormOpen(null)}
        />
      )}

      {addFormOpen && (
        <AddModuleForm
          years={years}
          onSave={() => {
            load();
            loadYears();
            setAddFormOpen(false);
          }}
          onClose={() => setAddFormOpen(false)}
        />
      )}

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete module"
        message={deleteConfirm ? `Delete "${deleteConfirm.name}"? This will remove all subjects, topics and content under it.` : ''}
        confirmLabel="Delete"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm._id)}
        danger
      />
    </>
  );
}

function AddModuleForm({ years, onSave, onClose }) {
  const [yearId, setYearId] = useState('');
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!yearId) {
      setError('Please select a year.');
      return;
    }
    setSaving(true);
    try {
      await api.post(`/admin/years/${yearId}/modules`, {
        name: name.trim(),
        imageUrl: imageUrl.trim() || undefined,
      });
      onSave?.();
      onClose?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create module');
    } finally {
      setSaving(false);
    }
  };

  const sortedYears = [...(years || [])].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

  return (
    <Modal open onClose={onClose} title="Add module">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Year *</label>
          <select
            value={yearId}
            onChange={(e) => setYearId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="">Select year</option>
            {sortedYears.map((y) => (
              <option key={y._id} value={y._id}>
                {y.name}
              </option>
            ))}
          </select>
          {sortedYears.length === 0 && (
            <p className="text-xs text-slate-500 mt-1">No years yet. Add years under Resources → Years first.</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-slate-800 dark:text-white"
            placeholder="e.g. Foundation Module"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Image URL</label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-slate-800 dark:text-white"
            placeholder="https://..."
          />
          <p className="text-xs text-slate-500 mt-1">Optional. Used on the public Modules page.</p>
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button type="submit" disabled={saving || !yearId} className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50 hover:bg-sky-600">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
