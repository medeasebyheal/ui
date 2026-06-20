import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import api from '../../../api/client';
import ResourceBreadcrumb from '../../../components/admin/ResourceBreadcrumb';
import { useParseLoadingMessage } from '../../../hooks/useParseLoadingMessage';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import BulkMcqImportResult from '../../../components/admin/BulkMcqImportResult';

const basePath = (y, m, s, t) => `/admin/resources/years/${y}/modules/${m}/subjects/${s}/topics/${t}`;

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
Explanation: The proximal convoluted tubule reabsorbs about 80–90% of filtered bicarbonate via the Na⁺–H⁺ exchanger and carbonic anhydrase.`;

export default function BulkMcqPage() {
  const { yearId, moduleId, subjectId, topicId } = useParams();
  const [searchParams] = useSearchParams();
  const [meta, setMeta] = useState({ year: null, module: null, subject: null, topic: null });
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [mcqSet, setMcqSet] = useState(searchParams.get('mcqSet') || '');
  const [type, setType] = useState('guess_until_correct');
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const importLoadingMessage = useParseLoadingMessage(importLoading);

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
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, [yearId, moduleId, subjectId, topicId]);

  const handleImport = async () => {
    if (!text.trim()) return;
    setImportLoading(true);
    setImportResult(null);
    try {
      const { data } = await api.post(`/admin/topics/${topicId}/mcqs/bulk`, {
        text: text.trim(),
        type,
        mcqSet: mcqSet.trim(),
      });
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

  if (loading || !meta.topic) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-gray-500">Loading...</div>
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
    { label: 'Bulk import MCQs', path: null },
  ];

  return (
    <>
      <ResourceBreadcrumb items={breadcrumbItems} />
      <h1 className="text-2xl font-heading font-bold text-gray-900 mb-2">Bulk import MCQs</h1>
      <p className="text-sm text-gray-500 mb-6">
        Paste MCQs in any format — numbering, labels, and markers are optional. AI will extract questions, options, correct answers, and explanations automatically.
      </p>

      <div className="max-w-3xl space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Set Name (Optional)</label>
          <input
            type="text"
            value={mcqSet}
            onChange={(e) => setMcqSet(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="e.g. Anatomy Practice Set 1"
          />
          <p className="text-xs text-gray-500 mt-1">If left blank, these MCQs will be placed in the &quot;Default&quot; set.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type for all MCQs</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
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
        <Link
          to={basePath(yearId, moduleId, subjectId, topicId)}
          className="text-primary font-medium hover:underline"
        >
          ← Back to topic MCQs
        </Link>
      </div>
    </>
  );
}
