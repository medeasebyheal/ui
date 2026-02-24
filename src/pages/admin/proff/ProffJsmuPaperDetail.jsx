import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../../api/client';
import { ChevronRight, Plus, Pencil, Trash2, HelpCircle } from 'lucide-react';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';

const QUESTION_TYPES = [
  { value: 'text_mcq', label: 'Text-based MCQ' },
  { value: 'picture_mcq', label: 'Image-based MCQ' },
  { value: 'guess_until_correct', label: 'Guess until correct' },
  { value: 'viva_written', label: 'Viva (written answer)' },
];
const emptyQuestion = () => ({
  questionText: '',
  type: 'text_mcq',
  options: ['', '', '', ''],
  correctIndex: 0,
  expectedAnswer: '',
});
const emptyStation = () => ({ imageUrl: '', questions: [emptyQuestion()] });

export default function ProffJsmuPaperDetail() {
  const { yearId, paperId } = useParams();
  const [year, setYear] = useState(null);
  const [paper, setPaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mcqs, setMcqs] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [ospeName, setOspeName] = useState('');
  const [ospeStations, setOspeStations] = useState([emptyStation()]);
  const [ospeLoading, setOspeLoading] = useState(false);
  const [ospeSaving, setOspeSaving] = useState(false);
  const [ospeUploading, setOspeUploading] = useState(null);

  const basePath = `/admin/proff/jsmu/years/${yearId}/papers/${paperId}`;

  const loadYearAndPaper = () => {
    if (!yearId || !paperId) return Promise.resolve();
    return api.get('/admin/proff/jsmu').then(({ data }) => {
      const y = data.years?.find((yr) => yr._id === yearId);
      const p = y?.papers?.find((pa) => pa._id === paperId);
      setYear(y || null);
      setPaper(p || null);
    }).catch(() => { setYear(null); setPaper(null); });
  };

  const loadMcqs = () => api.get(`${basePath}/mcqs`).then(({ data }) => setMcqs(data)).catch(() => setMcqs([]));
  const loadOspe = () => {
    setOspeLoading(true);
    api.get(`${basePath}/ospe`)
      .then(({ data }) => {
        setOspeName(data.name ?? '');
        if (data.stations?.length) {
          setOspeStations(data.stations.map((s) => ({
            imageUrl: s.imageUrl ?? '',
            questions: (s.questions || []).map((q) => ({
              questionText: q.questionText ?? '',
              type: q.type || 'text_mcq',
              options: [...(q.options || []), '', '', ''].slice(0, 4),
              correctIndex: q.correctIndex ?? 0,
              expectedAnswer: q.expectedAnswer ?? '',
            })),
          })));
        } else {
          setOspeStations([emptyStation()]);
        }
      })
      .catch(() => { setOspeName(''); setOspeStations([emptyStation()]); })
      .finally(() => setOspeLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    loadYearAndPaper().finally(() => setLoading(false));
  }, [yearId, paperId]);

  useEffect(() => {
    if (!paper || paper.type !== 'mcq') return;
    loadMcqs();
  }, [yearId, paperId, paper?.type]);

  useEffect(() => {
    if (!paper || paper.type !== 'ospe') return;
    loadOspe();
  }, [yearId, paperId, paper?.type]);

  const handleDeleteMcq = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`${basePath}/mcqs/${deleteConfirm._id}`);
      loadMcqs();
      setDeleteConfirm(null);
    } catch (_) {}
  };

  if (loading) return <div className="animate-pulse text-gray-500 py-12">Loading...</div>;
  if (!year || !paper) return <p className="text-gray-500">Year or paper not found.</p>;

  const breadcrumb = (
    <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
      <Link to="/admin/proff" className="hover:text-primary">Proff</Link>
      <ChevronRight className="w-4 h-4" />
      <Link to="/admin/proff/jsmu" className="hover:text-primary">JSMU</Link>
      <ChevronRight className="w-4 h-4" />
      <Link to={`/admin/proff/jsmu/years/${yearId}`} className="hover:text-primary">{year.name || 'Year'}</Link>
      <ChevronRight className="w-4 h-4" />
      <span className="text-gray-900 font-medium">{paper.name || 'Paper'}</span>
    </nav>
  );

  if (paper.type === 'mcq') {
    return (
      <>
        {breadcrumb}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-gray-900">{paper.name || 'Paper'}</h1>
            <p className="text-sm text-gray-500 mt-1">Mix MCQs for this paper. Add or edit questions.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`${basePath}/mcqs/bulk`} className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50">
              Bulk import
            </Link>
            <Link
              to={`${basePath}/mcqs/new`}
              className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-medium text-sm"
            >
              <Plus className="w-5 h-5" /> Add MCQ
            </Link>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-heading font-semibold text-gray-900">MCQs ({mcqs.length})</h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {mcqs.map((mcq, i) => (
              <li key={mcq._id} className="p-4 hover:bg-gray-50/50 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 line-clamp-2">{mcq.question}</p>
                  <span className="inline-block text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 mt-1">{mcq.type}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link to={`${basePath}/mcqs/${mcq._id}/edit`} className="p-2 text-gray-500 hover:text-primary rounded-lg" title="Edit"><Pencil className="w-4 h-4" /></Link>
                  <button type="button" onClick={() => setDeleteConfirm(mcq)} className="p-2 text-gray-500 hover:text-red-600 rounded-lg" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              </li>
            ))}
          </ul>
          {mcqs.length === 0 && (
            <div className="text-center py-16 bg-gray-50/50">
              <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No MCQs yet</p>
              <p className="text-sm text-gray-400 mt-1">Add an MCQ to get started.</p>
              <Link to={`${basePath}/mcqs/new`} className="inline-block mt-4 text-primary font-medium hover:underline">Add MCQ</Link>
            </div>
          )}
        </div>
        <ConfirmDialog
          open={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Delete MCQ"
          message={deleteConfirm ? 'Delete this MCQ?' : ''}
          confirmLabel="Delete"
          onConfirm={handleDeleteMcq}
          danger
        />
      </>
    );
  }

  const addStation = () => setOspeStations((s) => [...s, emptyStation()]);
  const removeStation = (si) => setOspeStations((s) => s.filter((_, i) => i !== si));
  const setStation = (si, field, value) => setOspeStations((s) => { const n = [...s]; n[si] = { ...n[si], [field]: value }; return n; });
  const addQuestion = (si) => setOspeStations((s) => { const n = [...s]; n[si] = { ...n[si], questions: [...(n[si].questions || []), emptyQuestion()] }; return n; });
  const removeQuestion = (si, qi) => setOspeStations((s) => { const n = [...s]; n[si] = { ...n[si], questions: (n[si].questions || []).filter((_, i) => i !== qi) }; return n; });
  const setQuestion = (si, qi, field, value) => setOspeStations((s) => { const n = [...s]; const qs = [...(n[si].questions || [])]; qs[qi] = { ...qs[qi], [field]: value }; n[si] = { ...n[si], questions: qs }; return n; });
  const setOption = (si, qi, oi, value) => setOspeStations((s) => { const n = [...s]; const qs = [...(n[si].questions || [])]; const opts = [...(qs[qi].options || []), '', '', ''].slice(0, 4); opts[oi] = value; qs[qi] = { ...qs[qi], options: opts }; n[si] = { ...n[si], questions: qs }; return n; });
  const handleStationImage = async (e, si) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOspeUploading(`station-${si}`);
    try {
      const form = new FormData();
      form.append('image', file);
      const { data } = await api.post('/admin/upload-image', form);
      setStation(si, 'imageUrl', data.url);
    } catch (_) {}
    setOspeUploading(null);
  };
  const handleOspeSubmit = async (e) => {
    e.preventDefault();
    setOspeSaving(true);
    try {
      await api.put(`${basePath}/ospe`, {
        name: ospeName,
        stations: ospeStations.map((st) => ({
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
    setOspeSaving(false);
  };

  if (paper.type !== 'ospe') return null;

  if (ospeLoading) return <div className="animate-pulse text-gray-500 py-12">Loading OSPE...</div>;

  return (
    <>
      {breadcrumb}
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-gray-900">{paper.name || 'OSPE'}</h1>
        <p className="text-sm text-gray-500 mt-1">Stations: one picture per station, then multiple questions (text MCQ, image MCQ, guess until correct, or viva).</p>
      </div>
      <form onSubmit={handleOspeSubmit} className="max-w-3xl space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">OSPE name</label>
          <input value={ospeName} onChange={(e) => setOspeName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" placeholder="e.g. OSPE 1" />
        </div>
        {ospeStations.map((station, si) => (
          <div key={si} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between">
              <h2 className="font-heading font-semibold text-gray-900">Station {si + 1}</h2>
              <button type="button" onClick={() => removeStation(si)} className="text-red-600 text-sm hover:underline">Remove station</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Picture for this station</label>
                <input type="file" accept="image/*" onChange={(e) => handleStationImage(e, si)} disabled={ospeUploading === `station-${si}`} className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-medium" />
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
          <button type="submit" disabled={ospeSaving} className="px-5 py-2.5 bg-primary text-white rounded-xl font-medium shadow-sm hover:shadow disabled:opacity-50">
            {ospeSaving ? 'Saving...' : 'Save OSPE'}
          </button>
          <Link to={`/admin/proff/jsmu/years/${yearId}`} className="px-5 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50">
            Back to year
          </Link>
        </div>
      </form>
    </>
  );
}
