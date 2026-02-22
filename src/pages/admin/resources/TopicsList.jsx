import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api/client';
import ResourceBreadcrumb from '../../../components/admin/ResourceBreadcrumb';
import Modal from '../../../components/admin/Modal';
import { TopicForm } from '../../../components/admin/ResourceForms';
import { FileText, Pencil, Trash2, Search, Plus } from 'lucide-react';

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

export default function TopicsList() {
  const [topics, setTopics] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formOpen, setFormOpen] = useState(null);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [subjectFilter, setSubjectFilter] = useState('');

  const load = () => api.get('/admin/topics').then(({ data }) => setTopics(data)).catch(() => setTopics([]));
  const loadSubjects = () => api.get('/admin/subjects').then(({ data }) => setSubjects(data || [])).catch(() => setSubjects([]));

  const subjectsFromTopics = useMemo(() => {
    const seen = new Map();
    topics.forEach((t) => {
      const sub = t.subject;
      if (sub && (sub._id || sub)) {
        const id = sub._id || sub;
        if (!seen.has(id)) seen.set(id, { _id: id, name: sub.name ?? id });
      }
    });
    return Array.from(seen.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [topics]);

  const subjectsForFilter = subjects.length > 0 ? [...subjects].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : subjectsFromTopics;

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
    if (!q) return list;
    return list.filter(
      (t) =>
        (t.name && t.name.toLowerCase().includes(q)) ||
        (t.subject?.name && t.subject.name.toLowerCase().includes(q))
    );
  }, [topics, search, subjectFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize]
  );

  useEffect(() => {
    setPage((p) => (p > totalPages ? 1 : p));
  }, [totalPages, search, subjectFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-gray-500">Loading topics...</div>
      </div>
    );
  }

  return (
    <>
      <ResourceBreadcrumb items={[{ label: 'Resources', path: '/admin/resources' }, { label: 'Topics', path: null }]} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Topics</h1>
          <p className="text-sm text-gray-500 mt-1">All topics across subjects. Add, edit, or open a topic to manage MCQs and content.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setAddFormOpen(true)}
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-medium shadow-sm hover:shadow transition-shadow"
          >
            <Plus className="w-5 h-5" /> Add topic
          </button>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            Filter by subject
            <select
              value={subjectFilter}
              onChange={(e) => { setSubjectFilter(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 bg-white focus:ring-2 focus:ring-primary focus:border-primary min-w-[10rem]"
            >
              <option value="">All subjects</option>
              {subjectsForFilter.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by topic or subject..."
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
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Subject</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((topic) => {
              const link = getTopicLink(topic);
              return (
                <tr key={topic._id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="py-3 px-4">
                    {link ? (
                      <Link to={link} className="font-medium text-gray-900 hover:text-primary">
                        {topic.name}
                      </Link>
                    ) : (
                      <span className="font-medium text-gray-900">{topic.name}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">{topic.subject?.name ?? '—'}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {(topic.subject?._id || topic.subject) && (
                        <button
                          type="button"
                          onClick={() => setFormOpen(topic)}
                          className="p-2 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-lg"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(topic)}
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
        {paginated.map((topic) => {
          const link = getTopicLink(topic);
          return (
            <div
              key={topic._id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
            >
              <Link to={link || '#'} className="block p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-heading font-semibold text-gray-900 group-hover:text-primary transition-colors">{topic.name}</h2>
                    <p className="text-xs text-gray-500">{topic.subject?.name ? `Subject: ${topic.subject.name}` : `Order: ${topic.order}`}</p>
                  </div>
                </div>
              </Link>
              <div className="flex items-center gap-2 px-5 pb-4 border-t border-gray-100 pt-3">
                {(topic.subject?._id || topic.subject) && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setFormOpen(topic); }}
                    className="p-2 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setDeleteConfirm(topic); }}
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
          <p className="text-gray-500 font-medium">No topics match &quot;{search}&quot;</p>
          <p className="text-sm text-gray-400 mt-1">Try a different search or clear the search box.</p>
        </div>
      )}

      {topics.length === 0 && !search && (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No topics yet</p>
          <p className="text-sm text-gray-400 mt-1">Add subjects first, then add topics here or from the hierarchy.</p>
          <button type="button" onClick={() => setAddFormOpen(true)} className="mt-4 text-primary font-medium hover:underline">
            Add first topic
          </button>
          <span className="mx-2 text-gray-400">or</span>
          <Link to="/admin/resources/hierarchy" className="text-primary font-medium hover:underline">Go to hierarchy</Link>
        </div>
      )}

      {filtered.length === 0 && !search && subjectFilter && (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-gray-500 font-medium">No topics in this subject</p>
          <p className="text-sm text-gray-400 mt-1">Try another subject or clear the filter.</p>
          <button type="button" onClick={() => { setSubjectFilter(''); setPage(1); }} className="mt-4 text-primary font-medium hover:underline">Clear subject filter</button>
        </div>
      )}

      {formOpen && (
        <TopicForm
          subjectId={formOpen.subject?._id || formOpen.subject}
          topic={formOpen}
          onSave={() => { load(); loadSubjects(); }}
          onClose={() => setFormOpen(null)}
        />
      )}

      {addFormOpen && (
        <AddTopicForm
          subjects={subjects}
          onSave={() => { load(); loadSubjects(); setAddFormOpen(false); }}
          onClose={() => setAddFormOpen(false)}
        />
      )}

      {deleteConfirm && (
        <Modal open onClose={() => setDeleteConfirm(null)} title="Delete topic">
          <p className="text-gray-600 mb-4">Delete &quot;{deleteConfirm.name}&quot;? This will remove all MCQs under it.</p>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border rounded-lg">Cancel</button>
            <button type="button" onClick={() => handleDelete(deleteConfirm._id)} className="px-4 py-2 bg-red-600 text-white rounded-lg">Delete</button>
          </div>
        </Modal>
      )}
    </>
  );
}

function AddTopicForm({ subjects, onSave, onClose }) {
  const [subjectId, setSubjectId] = useState('');
  const [name, setName] = useState('');
  const [order, setOrder] = useState(1);
  const [videoUrl, setVideoUrl] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
        order: Number(order) || 1,
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

  const sortedSubjects = [...(subjects || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <Modal open onClose={onClose} title="Add topic">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="">Select subject</option>
            {sortedSubjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} {s.module?.name ? `(${s.module.name})` : ''}
              </option>
            ))}
          </select>
          {sortedSubjects.length === 0 && (
            <p className="text-xs text-gray-500 mt-1">No subjects yet. Add subjects under Resources → Subjects first.</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="e.g. Introduction to Anatomy"
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">YouTube video URL</label>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="https://youtube.com/..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content (optional)</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
          <button type="submit" disabled={saving || !subjectId} className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
