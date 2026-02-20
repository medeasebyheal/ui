import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../../api/client';
import ResourceBreadcrumb from '../../../components/admin/ResourceBreadcrumb';
import Modal from '../../../components/admin/Modal';
import { Plus, Pencil, Trash2, Upload, HelpCircle, Youtube, Video } from 'lucide-react';

const basePath = (y, m, s, t) => `/admin/resources/years/${y}/modules/${m}/subjects/${s}/topics/${t}`;

export default function TopicMcqs() {
  const { yearId, moduleId, subjectId, topicId } = useParams();
  const [year, setYear] = useState(null);
  const [module_, setModule_] = useState(null);
  const [subject, setSubject] = useState(null);
  const [topic, setTopic] = useState(null);
  const [mcqs, setMcqs] = useState([]);
  const [oneShotLectures, setOneShotLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [lectureForm, setLectureForm] = useState(null);
  const [lectureDeleteConfirm, setLectureDeleteConfirm] = useState(null);

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
  const loadOneShotLectures = () => api.get(`/admin/topics/${topicId}/one-shot-lectures`).then(({ data }) => setOneShotLectures(data || [])).catch(() => setOneShotLectures([]));

  useEffect(() => {
    if (!yearId || !moduleId || !subjectId || !topicId) return;
    Promise.all([loadMeta(), loadTopic(), loadMcqs(), loadOneShotLectures()]).finally(() => setLoading(false));
  }, [yearId, moduleId, subjectId, topicId]);

  const handleDelete = async (mcqId) => {
    try { await api.delete(`/admin/topics/${topicId}/mcqs/${mcqId}`); loadMcqs(); setDeleteConfirm(null); } catch (_) {}
  };

  const handleLectureDelete = async (lectureId) => {
    try { await api.delete(`/admin/topics/${topicId}/one-shot-lectures/${lectureId}`); loadOneShotLectures(); setLectureDeleteConfirm(null); } catch (_) {}
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

  return (
    <>
      <ResourceBreadcrumb items={breadcrumbItems} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">{topic.name}</h1>
          <p className="text-sm text-gray-500 mt-1">MCQs for this topic. Add single MCQs or bulk import (text, image-based, guess-until-correct).</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLectureForm({})}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:border-primary/50 hover:text-primary transition-colors"
          >
            <Video className="w-5 h-5" /> Add One Shot Lecture
          </button>
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

      {/* One Shot Lectures */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-heading font-semibold text-gray-900">One Shot YouTube Lectures ({oneShotLectures.length})</h2>
          <button
            type="button"
            onClick={() => setLectureForm({})}
            className="text-sm text-primary font-medium hover:underline"
          >
            + Add lecture
          </button>
        </div>
        <ul className="divide-y divide-gray-100">
          {oneShotLectures.map((lecture, i) => (
            <li key={lecture._id} className="p-4 hover:bg-gray-50/50 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0 text-sm font-medium text-red-600">
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{lecture.title}</p>
                  <a href={lecture.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate block">{lecture.youtubeUrl}</a>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button type="button" onClick={() => setLectureForm({ lecture })} className="p-2 text-gray-500 hover:text-primary rounded-lg" title="Edit"><Pencil className="w-4 h-4" /></button>
                <button type="button" onClick={() => setLectureDeleteConfirm(lecture)} className="p-2 text-gray-500 hover:text-red-600 rounded-lg" title="Delete"><Trash2 className="w-4 h-4" /></button>
              </div>
            </li>
          ))}
        </ul>
        {oneShotLectures.length === 0 && (
          <div className="text-center py-12 bg-gray-50/50">
            <Video className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 font-medium">No one shot lectures yet</p>
            <p className="text-sm text-gray-400 mt-1">Add YouTube lectures for this topic.</p>
            <button type="button" onClick={() => setLectureForm({})} className="mt-3 text-primary font-medium hover:underline">Add lecture</button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-heading font-semibold text-gray-900">MCQs ({mcqs.length})</h2>
        </div>
        <ul className="divide-y divide-gray-100">
          {mcqs.map((mcq, i) => (
            <li key={mcq._id} className="p-4 hover:bg-gray-50/50 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm font-medium text-primary">
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 line-clamp-2">{mcq.question}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="inline-block text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{mcq.type}</span>
                    {mcq.videoUrl && <span className="inline-flex items-center gap-0.5 text-xs text-primary" title="Has video"><Youtube className="w-3.5 h-3.5" /></span>}
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

      {deleteConfirm && (
        <Modal open onClose={() => setDeleteConfirm(null)} title="Delete MCQ">
          <p className="text-gray-600 mb-4">Delete this MCQ?</p>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border rounded-lg">Cancel</button>
            <button type="button" onClick={() => handleDelete(deleteConfirm._id)} className="px-4 py-2 bg-red-600 text-white rounded-lg">Delete</button>
          </div>
        </Modal>
      )}

      {lectureDeleteConfirm && (
        <Modal open onClose={() => setLectureDeleteConfirm(null)} title="Delete One Shot Lecture">
          <p className="text-gray-600 mb-4">Delete &quot;{lectureDeleteConfirm.title}&quot;?</p>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setLectureDeleteConfirm(null)} className="px-4 py-2 border rounded-lg">Cancel</button>
            <button type="button" onClick={() => handleLectureDelete(lectureDeleteConfirm._id)} className="px-4 py-2 bg-red-600 text-white rounded-lg">Delete</button>
          </div>
        </Modal>
      )}

      {lectureForm && (
        <OneShotLectureForm
          key={lectureForm.lecture?._id ?? 'new'}
          lecture={lectureForm.lecture ?? null}
          topicId={topicId}
          onSave={loadOneShotLectures}
          onClose={() => setLectureForm(null)}
        />
      )}
    </>
  );
}

function OneShotLectureForm({ lecture, topicId, onSave, onClose }) {
  const [title, setTitle] = useState(lecture?.title ?? '');
  const [youtubeUrl, setYoutubeUrl] = useState(lecture?.youtubeUrl ?? '');
  const [order, setOrder] = useState(lecture?.order ?? 0);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (lecture?._id) {
        await api.put(`/admin/topics/${topicId}/one-shot-lectures/${lecture._id}`, { title, youtubeUrl, order });
      } else {
        await api.post(`/admin/topics/${topicId}/one-shot-lectures`, { title, youtubeUrl, order });
      }
      onSave?.();
      onClose?.();
    } catch (_) {}
    setSaving(false);
  };

  return (
    <Modal open onClose={onClose} title={lecture ? 'Edit One Shot Lecture' : 'Add One Shot Lecture'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" placeholder="e.g. Foundation Module One Shot" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL</label>
          <input type="url" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" placeholder="https://www.youtube.com/watch?v=..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
          <input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50">Save</button>
        </div>
      </form>
    </Modal>
  );
}
