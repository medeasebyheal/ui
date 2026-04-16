import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../../api/client';
import ResourceBreadcrumb from '../../../components/admin/ResourceBreadcrumb';
import { TopicForm } from '../../../components/admin/ResourceForms';
import Modal from '../../../components/admin/Modal';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';
import { Plus, Pencil, Trash2, FileQuestion, Video } from 'lucide-react';

export default function SubjectTopics() {
  const { yearId, moduleId, subjectId } = useParams();
  const [year, setYear] = useState(null);
  const [module_, setModule_] = useState(null);
  const [subject, setSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [oneShotLectures, setOneShotLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topicForm, setTopicForm] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [lectureForm, setLectureForm] = useState(null);
  const [lectureDeleteConfirm, setLectureDeleteConfirm] = useState(null);

  const loadMeta = async () => {
    const [yearsRes, modulesRes] = await Promise.all([
      api.get('/admin/years'),
      api.get(`/admin/years/${yearId}/modules`),
    ]);
    const y = yearsRes.data.find((x) => x._id === yearId);
    const m = modulesRes.data.find((x) => x._id === moduleId);
    setYear(y || null);
    setModule_(m || null);
  };
  const loadSubject = () => api.get('/admin/modules/' + moduleId + '/subjects').then(({ data }) => setSubject(data.find((x) => x._id === subjectId) || null)).catch(() => setSubject(null));
  const loadTopics = () => api.get(`/admin/subjects/${subjectId}/topics`).then(({ data }) => setTopics(data)).catch(() => setTopics([]));
  const loadOneShotLectures = () => api.get(`/admin/subjects/${subjectId}/one-shot-lectures`).then(({ data }) => setOneShotLectures(data || [])).catch(() => setOneShotLectures([]));

  useEffect(() => {
    if (!yearId || !moduleId || !subjectId) return;
    Promise.all([loadMeta(), loadSubject(), loadTopics(), loadOneShotLectures()]).finally(() => setLoading(false));
  }, [yearId, moduleId, subjectId]);

  const handleLectureDelete = async (lectureId) => {
    try {
      await api.delete(`/admin/subjects/${subjectId}/one-shot-lectures/${lectureId}`);
      loadOneShotLectures();
      setLectureDeleteConfirm(null);
    } catch (_) { }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/topics/${id}`);
      loadTopics();
      setDeleteConfirm(null);
    } catch (_) { }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-pulse text-gray-500">Loading...</div></div>;
  if (!year || !module_ || !subject) return <p className="text-gray-500">Not found.</p>;

  const breadcrumbItems = [
    { label: 'Resources', path: '/admin/resources' },
    ...(year.program ? [{ label: year.program.name, path: `/admin/resources/programs/${year.program._id}` }] : []),
    { label: year.name, path: `/admin/resources/years/${yearId}` },
    { label: module_.name, path: `/admin/resources/years/${yearId}/modules/${moduleId}` },
    { label: subject.name, path: null },
  ];

  return (
    <>
      <ResourceBreadcrumb items={breadcrumbItems} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">{subject.name}</h1>
          <p className="text-sm text-gray-500 mt-1">Topics under this subject. Open a topic to manage MCQs.</p>
        </div>
        <button type="button" onClick={() => setTopicForm({})} className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-medium shadow-sm hover:shadow transition-shadow">
          <Plus className="w-5 h-5" /> Add topic
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <ul className="divide-y divide-gray-100">
          {topics.map((topic) => (
            <li key={topic._id} className="flex items-center justify-between p-4 hover:bg-gray-50/50 group">
              <Link to={`/admin/resources/years/${yearId}/modules/${moduleId}/subjects/${subjectId}/topics/${topic._id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileQuestion className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <span className="font-medium text-gray-900 group-hover:text-primary block truncate">{topic.name}</span>
                  {topic.videoUrl || topic.videoUrls.length > 0 && <span className="text-xs text-gray-500">Has explanatory video</span>}
                </div>
              </Link>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button type="button" onClick={() => setTopicForm({ topic })} className="p-2 text-gray-500 hover:text-primary rounded-lg"><Pencil className="w-4 h-4" /></button>
                <button type="button" onClick={() => setDeleteConfirm(topic)} className="p-2 text-gray-500 hover:text-red-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                <Link to={`/admin/resources/years/${yearId}/modules/${moduleId}/subjects/${subjectId}/topics/${topic._id}`} className="text-sm font-medium text-primary hover:underline">Manage MCQs</Link>
              </div>
            </li>
          ))}
        </ul>
        {topics.length === 0 && (
          <div className="text-center py-16 bg-gray-50/50">
            <FileQuestion className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No topics yet</p>
            <button type="button" onClick={() => setTopicForm({})} className="mt-4 text-primary font-medium hover:underline">Add first topic</button>
          </div>
        )}
      </div>

      {/* One Shot Lectures */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-6">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-heading font-semibold text-gray-900">One Shot Lectures ({oneShotLectures.length})</h2>
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
            <p className="text-sm text-gray-400 mt-1">Add YouTube lectures for this subject.</p>
            <button type="button" onClick={() => setLectureForm({})} className="mt-3 text-primary font-medium hover:underline">Add lecture</button>
          </div>
        )}
      </div>

      {topicForm && <TopicForm subjectId={subjectId} topic={topicForm.topic || null} onSave={loadTopics} onClose={() => setTopicForm(null)} />}
      {lectureForm && (
        <OneShotLectureForm
          key={lectureForm.lecture?._id ?? 'new'}
          lecture={lectureForm.lecture ?? null}
          subjectId={subjectId}
          onSave={loadOneShotLectures}
          onClose={() => setLectureForm(null)}
        />
      )}
      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete topic"
        message={deleteConfirm ? `Delete "${deleteConfirm.name}"? All MCQs in this topic will be removed.` : ''}
        confirmLabel="Delete"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm._id)}
        danger
      />
      <ConfirmDialog
        open={!!lectureDeleteConfirm}
        onClose={() => setLectureDeleteConfirm(null)}
        title="Delete One Shot Lecture"
        message={lectureDeleteConfirm ? `Delete "${lectureDeleteConfirm.title}"?` : ''}
        confirmLabel="Delete"
        onConfirm={() => lectureDeleteConfirm && handleLectureDelete(lectureDeleteConfirm._id)}
        danger
      />
    </>
  );
}

function OneShotLectureForm({ lecture, subjectId, onSave, onClose }) {
  const [title, setTitle] = useState(lecture?.title ?? '');
  const [youtubeUrl, setYoutubeUrl] = useState(lecture?.youtubeUrl ?? '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (lecture?._id) {
        await api.put(`/admin/subjects/${subjectId}/one-shot-lectures/${lecture._id}`, { title, youtubeUrl });
      } else {
        await api.post(`/admin/subjects/${subjectId}/one-shot-lectures`, { title, youtubeUrl });
      }
      onSave?.();
      onClose?.();
    } catch (_) { }
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
          <input type="text" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..." />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50">Save</button>
        </div>
      </form>
    </Modal>
  );
}
