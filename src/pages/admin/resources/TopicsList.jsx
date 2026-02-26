import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Download, SlidersHorizontal, ArrowUpDown, CheckCircle, CircleSlash, Pencil, Trash2, ArrowRight } from 'lucide-react';
import api from '../../../api/client';
import ResourceBreadcrumb from '../../../components/admin/ResourceBreadcrumb';
import Modal from '../../../components/admin/Modal';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';
import { TopicForm } from '../../../components/admin/ResourceForms';

const PER_PAGE = 10;

const SORT_OPTIONS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'subject', label: 'Subject' },
];

const SUBJECT_BADGE_STYLES = [
  'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
];

function getSubjectBadgeClass(index) {
  return SUBJECT_BADGE_STYLES[index % SUBJECT_BADGE_STYLES.length] || SUBJECT_BADGE_STYLES[0];
}

export default function TopicsList() {
  const [topics, setTopics] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formOpen, setFormOpen] = useState(null);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  const load = () =>
    api
      .get('/admin/topics')
      .then(({ data }) => setTopics(Array.isArray(data) ? data : []))
      .catch(() => setTopics([]));
  const loadSubjects = () =>
    api
      .get('/admin/subjects')
      .then(({ data }) => setSubjects(Array.isArray(data) ? data : []))
      .catch(() => setSubjects([]));

  const subjectsSorted = useMemo(() => [...subjects].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)), [subjects]);
  const subjectOrderMap = useMemo(() => {
    const m = new Map();
    subjectsSorted.forEach((s, i) => m.set(s._id, i));
    return m;
  }, [subjectsSorted]);

  const getTopicLink = (topic) => {
    const sub = topic.subject;
    const mod = sub?.module;
    const yearId = mod?.year?._id || mod?.year;
    if (!yearId || !mod?._id || !sub?._id) return null;
    return `/admin/resources/years/${yearId}/modules/${mod._id}/subjects/${sub._id}/topics/${topic._id}`;
  };

  const filtered = useMemo(() => {
    let list = topics;
    if (subjectFilter) {
      list = list.filter((t) => (t.subject?._id || t.subject) === subjectFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          (t.name && t.name.toLowerCase().includes(q)) ||
          (t.subject?.name && t.subject.name.toLowerCase().includes(q))
      );
    }
    if (sortBy === 'name-asc') list = [...list].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    else if (sortBy === 'name-desc') list = [...list].sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    else if (sortBy === 'subject') list = [...list].sort((a, b) => (a.subject?.name || '').localeCompare(b.subject?.name || ''));
    else list = [...list].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return list;
  }, [topics, search, subjectFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, page]);
  const start = filtered.length === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const end = Math.min(page * PER_PAGE, filtered.length);

  useEffect(() => {
    Promise.all([load(), loadSubjects()]).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/topics/${id}`);
      load();
      setDeleteConfirm(null);
    } catch (_) {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-slate-500 dark:text-slate-400">Loading topics...</div>
      </div>
    );
  }

  return (
    <>
      <ResourceBreadcrumb items={[{ label: 'Resources', path: '/admin/resources' }, { label: 'Topics', path: null }]} />
      <div className="max-w-7xl w-full mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Topics</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl">
              All topics across subjects. Add, edit, or open a topic to manage MCQs and interactive learning content.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddFormOpen(true)}
            className="flex items-center justify-center space-x-2 bg-primary hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-all shadow-md shadow-primary/20 hover:shadow-lg active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>Add topic</span>
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-4 relative group">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by topic or subject..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary dark:text-slate-200 placeholder:text-slate-400"
              />
            </div>
            <div className="md:col-span-3 flex items-center space-x-2">
              <span className="text-xs font-medium text-slate-400 whitespace-nowrap uppercase tracking-wider">Subject:</span>
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="w-full py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary text-slate-900 dark:text-white"
              >
                <option value="">All subjects</option>
                {subjectsSorted.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3 flex items-center space-x-2">
              <span className="text-xs font-medium text-slate-400 whitespace-nowrap uppercase tracking-wider">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary text-slate-900 dark:text-white"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 flex items-center justify-end space-x-2">
              <button type="button" className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Export Data">
                <Download className="w-5 h-5" />
              </button>
              <button type="button" className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Filter Settings">
                <SlidersHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <div className="flex items-center cursor-default">
                      Topic Name
                      <ArrowUpDown className="w-3 h-3 ml-1" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <div className="flex items-center cursor-default">
                      Subject
                      <ArrowUpDown className="w-3 h-3 ml-1" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Content Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      {topics.length === 0
                        ? 'No topics yet. Add a topic to manage MCQs and content.'
                        : 'No topics match your filters.'}
                    </td>
                  </tr>
                ) : (
                  paginated.map((topic) => {
                    const link = getTopicLink(topic);
                    const mcqCount = topic.mcqCount ?? 0;
                    const subjectIdx = topic.subject?._id ? subjectOrderMap.get(topic.subject._id) ?? 0 : 0;
                    const hasContent = mcqCount > 0;
                    return (
                      <tr key={topic._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-primary mr-3 flex-shrink-0" />
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{topic.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 text-[11px] font-bold rounded-full uppercase ${getSubjectBadgeClass(subjectIdx)}`}>
                            {topic.subject?.name ?? '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                          <div className="flex items-center space-x-2">
                            {hasContent ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                                <span>{mcqCount} MCQ{mcqCount !== 1 ? 's' : ''}</span>
                              </>
                            ) : (
                              <>
                                <CircleSlash className="w-4 h-4 text-slate-400" />
                                <span className="italic">No content</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {(topic.subject?._id || topic.subject) && (
                              <button
                                type="button"
                                onClick={() => setFormOpen(topic)}
                                className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-md transition-colors"
                                title="Edit"
                              >
                                <Pencil className="w-5 h-5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm(topic)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                            {link && (
                              <Link
                                to={link}
                                className="flex items-center space-x-1 text-sm font-bold text-primary hover:underline ml-2"
                              >
                                <span>Open</span>
                                <ArrowRight className="w-4 h-4" />
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
          <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Showing <span className="text-slate-900 dark:text-white">{start}</span> to <span className="text-slate-900 dark:text-white">{end}</span> of{' '}
              <span className="text-slate-900 dark:text-white">{filtered.length}</span> topics
            </p>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-md hover:bg-white dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-400"
              >
                Previous
              </button>
              {(() => {
                const show = Math.min(5, totalPages);
                const startPage = totalPages <= 5 ? 1 : Math.max(1, Math.min(page - 2, totalPages - show + 1));
                return Array.from({ length: show }, (_, i) => startPage + i).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                      page === pageNum
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                ));
              })()}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-md hover:bg-white dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-400"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {formOpen && (
        <TopicForm
          subjectId={formOpen.subject?._id || formOpen.subject}
          topic={formOpen}
          onSave={() => {
            load();
            loadSubjects();
          }}
          onClose={() => setFormOpen(null)}
        />
      )}

      {addFormOpen && (
        <AddTopicForm
          subjects={subjects}
          onSave={() => {
            load();
            loadSubjects();
            setAddFormOpen(false);
          }}
          onClose={() => setAddFormOpen(false)}
        />
      )}

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete topic"
        message={deleteConfirm ? `Delete "${deleteConfirm.name}"? This will remove all MCQs under it.` : ''}
        confirmLabel="Delete"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm._id)}
        danger
      />
    </>
  );
}

function AddTopicForm({ subjects, onSave, onClose }) {
  const [subjectId, setSubjectId] = useState('');
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [content, setContent] = useState('');
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
    if (!subjectId) {
      setError('Please select a subject.');
      return;
    }
    setSaving(true);
    try {
      await api.post(`/admin/subjects/${subjectId}/topics`, {
        name: name.trim(),
        imageUrl: imageUrl.trim() || undefined,
        videoUrl: videoUrl.trim() || undefined,
        content: content.trim() || undefined,
      });
      onSave?.();
      onClose?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create topic');
    } finally {
      setSaving(false);
    }
  };

  const sortedSubjects = [...(subjects || [])].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

  return (
    <Modal open onClose={onClose} title="Add topic">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject *</label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="">Select subject</option>
            {sortedSubjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} {s.module?.name ? `(${s.module.name})` : ''}
              </option>
            ))}
          </select>
          {sortedSubjects.length === 0 && (
            <p className="text-xs text-slate-500 mt-1">No subjects yet. Add subjects under Resources → Subjects first.</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-slate-800 dark:text-white"
            placeholder="e.g. Introduction to Anatomy"
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
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Topic explanatory video (YouTube URL)</label>
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-slate-800 dark:text-white"
            placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Content (optional)</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-slate-800 dark:text-white"
          />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button type="submit" disabled={saving || !subjectId} className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50 hover:bg-teal-700">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
