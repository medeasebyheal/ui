import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../../api/client';
import { ChevronRight } from 'lucide-react';

const QUESTION_TYPES = [
  { value: 'text_mcq', label: 'Text-based MCQ' },
  { value: 'picture_mcq', label: 'Image-based MCQ' },
  { value: 'guess_until_correct', label: 'Guess until correct' },
  { value: 'viva_written', label: 'Viva (written answer)' },
];
const emptyQuestion = () => ({ questionText: '', type: 'text_mcq', options: ['', '', '', ''], correctIndex: 0, expectedAnswer: '' });
const emptyStation = () => ({ imageUrl: '', questions: [emptyQuestion()] });

export default function ProffOtherSubjectOspe() {
  const { yearId, subjectId } = useParams();
  const [year, setYear] = useState(null);
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [stations, setStations] = useState([emptyStation()]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(null);

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
        try {
          const ospeRes = await api.get(`${basePath}/ospe`);
          const ospe = ospeRes.data;
          setName(ospe.name ?? '');
          if (ospe.stations?.length) {
            setStations(ospe.stations.map((s) => ({
              imageUrl: s.imageUrl ?? '',
              questions: (s.questions || []).map((q) => ({
                questionText: q.questionText ?? '',
                type: q.type || 'text_mcq',
                options: [...(q.options || []), '', '', ''].slice(0, 4),
                correctIndex: q.correctIndex ?? 0,
                expectedAnswer: q.expectedAnswer ?? '',
              })),
            })));
          }
        } catch (_) {
          setName('');
          setStations([emptyStation()]);
        }
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, [yearId, subjectId]);

  const addStation = () => setStations((s) => [...s, emptyStation()]);
  const removeStation = (si) => setStations((s) => s.filter((_, i) => i !== si));
  const setStation = (si, field, value) => setStations((s) => { const n = [...s]; n[si] = { ...n[si], [field]: value }; return n; });
  const addQuestion = (si) => setStations((s) => { const n = [...s]; n[si] = { ...n[si], questions: [...(n[si].questions || []), emptyQuestion()] }; return n; });
  const removeQuestion = (si, qi) => setStations((s) => { const n = [...s]; n[si] = { ...n[si], questions: (n[si].questions || []).filter((_, i) => i !== qi) }; return n; });
  const setQuestion = (si, qi, field, value) => setStations((s) => { const n = [...s]; const qs = [...(n[si].questions || [])]; qs[qi] = { ...qs[qi], [field]: value }; n[si] = { ...n[si], questions: qs }; return n; });
  const setOption = (si, qi, oi, value) => setStations((s) => { const n = [...s]; const qs = [...(n[si].questions || [])]; const opts = [...(qs[qi].options || []), '', '', ''].slice(0, 4); opts[oi] = value; qs[qi] = { ...qs[qi], options: opts }; n[si] = { ...n[si], questions: qs }; return n; });
  const handleStationImage = async (e, si) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(`station-${si}`);
    try {
      const form = new FormData();
      form.append('image', file);
      const { data } = await api.post('/admin/upload-image', form);
      setStation(si, 'imageUrl', data.url);
    } catch (_) {}
    setUploading(null);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`${basePath}/ospe`, {
        name,
        stations: stations.map((st) => ({
          imageUrl: st.imageUrl || undefined,
          questions: (st.questions || []).map((q) => ({
            questionText: q.questionText,
            type: q.type,
            options: ['text_mcq', 'picture_mcq', 'guess_until_correct'].includes(q.type) ? (q.options || []).filter(Boolean) : undefined,
            correctIndex: ['text_mcq', 'picture_mcq', 'guess_until_correct'].includes(q.type) ? q.correctIndex : undefined,
            expectedAnswer: q.type === 'viva_written' ? q.expectedAnswer : undefined,
          })),
        })),
      });
    } catch (_) {}
    setSaving(false);
  };

  if (loading) return <div className="animate-pulse text-gray-500 py-12">Loading...</div>;
  if (!year || !subject) return <p className="text-gray-500">Year or subject not found.</p>;

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
      <span className="text-gray-900 font-medium">OSPE</span>
    </nav>
  );

  return (
    <>
      {breadcrumb}
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-gray-900">Subject-wise OSPE</h1>
        <p className="text-sm text-gray-500 mt-1">Stations: one picture per station, then multiple questions (text MCQ, image MCQ, guess until correct, or viva).</p>
      </div>
      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">OSPE name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" placeholder="e.g. Anatomy OSPE" />
        </div>
        {stations.map((station, si) => (
          <div key={si} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between">
              <h2 className="font-heading font-semibold text-gray-900">Station {si + 1}</h2>
              <button type="button" onClick={() => removeStation(si)} className="text-red-600 text-sm hover:underline">Remove station</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Picture for this station</label>
                <input type="file" accept="image/*" onChange={(e) => handleStationImage(e, si)} disabled={uploading === `station-${si}`} className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-medium" />
                {station.imageUrl && <img src={station.imageUrl} alt="" className="mt-2 max-h-48 rounded-lg object-contain border border-gray-200" />}
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Questions for this station</label>
                  <button type="button" onClick={() => addQuestion(si)} className="text-primary text-sm font-medium hover:underline">+ Add question</button>
                </div>
                <div className="space-y-4">
                  {(station.questions || []).map((q, qi) => (
                    <div key={qi} className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Q{qi + 1}</span>
                        <button type="button" onClick={() => removeQuestion(si, qi)} className="text-red-600 text-sm hover:underline">Remove</button>
                      </div>
                      <input value={q.questionText} onChange={(e) => setQuestion(si, qi, 'questionText', e.target.value)} placeholder="Question text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary" />
                      <select value={q.type} onChange={(e) => setQuestion(si, qi, 'type', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary focus:border-primary">
                        {QUESTION_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                      </select>
                      {['text_mcq', 'picture_mcq', 'guess_until_correct'].includes(q.type) && (
                        <div className="text-sm">
                          <label className="block text-xs text-gray-500 mb-2">Options (select correct index)</label>
                          <div className="space-y-2">
                            {[0, 1, 2, 3].map((oi) => (
                              <div key={oi} className="flex items-center gap-2">
                                <input type="radio" name={`st-${si}-q-${qi}-correct`} checked={q.correctIndex === oi} onChange={() => setQuestion(si, qi, 'correctIndex', oi)} className="text-primary" />
                                <input value={(q.options || [])[oi] ?? ''} onChange={(e) => setOption(si, qi, oi, e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary" placeholder={`Option ${oi + 1}`} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {q.type === 'viva_written' && (
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Expected answer</label>
                          <input value={q.expectedAnswer} onChange={(e) => setQuestion(si, qi, 'expectedAnswer', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary" placeholder="Expected answer for marking" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
        <button type="button" onClick={addStation} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-primary hover:text-primary transition-colors">
          + Add station (another picture + questions)
        </button>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={saving} className="px-5 py-2.5 bg-primary text-white rounded-xl font-medium shadow-sm hover:shadow disabled:opacity-50">
            {saving ? 'Saving...' : 'Save OSPE'}
          </button>
          <Link to={basePath} className="px-5 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50">Back to subject</Link>
        </div>
      </form>
    </>
  );
}
