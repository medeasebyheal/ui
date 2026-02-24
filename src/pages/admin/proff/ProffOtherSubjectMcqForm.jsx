import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../../api/client';
import { ChevronRight } from 'lucide-react';

const MCQ_TYPES = [
  { value: 'text', label: 'Text MCQ' },
  { value: 'image', label: 'Image-based MCQ' },
  { value: 'guess_until_correct', label: 'Guess until correct' },
];

export default function ProffOtherSubjectMcqForm() {
  const { yearId, subjectId, mcqId } = useParams();
  const navigate = useNavigate();
  const isEdit = mcqId && mcqId !== 'new';
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(null);
  const [subject, setSubject] = useState(null);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [type, setType] = useState('text');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const basePath = `/admin/proff/other/years/${yearId}/subjects/${subjectId}`;

  useEffect(() => {
    if (!yearId || !subjectId) return;
    const load = async () => {
      try {
        const { data } = await api.get('/admin/proff/other');
        const y = data.years?.find((x) => x._id === yearId) || null;
        const sub = y?.subjects?.find((x) => x._id === subjectId) || null;
        setYear(y);
        setSubject(sub);
        if (isEdit && mcqId) {
          const mcqRes = await api.get(`${basePath}/mcqs/${mcqId}`);
          const d = mcqRes.data;
          setQuestion(d.question || '');
          setOptions(d.options?.length ? [...d.options] : ['', '', '', '']);
          setCorrectIndex(d.correctIndex ?? 0);
          setExplanation(d.explanation || '');
          setType(d.type || 'text');
          setImageUrl(d.imageUrl || '');
        }
      } catch (e) {
        if (e.response?.status === 404) setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [yearId, subjectId, mcqId, isEdit]);

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
    if (opts.length < 2) { alert('At least 2 options required'); return; }
    if (correctIndex < 0 || correctIndex >= opts.length) { alert('Select the correct option'); return; }
    setSaving(true);
    try {
      const payload = { question, options: opts, correctIndex, explanation, type, imageUrl: type === 'image' ? imageUrl : undefined };
      if (isEdit) await api.put(`${basePath}/mcqs/${mcqId}`, payload);
      else await api.post(`${basePath}/mcqs`, payload);
      navigate(`${basePath}/mcqs`);
    } catch (_) {}
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-pulse text-gray-500">Loading...</div></div>;
  if (notFound || !year || !subject) return <div className="py-12"><p className="text-gray-500">Subject or MCQ not found.</p><Link to="/admin/proff/other" className="text-primary font-medium mt-2 inline-block">Back to Other University</Link></div>;

  const breadcrumb = (
    <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
      <Link to="/admin/proff" className="hover:text-primary">Proff</Link>
      <ChevronRight className="w-4 h-4" />
      <Link to="/admin/proff/other" className="hover:text-primary">Other University</Link>
      <ChevronRight className="w-4 h-4" />
      <Link to={`/admin/proff/other/years/${yearId}`} className="hover:text-primary">{year.name || 'Year'}</Link>
      <ChevronRight className="w-4 h-4" />
      <Link to={basePath} className="hover:text-primary">{subject.name || 'Subject'}</Link>
      <ChevronRight className="w-4 h-4" />
      <Link to={`${basePath}/mcqs`} className="hover:text-primary">MCQs</Link>
      <ChevronRight className="w-4 h-4" />
      <span className="text-gray-900 font-medium">{isEdit ? 'Edit MCQ' : 'Add MCQ'}</span>
    </nav>
  );

  return (
    <>
      {breadcrumb}
      <div className="max-w-2xl">
        <h1 className="text-2xl font-heading font-bold text-gray-900 mb-6">{isEdit ? 'Edit MCQ' : 'Add MCQ'}</h1>
        <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary">
              {MCQ_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
            <textarea value={question} onChange={(e) => setQuestion(e.target.value)} required rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" placeholder="Enter the question..." />
          </div>
          {type === 'image' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question image</label>
              <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary" />
              {imageUrl && <img src={imageUrl} alt="" className="mt-2 max-h-40 rounded-lg object-contain border border-gray-200" />}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Options (select the correct one)</label>
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <input type="radio" name="correct" checked={correctIndex === i} onChange={() => setCorrectIndex(i)} className="text-primary focus:ring-primary" />
                  <input value={options[i] ?? ''} onChange={(e) => setOptions((o) => { const n = [...o]; n[i] = e.target.value; return n; })} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" placeholder={`Option ${String.fromCharCode(65 + i)}`} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
            <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" placeholder="Why this answer is correct..." />
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:shadow disabled:opacity-50">
              {saving ? 'Saving...' : isEdit ? 'Update MCQ' : 'Add MCQ'}
            </button>
            <Link to={`${basePath}/mcqs`} className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50">Cancel</Link>
          </div>
        </form>
      </div>
    </>
  );
}
