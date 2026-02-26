import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FlaskConical, Brain, BookOpen, Pill, Plus, Search, LayoutGrid, List, Pencil, Trash2, ArrowRight, BookMarked, HelpCircle } from 'lucide-react';
import api from '../../../api/client';
import ResourceBreadcrumb from '../../../components/admin/ResourceBreadcrumb';
import Modal from '../../../components/admin/Modal';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';
import { SubjectForm } from '../../../components/admin/ResourceForms';

const PER_PAGE = 10;

const SUBJECT_ROW_STYLES = [
  { Icon: FlaskConical, bg: 'bg-orange-100 dark:bg-orange-900/30', iconCl: 'text-orange-600 dark:text-orange-400' },
  { Icon: Brain, bg: 'bg-indigo-100 dark:bg-indigo-900/30', iconCl: 'text-indigo-600 dark:text-indigo-400' },
  { Icon: BookOpen, bg: 'bg-emerald-100 dark:bg-emerald-900/30', iconCl: 'text-emerald-600 dark:text-emerald-400' },
  { Icon: Pill, bg: 'bg-teal-100 dark:bg-teal-900/30', iconCl: 'text-teal-600 dark:text-teal-400' },
];

function getSubjectRowStyle(index) {
  return SUBJECT_ROW_STYLES[index % SUBJECT_ROW_STYLES.length] || SUBJECT_ROW_STYLES[0];
}

export default function SubjectsList() {
  const [subjects, setSubjects] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formOpen, setFormOpen] = useState(null);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [moduleFilter, setModuleFilter] = useState('');
  const [listView, setListView] = useState(true);
  const [stats, setStats] = useState({ topicCount: null, mcqCount: null });

  const load = () =>
    api
      .get('/admin/subjects')
      .then(({ data }) => setSubjects(Array.isArray(data) ? data : []))
      .catch(() => setSubjects([]));
  const loadModules = () =>
    api
      .get('/admin/modules')
      .then(({ data }) => setModules(Array.isArray(data) ? data : []))
      .catch(() => setModules([]));

  const modulesSorted = useMemo(() => [...modules].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)), [modules]);

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
    if (q) {
      list = list.filter(
        (s) =>
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.module?.name && s.module.name.toLowerCase().includes(q))
      );
    }
    return list;
  }, [subjects, search, moduleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, page]);
  const start = filtered.length === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const end = Math.min(page * PER_PAGE, filtered.length);

  const totalTopicsFromSubjects = useMemo(
    () => subjects.reduce((acc, s) => acc + (s.topicIds?.length || 0), 0),
    [subjects]
  );

  useEffect(() => {
    Promise.all([load(), loadModules()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.get('/admin/dashboard').then(({ data }) => {
      if (data?.topicCount != null) setStats((s) => ({ ...s, topicCount: data.topicCount }));
      if (data?.mcqCount != null) setStats((s) => ({ ...s, mcqCount: data.mcqCount }));
    }).catch(() => {});
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/subjects/${id}`);
      load();
      setDeleteConfirm(null);
    } catch (_) {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-slate-500 dark:text-slate-400">Loading subjects...</div>
      </div>
    );
  }

  return (
    <>
      <ResourceBreadcrumb items={[{ label: 'Resources', path: '/admin/resources' }, { label: 'Subjects', path: null }]} />
      <div className="max-w-7xl w-full mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Subjects</h2>
            <p className="text-slate-500 dark:text-slate-400">All subjects across modules. Add, edit, or open a subject to manage topics and MCQs.</p>
          </div>
          <button
            type="button"
            onClick={() => setAddFormOpen(true)}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-all shadow-sm shadow-primary/20 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>Add subject</span>
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-6 shadow-sm flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex-1 relative group">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by subject or module..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">Sort by:</span>
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="text-sm py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-slate-900 dark:text-white"
              >
                <option value="">All modules</option>
                {modulesSorted.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-4">
            <button
              type="button"
              onClick={() => setListView(false)}
              className={`p-2 rounded-lg transition-colors ${!listView ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              title="Grid view"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setListView(true)}
              className={`p-2 rounded-lg transition-colors ${listView ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              title="List view"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          {listView ? (
            <>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Name</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Module</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Topics Count</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right text-slate-500 dark:text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                        {subjects.length === 0
                          ? 'No subjects yet. Add a subject to get started.'
                          : 'No subjects match your filters.'}
                      </td>
                    </tr>
                  ) : (
                    paginated.map((sub, idx) => {
                      const link = getSubjectLink(sub);
                      const rowStyle = getSubjectRowStyle((page - 1) * PER_PAGE + idx);
                      const topicCount = sub.topicIds?.length ?? 0;
                      const RowIcon = rowStyle.Icon;
                      return (
                        <tr key={sub._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${rowStyle.bg} ${rowStyle.iconCl}`}>
                                <RowIcon className="w-5 h-5" />
                              </div>
                              <span className="font-semibold text-slate-900 dark:text-white">{sub.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400">{sub.module?.name ?? '—'}</td>
                          <td className="px-6 py-5 text-sm">
                            <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium border border-blue-100 dark:border-blue-800">
                              {topicCount} {topicCount === 1 ? 'Topic' : 'Topics'}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center justify-end gap-2">
                              {(sub.module?._id || sub.module) && (
                                <button
                                  type="button"
                                  onClick={() => setFormOpen(sub)}
                                  className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                                  title="Edit"
                                >
                                  <Pencil className="w-5 h-5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setDeleteConfirm(sub)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                title="Delete"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                              {link && (
                                <Link
                                  to={link}
                                  className="ml-2 inline-flex items-center gap-1 text-primary hover:underline font-semibold text-sm"
                                >
                                  Open <ArrowRight className="w-4 h-4" />
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
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Showing {filtered.length === 0 ? 0 : start} to {end} of {filtered.length} subjects
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-200"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-200"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginated.length === 0 ? (
                <p className="col-span-full text-center text-slate-500 dark:text-slate-400 py-8">
                  {subjects.length === 0 ? 'No subjects yet.' : 'No subjects match your filters.'}
                </p>
              ) : (
                paginated.map((sub, idx) => {
                  const link = getSubjectLink(sub);
                  const rowStyle = getSubjectRowStyle((page - 1) * PER_PAGE + idx);
                  const topicCount = sub.topicIds?.length ?? 0;
                  return (
                    <div
                      key={sub._id}
                      className="bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4"
                    >
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${rowStyle.bg} ${rowStyle.iconCl}`}>
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{sub.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{sub.module?.name ?? '—'}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium">
                          {topicCount} Topics
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {(sub.module?._id || sub.module) && (
                          <button type="button" onClick={() => setFormOpen(sub)} className="p-1.5 text-slate-400 hover:text-primary rounded-lg" title="Edit">
                            <Pencil className="w-5 h-5" />
                          </button>
                        )}
                        <button type="button" onClick={() => setDeleteConfirm(sub)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg" title="Delete">
                          <Trash2 className="w-5 h-5" />
                        </button>
                        {link && (
                          <Link to={link} className="p-1.5 text-primary hover:underline font-semibold text-sm flex items-center gap-0.5">
                            Open <ArrowRight className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Subjects</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{subjects.length}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Topics</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {stats.topicCount != null ? stats.topicCount.toLocaleString() : totalTopicsFromSubjects.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Question Bank</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {stats.mcqCount != null ? stats.mcqCount.toLocaleString() : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {formOpen && (
        <SubjectForm
          moduleId={formOpen.module?._id || formOpen.module}
          subject={formOpen}
          onSave={() => {
            load();
            loadModules();
          }}
          onClose={() => setFormOpen(null)}
        />
      )}

      {addFormOpen && (
        <AddSubjectForm
          modules={modules}
          onSave={() => {
            load();
            loadModules();
            setAddFormOpen(false);
          }}
          onClose={() => setAddFormOpen(false)}
        />
      )}

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete subject"
        message={deleteConfirm ? `Delete "${deleteConfirm.name}"? This will remove all topics and MCQs under it.` : ''}
        confirmLabel="Delete"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm._id)}
        danger
      />
    </>
  );
}

function AddSubjectForm({ modules, onSave, onClose }) {
  const [moduleId, setModuleId] = useState('');
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [oneShotTitle, setOneShotTitle] = useState('');
  const [oneShotYoutubeUrl, setOneShotYoutubeUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('image', file);
      const { data } = await api.post('/admin/upload-image', form);
      setImageUrl(data.url);
    } catch (_) {}
    setUploading(false);
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!moduleId) {
      setError('Please select a module.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        imageUrl: (imageUrl || '').trim() || undefined,
      };
      const oneShotTitleTrim = (oneShotTitle || '').trim();
      const oneShotYoutubeTrim = (oneShotYoutubeUrl || '').trim();
      if (oneShotTitleTrim && oneShotYoutubeTrim) {
        payload.oneShotTitle = oneShotTitleTrim;
        payload.youtubeUrl = oneShotYoutubeTrim;
      }
      await api.post(`/admin/modules/${moduleId}/subjects`, payload);
      onSave?.();
      onClose?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create subject');
    } finally {
      setSaving(false);
    }
  };

  const sortedModules = [...(modules || [])].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

  return (
    <Modal open onClose={onClose} title="Add subject">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Module *</label>
          <select
            value={moduleId}
            onChange={(e) => setModuleId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="">Select module</option>
            {sortedModules.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name} {m.year?.name ? `(${m.year.name})` : ''}
              </option>
            ))}
          </select>
          {sortedModules.length === 0 && (
            <p className="text-xs text-slate-500 mt-1">No modules yet. Add modules under Resources → Modules first.</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-slate-800 dark:text-white"
            placeholder="e.g. Anatomy"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Image (optional)</label>
          <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} className="w-full text-sm text-slate-600 dark:text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-medium" />
          {imageUrl && (
            <div className="mt-2 flex items-center gap-2">
              <img src={imageUrl} alt="" className="max-h-32 rounded object-contain border border-slate-200 dark:border-slate-700" />
              <button type="button" onClick={() => setImageUrl('')} className="text-sm text-red-600 dark:text-red-400 hover:underline">
                Remove image
              </button>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">One shot lecture title (optional)</label>
          <input
            value={oneShotTitle}
            onChange={(e) => setOneShotTitle(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-slate-800 dark:text-white"
            placeholder="e.g. Foundation Module One Shot"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">One shot lecture YouTube URL (optional)</label>
          <input
            type="url"
            value={oneShotYoutubeUrl}
            onChange={(e) => setOneShotYoutubeUrl(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-slate-800 dark:text-white"
            placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
          />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button type="submit" disabled={saving || !moduleId} className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50 hover:bg-teal-700">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
