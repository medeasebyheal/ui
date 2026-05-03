import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../../api/client';
import ResourceBreadcrumb from '../../../components/admin/ResourceBreadcrumb';
import Modal from '../../../components/admin/Modal';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';
import { Plus, Pencil, Trash2, Upload, HelpCircle, FileText, Link as LinkIcon, Download } from 'lucide-react';

const basePath = (y, m, s, t) => `/admin/resources/years/${y}/modules/${m}/subjects/${s}/topics/${t}`;

export default function TopicMcqs() {
  const { yearId, moduleId, subjectId, topicId } = useParams();
  const [year, setYear] = useState(null);
  const [module_, setModule_] = useState(null);
  const [subject, setSubject] = useState(null);
  const [topic, setTopic] = useState(null);
  const [mcqs, setMcqs] = useState([]);
  const [topicResources, setTopicResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [resourceForm, setResourceForm] = useState(null);
  const [resourceDeleteConfirm, setResourceDeleteConfirm] = useState(null);
  const [downloadingResourceId, setDownloadingResourceId] = useState(null);

  const loadMeta = async () => {
    const [yearsRes, modulesRes, subjectsRes] = await Promise.all([
      api.get('/admin/years'),
      api.get(`/admin/years/${yearId}/modules`),
      api.get(`/admin/modules/${moduleId}/subjects`),
    ]);
    setYear(yearsRes.data.find((x) => x._id === yearId) || null);
    setModule_(modulesRes.data.find((x) => x._id === moduleId) || null);
    setSubject(subjectsRes.data.find((x) => x._id === subjectId) || null);
  };
  const loadTopic = () => api.get('/admin/subjects/' + subjectId + '/topics').then(({ data }) => setTopic(data.find((x) => x._id === topicId) || null)).catch(() => setTopic(null));
  const loadMcqs = () => api.get(`/admin/topics/${topicId}/mcqs`).then(({ data }) => setMcqs(data)).catch(() => setMcqs([]));
  const loadTopicResources = () => api.get(`/admin/topics/${topicId}/resources`).then(({ data }) => setTopicResources(data || [])).catch(() => setTopicResources([]));

  useEffect(() => {
    if (!yearId || !moduleId || !subjectId || !topicId) return;
    Promise.all([loadMeta(), loadTopic(), loadMcqs(), loadTopicResources()]).finally(() => setLoading(false));
  }, [yearId, moduleId, subjectId, topicId]);

  const handleDelete = async (mcqId) => {
    try { await api.delete(`/admin/topics/${topicId}/mcqs/${mcqId}`); loadMcqs(); setDeleteConfirm(null); } catch (_) {}
  };

  const handleResourceDelete = async (resourceId) => {
    try { await api.delete(`/admin/topics/${topicId}/resources/${resourceId}`); loadTopicResources(); setResourceDeleteConfirm(null); } catch (_) {}
  };

  const handleResourceDownload = async (e, res) => {
    if (res.type !== 'pdf') return;
    e.preventDefault();
    if (downloadingResourceId === res._id) return;
    setDownloadingResourceId(res._id);
    try {
      const response = await fetch(res.url, { mode: 'cors' });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(res.title || 'resource').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-') || 'download'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (_) {
      window.open(res.url, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloadingResourceId(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-pulse text-gray-500">Loading...</div></div>;
  if (!year || !module_ || !subject || !topic) return <p className="text-gray-500">Not found.</p>;

  const breadcrumbItems = [
    { label: 'Resources', path: '/admin/resources' },
    ...(year.program ? [{ label: year.program.name, path: `/admin/resources/programs/${year.program._id}` }] : []),
    { label: year.name, path: `/admin/resources/years/${yearId}` },
    { label: module_.name, path: `/admin/resources/years/${yearId}/modules/${moduleId}` },
    { label: subject.name, path: `/admin/resources/years/${yearId}/modules/${moduleId}/subjects/${subjectId}` },
    { label: topic.name, path: null },
  ];

  const groupedMcqs = {};
  mcqs.forEach(mcq => {
    const setName = mcq.mcqSet?.trim() || 'Default';
    if (!groupedMcqs[setName]) groupedMcqs[setName] = [];
    groupedMcqs[setName].push(mcq);
  });
  
  const mcqSets = Object.keys(groupedMcqs).map(name => ({
    name,
    mcqs: groupedMcqs[name]
  })).sort((a, b) => {
    if (a.name === 'Default') return -1;
    if (b.name === 'Default') return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <>
      <ResourceBreadcrumb items={breadcrumbItems} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">{topic.name}</h1>
          <p className="text-sm text-gray-500 mt-1">MCQs for this topic. Add single MCQs or bulk import (text, image-based, guess-until-correct).</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`${basePath(yearId, moduleId, subjectId, topicId)}/mcqs/bulk`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-primary/30 text-primary font-medium hover:bg-primary/5 transition-colors"
          >
            <Upload className="w-5 h-5" /> Bulk import
          </Link>
          <Link
            to={`${basePath(yearId, moduleId, subjectId, topicId)}/mcqs/new`}
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-medium shadow-sm hover:shadow transition-colors"
          >
            <Plus className="w-5 h-5" /> Add MCQ
          </Link>
        </div>
      </div>

      {/* Topic Resources (PDF + Link) */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-heading font-semibold text-gray-900">Topic Resources ({topicResources.length})</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setResourceForm({ type: 'pdf' })}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:border-primary/50 hover:text-primary transition-colors"
            >
              <FileText className="w-4 h-4" /> Upload PDF
            </button>
            <button
              type="button"
              onClick={() => setResourceForm({ type: 'link' })}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:border-primary/50 hover:text-primary transition-colors"
            >
              <LinkIcon className="w-4 h-4" /> Add Link
            </button>
          </div>
        </div>
        <ul className="divide-y divide-gray-100">
          {topicResources.map((res, i) => (
            <li key={res._id} className="p-4 hover:bg-gray-50/50 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0 text-sm font-medium text-teal-600">
                  {res.type === 'pdf' ? <FileText className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{res.title}</p>
                  <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate block">{res.url}</a>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {res.type === 'pdf' && (
                  <button type="button" onClick={(e) => handleResourceDownload(e, res)} disabled={downloadingResourceId === res._id} className="p-2 text-gray-500 hover:text-primary rounded-lg disabled:opacity-50" title="Download PDF"><Download className="w-4 h-4" /></button>
                )}
                <button type="button" onClick={() => setResourceForm({ resource: res })} className="p-2 text-gray-500 hover:text-primary rounded-lg" title="Edit"><Pencil className="w-4 h-4" /></button>
                <button type="button" onClick={() => setResourceDeleteConfirm(res)} className="p-2 text-gray-500 hover:text-red-600 rounded-lg" title="Delete"><Trash2 className="w-4 h-4" /></button>
              </div>
            </li>
          ))}
        </ul>
        {topicResources.length === 0 && (
          <div className="text-center py-12 bg-gray-50/50">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 font-medium">No resources yet</p>
            <p className="text-sm text-gray-400 mt-1">Upload a PDF or add a resource link for this topic.</p>
            <div className="flex gap-2 justify-center mt-3">
              <button type="button" onClick={() => setResourceForm({ type: 'pdf' })} className="text-primary font-medium hover:underline">Upload PDF</button>
              <button type="button" onClick={() => setResourceForm({ type: 'link' })} className="text-primary font-medium hover:underline">Add Link</button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-heading font-semibold text-gray-900">MCQs ({mcqs.length})</h2>
        </div>
        {mcqSets.map((set, setIndex) => (
          <div key={set.name} className={setIndex > 0 ? "border-t border-gray-200" : ""}>
            <div className="bg-gray-50/50 px-4 py-2 border-b border-gray-100">
              <span className="font-medium text-gray-700 text-sm">{set.name} Set</span>
              <span className="ml-2 text-xs text-gray-400">({set.mcqs.length} questions)</span>
            </div>
            <ul className="divide-y divide-gray-100">
              {set.mcqs.map((mcq, i) => (
                <li key={mcq._id} className="p-4 hover:bg-gray-50/50 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm font-medium text-primary">
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 line-clamp-2">{mcq.question}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="inline-block text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{mcq.type}</span>
                      </div>
                      {mcq.explanation && <p className="text-sm text-gray-500 mt-1 line-clamp-1">{mcq.explanation}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link to={`${basePath(yearId, moduleId, subjectId, topicId)}/mcqs/${mcq._id}/edit`} className="p-2 text-gray-500 hover:text-primary rounded-lg" title="Edit"><Pencil className="w-4 h-4" /></Link>
                    <button type="button" onClick={() => setDeleteConfirm(mcq)} className="p-2 text-gray-500 hover:text-red-600 rounded-lg" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {mcqs.length === 0 && (
          <div className="text-center py-16 bg-gray-50/50">
            <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No MCQs yet</p>
            <p className="text-sm text-gray-400 mt-1">Add an MCQ or use bulk import (Question / 4 options with one &quot;(correct)&quot; / explanation).</p>
            <div className="flex gap-2 justify-center mt-4">
              <Link to={`${basePath(yearId, moduleId, subjectId, topicId)}/mcqs/new`} className="text-primary font-medium hover:underline">Add MCQ</Link>
              <Link to={`${basePath(yearId, moduleId, subjectId, topicId)}/mcqs/bulk`} className="text-primary font-medium hover:underline">Bulk import</Link>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete MCQ"
        message="Delete this MCQ?"
        confirmLabel="Delete"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm._id)}
        danger
      />
      <ConfirmDialog
        open={!!resourceDeleteConfirm}
        onClose={() => setResourceDeleteConfirm(null)}
        title="Delete Resource"
        message={resourceDeleteConfirm ? `Delete "${resourceDeleteConfirm.title}"?` : ''}
        confirmLabel="Delete"
        onConfirm={() => resourceDeleteConfirm && handleResourceDelete(resourceDeleteConfirm._id)}
        danger
      />

      {resourceForm && (
        <TopicResourceForm
          key={resourceForm.resource?._id ?? (resourceForm.type + 'new')}
          resource={resourceForm.resource ?? null}
          type={resourceForm.type}
          topicId={topicId}
          onSave={loadTopicResources}
          onClose={() => setResourceForm(null)}
        />
      )}

      </>
  );
}

function TopicResourceForm({ resource, type: initialType, topicId, onSave, onClose }) {
  const isEdit = !!resource?._id;
  const [type] = useState(resource?.type ?? initialType ?? 'link');
  const [title, setTitle] = useState(resource?.title ?? '');
  const [url, setUrl] = useState(resource?.url ?? '');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/admin/topics/${topicId}/resources/${resource._id}`, { title, url: url.trim() || undefined });
      } else if (type === 'pdf' && file) {
        const formData = new FormData();
        formData.append('type', 'pdf');
        formData.append('title', title);
        formData.append('file', file);
        await api.post(`/admin/topics/${topicId}/resources`, formData);
      } else if (type === 'link') {
        await api.post(`/admin/topics/${topicId}/resources`, { type: 'link', title, url: url.trim() });
      } else {
        setSaving(false);
        return;
      }
      onSave?.();
      onClose?.();
    } catch (_) {}
    setSaving(false);
  };

  const titleLabel = isEdit ? 'Edit Resource' : type === 'pdf' ? 'Upload PDF' : 'Add Resource Link';
  return (
    <Modal open onClose={onClose} title={titleLabel}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" placeholder="e.g. Chapter notes PDF" />
        </div>
        {type === 'pdf' && !isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PDF File</label>
            <input type="file" accept=".pdf,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} required={!isEdit} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary" />
            <p className="text-xs text-gray-500 mt-1">Max 15MB. File will be uploaded to Cloudinary.</p>
          </div>
        )}
        {(type === 'link' || isEdit) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} required={type === 'link' || isEdit} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" placeholder="https://..." />
          </div>
        )}
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
          <button type="submit" disabled={saving || (type === 'pdf' && !isEdit && !file)} className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50">Save</button>
        </div>
      </form>
    </Modal>
  );
}

