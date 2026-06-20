import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../../api/client';
import { useParseLoadingMessage } from '../../../hooks/useParseLoadingMessage';
import BulkMcqImportResult from '../../../components/admin/BulkMcqImportResult';
import { ChevronRight, Upload, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const FORMAT_EXAMPLE = `1. A 45-year-old male presents with central chest pain radiating to the left arm. ECG shows ST elevation in leads V1–V4. Which artery is most likely occluded?
A) Right coronary artery
B) Left circumflex artery
C) Left anterior descending artery (correct)
D) Left main coronary artery
Explanation: ST elevation in V1–V4 localizes to the anterior wall, supplied by the left anterior descending (LAD) artery.
2. Which of the following is the principal site of reabsorption of bicarbonate in the nephron?
A) Proximal convoluted tubule (correct)
B) Descending limb of loop of Henle
C) Ascending limb of loop of Henle
D) Distal convoluted tubule
Explanation: The proximal convoluted tubule reabsorbs about 80–90% of filtered bicarbonate.`;

export default function ProffOtherSubjectBulkMcqPage() {
  const { yearId, subjectId } = useParams();
  const [year, setYear] = useState(null);
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [type, setType] = useState('text');
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const importLoadingMessage = useParseLoadingMessage(importLoading);

  const basePath = `/admin/proff/other/years/${yearId}/subjects/${subjectId}`;

  useEffect(() => {
    if (!yearId || !subjectId) return;
    api.get('/admin/proff/other')
      .then(({ data }) => {
        const y = data.years?.find((x) => x._id === yearId) || null;
        const sub = y?.subjects?.find((x) => x._id === subjectId) || null;
        setYear(y);
        setSubject(sub);
      })
      .catch(() => { setYear(null); setSubject(null); })
      .finally(() => setLoading(false));
  }, [yearId, subjectId]);

  const handleImport = async () => {
    if (!text.trim()) return;
    setImportLoading(true);
    setImportResult(null);
    try {
      const { data } = await api.post(`${basePath}/mcqs/bulk`, { text: text.trim(), type });
      setImportResult({
        success: true,
        created: data.created,
        errors: data.errors,
        partialBlockIndices: data.partialBlockIndices || [],
        source: data.source,
        usage: data.usage,
      });
      if (data.created > 0) setText('');
    } catch (e) {
      const status = e.response?.status;
      const msg = e.response?.data?.message || 'Import failed';
      if (status === 429 && e.response?.data?.resetAt) {
        const when = new Date(e.response.data.resetAt).toLocaleString();
        toast.error(`Gemini API exhausted. Try again after ${when}.`);
      } else {
        toast.error(msg);
      }
      setImportResult({ success: false, message: msg });
    } finally {
      setImportLoading(false);
    }
  };

  if (loading || !year || !subject) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link to="/admin/proff" className="hover:text-primary">Proff</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/admin/proff/other" className="hover:text-primary">Other University</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to={`/admin/proff/other/years/${yearId}`} className="hover:text-primary">{year.name || 'Year'}</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to={basePath} className="hover:text-primary">{subject.name || 'Subject'}</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">Bulk import MCQs</span>
      </nav>

      <h1 className="text-2xl font-heading font-bold text-gray-900 mb-2">Bulk import MCQs</h1>
      <p className="text-sm text-gray-500 mb-6">
        Paste MCQs in any format — numbering, labels, and markers are optional. AI will extract questions, options, correct answers, and explanations automatically.
      </p>

      <div className="max-w-3xl space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type for all MCQs</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <option value="text">Text MCQ</option>
            <option value="guess_until_correct">Guess until correct</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Paste your medical MCQs</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={16}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder={FORMAT_EXAMPLE}
          />
        </div>

        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Format tips (all optional)</h3>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Separate MCQs with blank lines, numbers (1. 2. 3.), or horizontal rules</li>
            <li>Options can use A), A., or plain lines; mark correct with (correct), (c), checkmarks, or &quot;Correct Answer: B&quot;</li>
            <li>Add explanations with &quot;Explanation:&quot; or leave blank — AI will infer when missing</li>
          </ul>
        </div>

        {importLoading && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary">
            <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin" />
            <span className="font-medium">{importLoadingMessage}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleImport}
          disabled={importLoading || !text.trim()}
          className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl font-medium disabled:opacity-50"
        >
          <Upload className="w-5 h-5" />
          {importLoading ? 'Importing...' : 'Import MCQs'}
        </button>

        <BulkMcqImportResult result={importResult} />
      </div>

      <div className="mt-6">
        <Link to={`${basePath}/mcqs`} className="text-primary font-medium hover:underline">← Back to subject MCQs</Link>
      </div>
    </>
  );
}
