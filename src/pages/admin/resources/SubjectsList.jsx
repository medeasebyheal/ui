import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api/client';
import ResourceBreadcrumb from '../../../components/admin/ResourceBreadcrumb';
import Modal from '../../../components/admin/Modal';
import { SubjectForm } from '../../../components/admin/ResourceForms';
import { BookOpen, Pencil, Trash2, Search, Plus } from 'lucide-react';

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

export default function SubjectsList() {
  const [subjects, setSubjects] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formOpen, setFormOpen] = useState(null);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [moduleFilter, setModuleFilter] = useState('');

  const load = () => api.get('/admin/subjects').then(({ data }) => setSubjects(data)).catch(() => setSubjects([]));
  const loadModules = () => api.get('/admin/modules').then(({ data }) => setModules(data || [])).catch(() => setModules([]));

  const modulesFromSubjects = useMemo(() => {
    const seen = new Map();
    subjects.forEach((s) => {
      const mod = s.module;
      if (mod && (mod._id || mod)) {
        const id = mod._id || mod;
        if (!seen.has(id)) seen.set(id, { _id: id, name: mod.name ?? id });
      }
    });
    return Array.from(seen.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [subjects]);

  const modulesForFilter = modules.length > 0 ? [...modules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : modulesFromSubjects;

  useEffect(() => {
    Promise.all([load(), loadModules()]).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/subjects/${id}`);
      load();
      setDeleteConfirm(null);
    } catch (_) {}
  };

  const getSubjectLink = (sub) => {
    const mod = sub.module;
    const yearId = mod?.year?._id || mod?.year;
    if (!yearId || !mod?._id) return null;
    return `/admin/resources/years/${yearId}/modules/${mod._id}/subjects/${sub._id}`;
  };

  const filtered = useMemo(() => {
    let list = subjects;
    if (moduleFilter) {
      list = list.filter((s) => (s.module?._id || s.module) === moduleFilter);
    }
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (s) =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.module?.name && s.module.name.toLowerCase().includes(q))
    );
  }, [subjects, search, moduleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize]
  );

  useEffect(() => {
    setPage((p) => (p > totalPages ? 1 : p));
  }, [totalPages, search, moduleFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-gray-500">Loading subjects...</div>
      </div>
    );
  }

  return (
    <>
      <ResourceBreadcrumb items={[{ label: 'Resources', path: '/admin/resources' }, { label: 'Subjects', path: null }]} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Subjects</h1>
          <p className="text-sm text-gray-500 mt-1">All subjects across modules. Add, edit, or open a subject to manage topics and MCQs.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setAddFormOpen(true)}
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-medium shadow-sm hover:shadow transition-shadow"
          >
            <Plus className="w-5 h-5" /> Add subject
          </button>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            Sort by module
            <select
              value={moduleFilter}
              onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 bg-white focus:ring-2 focus:ring-primary focus:border-primary min-w-[10rem]"
            >
              <option value="">All modules</option>
              {modulesForFilter.map((m) => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by subject or module..."
              className="w-full sm:w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
            />
          </div>
        </div>
      </div>

      {/* Desktop: table listing */}
      <div className="hidden lg:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/80">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Module</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((sub) => {
              const link = getSubjectLink(sub);
              return (
                <tr key={sub._id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="py-3 px-4">
                    {link ? (
                      <Link to={link} className="font-medium text-gray-900 hover:text-primary">
                        {sub.name}
                      </Link>
                    ) : (
                      <span className="font-medium text-gray-900">{sub.name}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">{sub.module?.name ?? '—'}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {(sub.module?._id || sub.module) && (
                        <button
                          type="button"
                          onClick={() => setFormOpen(sub)}
                          className="p-2 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-lg"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(sub)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {link && (
                        <Link to={link} className="text-sm font-medium text-primary hover:underline ml-1">
                          Open →
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
        {paginated.map((sub) => {
          const link = getSubjectLink(sub);
          return (
            <div
              key={sub._id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
            >
              <Link to={link || '#'} className="block p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-heading font-semibold text-gray-900 group-hover:text-primary transition-colors">{sub.name}</h2>
                    <p className="text-xs text-gray-500">{sub.module?.name ? `Module: ${sub.module.name}` : `Order: ${sub.order}`}</p>
                  </div>
                </div>
              </Link>
              <div className="flex items-center gap-2 px-5 pb-4 border-t border-gray-100 pt-3">
                {(sub.module?._id || sub.module) && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setFormOpen(sub); }}
                    className="p-2 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setDeleteConfirm(sub); }}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {link && (
                  <Link to={link} className="ml-auto text-sm font-medium text-primary hover:underline">
                    Open →
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {filtered.length > pageSize && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
              {search && ` (filtered)`}
            </p>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              Per page
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-700 bg-white focus:ring-2 focus:ring-primary focus:border-primary"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600 px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {search && filtered.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-gray-500 font-medium">No subjects match &quot;{search}&quot;</p>
          <p className="text-sm text-gray-400 mt-1">Try a different search or clear the search box.</p>
        </div>
      )}

      {subjects.length === 0 && !search && (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No subjects yet</p>
          <p className="text-sm text-gray-400 mt-1">Add modules first, then add subjects here or from the hierarchy.</p>
          <button type="button" onClick={() => setAddFormOpen(true)} className="mt-4 text-primary font-medium hover:underline">
            Add first subject
          </button>
          <span className="mx-2 text-gray-400">or</span>
          <Link to="/admin/resources/hierarchy" className="text-primary font-medium hover:underline">Go to hierarchy</Link>
        </div>
      )}

      {filtered.length === 0 && !search && moduleFilter && (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-gray-500 font-medium">No subjects in this module</p>
          <p className="text-sm text-gray-400 mt-1">Try another module or clear the filter.</p>
          <button type="button" onClick={() => { setModuleFilter(''); setPage(1); }} className="mt-4 text-primary font-medium hover:underline">Clear module filter</button>
        </div>
      )}

      {formOpen && (
        <SubjectForm
          moduleId={formOpen.module?._id || formOpen.module}
          subject={formOpen}
          onSave={() => { load(); loadModules(); }}
          onClose={() => setFormOpen(null)}
        />
      )}

      {addFormOpen && (
        <AddSubjectForm
          modules={modules}
          onSave={() => { load(); loadModules(); setAddFormOpen(false); }}
          onClose={() => setAddFormOpen(false)}
        />
      )}

      {deleteConfirm && (
        <Modal open onClose={() => setDeleteConfirm(null)} title="Delete subject">
          <p className="text-gray-600 mb-4">Delete &quot;{deleteConfirm.name}&quot;? This will remove all topics and MCQs under it.</p>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border rounded-lg">Cancel</button>
            <button type="button" onClick={() => handleDelete(deleteConfirm._id)} className="px-4 py-2 bg-red-600 text-white rounded-lg">Delete</button>
          </div>
        </Modal>
      )}
    </>
  );
}

function AddSubjectForm({ modules, onSave, onClose }) {
  const [moduleId, setModuleId] = useState('');
  const [name, setName] = useState('');
  const [order, setOrder] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!moduleId) {
      setError('Please select a module.');
      return;
    }
    setSaving(true);
    try {
      await api.post(`/admin/modules/${moduleId}/subjects`, {
        name: name.trim(),
        order: Number(order) || 1,
      });
      onSave?.();
      onClose?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create subject');
    } finally {
      setSaving(false);
    }
  };

  const sortedModules = [...(modules || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <Modal open onClose={onClose} title="Add subject">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Module *</label>
          <select
            value={moduleId}
            onChange={(e) => setModuleId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="">Select module</option>
            {sortedModules.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name} {m.year?.name ? `(${m.year.name})` : ''}
              </option>
            ))}
          </select>
          {sortedModules.length === 0 && (
            <p className="text-xs text-gray-500 mt-1">No modules yet. Add modules under Resources → Modules first.</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="e.g. Anatomy"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
          <button type="submit" disabled={saving || !moduleId} className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
