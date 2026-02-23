import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../../api/client';
import ResourceBreadcrumb from '../../../components/admin/ResourceBreadcrumb';

const MCQ_TYPES = [
  { value: 'text', label: 'Text MCQ' },
  { value: 'image', label: 'Image-based MCQ' },
  { value: 'guess_until_correct', label: 'Guess until correct' },
];

const basePath = (y, m, s, t) => `/admin/resources/years/${y}/modules/${m}/subjects/${s}/topics/${t}`;

export default function McqFormPage() {
  const { yearId, moduleId, subjectId, topicId, mcqId } = useParams();
  const navigate = useNavigate();
  const isEdit = mcqId && mcqId !== 'new';
  const [loading, setLoading] = useState(isEdit);
  const [meta, setMeta] = useState({ year: null, module: null, subject: null, topic: null });
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [type, setType] = useState('text');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!yearId || !moduleId || !subjectId || !topicId) return;
    const load = async () => {
      try {
        const [yearsRes, modulesRes, subjectsRes, topicsRes] = await Promise.all([
          api.get('/admin/years'),
          api.get(`/admin/years/${yearId}/modules`),
          api.get(`/admin/modules/${moduleId}/subjects`),
          api.get(`/admin/subjects/${subjectId}/topics`),
        ]);
        const year = yearsRes.data.find((x) => x._id === yearId) || null;
        const module_ = modulesRes.data.find((x) => x._id === moduleId) || null;
        const subject = subjectsRes.data.find((x) => x._id === subjectId) || null;
        const topic = topicsRes.data.find((x) => x._id === topicId) || null;
        setMeta({ year, module: module_, subject, topic });
        if (isEdit) {
          const { data } = await api.get(`/admin/topics/${topicId}/mcqs/${mcqId}`);
          setQuestion(data.question || '');
          setOptions(data.options?.length ? [...data.options] : ['', '', '', '']);
          setCorrectIndex(data.correctIndex ?? 0);
          setExplanation(data.explanation || '');
          setVideoUrl(data.videoUrl || '');
          setType(data.type || 'text');
          setImageUrl(data.imageUrl || '');
        }
      } catch (e) {
        if (e.response?.status === 404) setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [yearId, moduleId, subjectId, topicId, mcqId, isEdit]);

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const opts = options.filter(Boolean);
    if (opts.length < 2) {
      alert('At least 2 options required');
      return;
    }
    if (correctIndex < 0 || correctIndex >= opts.length) {
      alert('Select the correct option');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        question,
        options: opts,
        correctIndex,
        explanation,
        videoUrl: videoUrl.trim() || undefined,
        type,
        imageUrl: type === 'image' ? imageUrl : undefined,
      };
      if (isEdit) {
        await api.put(`/admin/topics/${topicId}/mcqs/${mcqId}`, payload);
      } else {
        await api.post(`/admin/topics/${topicId}/mcqs`, payload);
      }
      navigate(basePath(yearId, moduleId, subjectId, topicId));
    } catch (_) {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }
  if (notFound || !meta.topic) {
    return (
      <div className="py-12">
        <p className="text-gray-500">Topic or MCQ not found.</p>
        <Link to="/admin/resources" className="text-primary font-medium mt-2 inline-block">Back to Resources</Link>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Resources', path: '/admin/resources' },
    ...(meta.year?.program ? [{ label: meta.year.program.name, path: `/admin/resources/programs/${meta.year.program._id}` }] : []),
    { label: meta.year?.name, path: `/admin/resources/years/${yearId}` },
    { label: meta.module?.name, path: `/admin/resources/years/${yearId}/modules/${moduleId}` },
    { label: meta.subject?.name, path: `/admin/resources/years/${yearId}/modules/${moduleId}/subjects/${subjectId}` },
    { label: meta.topic?.name, path: basePath(yearId, moduleId, subjectId, topicId) },
    { label: isEdit ? 'Edit MCQ' : 'Add MCQ', path: null },
  ];

  const opts = options.filter(Boolean);
  const previewCorrectIndex = correctIndex >= 0 && correctIndex <= 3 ? correctIndex : 0;

  return (
    <>
      <ResourceBreadcrumb items={breadcrumbItems} />
      <h1 className="text-2xl font-heading font-bold text-gray-900 mb-6">
        {isEdit ? 'Edit MCQ' : 'Add MCQ'}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 xl:col-span-5">
        <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              {MCQ_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="Enter the question..."
            />
          </div>

          {type === 'image' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary"
              />
              {imageUrl && (
                <img src={imageUrl} alt="" className="mt-2 max-h-40 rounded-lg object-contain border border-gray-200" />
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Options (select the correct one)</label>
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="correct"
                    checked={correctIndex === i}
                    onChange={() => setCorrectIndex(i)}
                    className="text-primary focus:ring-primary"
                  />
                  <input
                    value={options[i] ?? ''}
                    onChange={(e) =>
                      setOptions((o) => {
                        const n = [...o];
                        n[i] = e.target.value;
                        return n;
                      })
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="Why this answer is correct..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">YouTube video link (optional)</label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p className="text-xs text-gray-500 mt-1">Add a video link to explain this question.</p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:shadow disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEdit ? 'Update MCQ' : 'Add MCQ'}
            </button>
            <Link
              to={basePath(yearId, moduleId, subjectId, topicId)}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </form>
        </div>

        <aside className="lg:col-span-6 xl:col-span-7">
          <div className="sticky top-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h2 className="font-heading font-semibold text-gray-900">MCQ Preview</h2>
              <p className="text-xs text-gray-500 mt-0.5">How students will see this question</p>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                  Question 1
                </span>
              </div>
              <h3 className="text-lg font-display font-bold text-gray-800 mb-4 leading-snug">
                {question.trim() || 'Question text will appear here...'}
              </h3>
              {type === 'image' && imageUrl && (
                <div className="mb-6 flex justify-center">
                  <img src={imageUrl} alt="" className="rounded-xl border border-gray-200 max-h-48 object-contain w-full" />
                </div>
              )}
              <div className="space-y-3">
                {[0, 1, 2, 3].map((i) => {
                  const isCorrect = i === previewCorrectIndex;
                  const label = String.fromCharCode(65 + i);
                  const text = options[i] ?? '';
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 ${
                        isCorrect ? 'border-emerald-300 bg-emerald-50/80' : 'border-gray-100 bg-gray-50/50'
                      }`}
                    >
                      <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 font-bold text-sm text-gray-700">
                        {label}
                      </span>
                      <span className="text-gray-800">{text || `Option ${label}`}</span>
                      {isCorrect && (
                        <span className="ml-auto text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded">
                          Correct
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              {explanation.trim() && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Explanation</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{explanation}</p>
                </div>
              )}
              {videoUrl.trim() && (
                <div className="mt-4 text-sm text-gray-500">
                  <span className="font-medium">Video:</span>{' '}
                  <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block">
                    {videoUrl}
                  </a>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
