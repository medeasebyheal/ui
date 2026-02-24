import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../../api/client';
import { useParseLoadingMessage } from '../../../hooks/useParseLoadingMessage';
import { ChevronRight, Upload, AlertCircle, FileText, Loader2 } from 'lucide-react';

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

export default function ProffJsmuPaperBulkMcqPage() {
  const { yearId, paperId } = useParams();
  const [year, setYear] = useState(null);
  const [paper, setPaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [type, setType] = useState('text');
  const [preview, setPreview] = useState(null);
  const [parseLoading, setParseLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const parseLoadingMessage = useParseLoadingMessage(parseLoading);

  const basePath = `/admin/proff/jsmu/years/${yearId}/papers/${paperId}`;

  useEffect(() => {
    if (!yearId || !paperId) return;
    api.get('/admin/proff/jsmu')
      .then(({ data }) => {
        const y = data.years?.find((x) => x._id === yearId) || null;
        const p = y?.papers?.find((x) => x._id === paperId) || null;
        setYear(y);
        setPaper(p);
      })
      .catch(() => { setYear(null); setPaper(null); })
      .finally(() => setLoading(false));
  }, [yearId, paperId]);

  const handleParse = async () => {
    if (!text.trim()) return;
    setParseLoading(true);
    setImportResult(null);
    try {
      const { data } = await api.post(`${basePath}/mcqs/parse`, { text: text.trim() });
      setPreview(data);
    } catch (e) {
      setPreview({ mcqs: [], errors: [{ message: e.response?.data?.message || 'Parse failed' }] });
    }
    setParseLoading(false);
  };

  const handleImport = async () => {
    if (!text.trim()) return;
    setImportLoading(true);
    setImportResult(null);
    try {
      const { data } = await api.post(`${basePath}/mcqs/bulk`, { text: text.trim(), type });
      setImportResult({ success: true, created: data.created, errors: data.errors, partialBlockIndices: data.partialBlockIndices || [] });
      if (data.created > 0) {
        setText('');
        setPreview(null);
      }
    } catch (e) {
      setImportResult({ success: false, message: e.response?.data?.message || 'Import failed' });
    }
    setImportLoading(false);
  };

  const canSave = text.trim() && preview?.mcqs?.length > 0 && (!preview.errors || preview.errors.length === 0);

  if (loading || !year || !paper) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  if (paper.type !== 'mcq') {
    return (
      <div className="py-12">
        <p className="text-gray-500">This paper is not an MCQ paper.</p>
        <Link to={basePath} className="text-primary font-medium mt-2 inline-block">← Back to paper</Link>
      </div>
    );
  }

  const breadcrumb = (
    <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
      <Link to="/admin/proff" className="hover:text-primary">Proff</Link>
      <ChevronRight className="w-4 h-4" />
      <Link to="/admin/proff/jsmu" className="hover:text-primary">JSMU</Link>
      <ChevronRight className="w-4 h-4" />
      <Link to={`/admin/proff/jsmu/years/${yearId}`} className="hover:text-primary">{year.name || 'Year'}</Link>
      <ChevronRight className="w-4 h-4" />
      <Link to={basePath} className="hover:text-primary">{paper.name || 'Paper'}</Link>
      <ChevronRight className="w-4 h-4" />
      <span className="text-gray-900 font-medium">Bulk import MCQs</span>
    </nav>
  );

  const hasParsedMcqs = preview?.mcqs?.length > 0;
  const hasErrors = preview?.errors?.length > 0;

  return (
    <>
      {breadcrumb}
      <h1 className="text-2xl font-heading font-bold text-gray-900 mb-2">Bulk import MCQs</h1>
      <p className="text-sm text-gray-500 mb-6">
        Paste your medical MCQs below. Use the format: question, 4 options (mark one with &quot;(correct)&quot;), then &quot;Explanation:&quot; and text. Separate each MCQ with a blank line or number (1. 2. 3.).
      </p>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-4">
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
            onChange={(e) => {
              const v = e.target.value;
              setText(v);
              if (!v.trim()) setPreview(null);
            }}
            rows={14} className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary focus:border-primary" placeholder={FORMAT_EXAMPLE} />
          </div>
          {parseLoading && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin" />
              <span className="font-medium">{parseLoadingMessage}</span>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleParse}
              disabled={parseLoading || !text.trim() || preview !== null}
              title={preview ? 'Clear the text and paste again to parse a new batch' : undefined}
              className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-medium disabled:opacity-50"
            >
              <FileText className="w-5 h-5" /> {parseLoading ? 'Parsing...' : 'Parse & preview'}
            </button>
            <button type="button" onClick={handleImport} disabled={importLoading || !canSave} title={preview?.errors?.length > 0 ? 'Fix parse errors before saving' : undefined} className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl font-medium disabled:opacity-50">
              <Upload className="w-5 h-5" /> {importLoading ? 'Importing...' : 'Save MCQs'}
            </button>
          </div>
          {preview?.errors?.length > 0 && (
            <p className="text-sm text-amber-700 flex items-center gap-1">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {hasParsedMcqs ? 'Fix parse errors above before saving. Save is allowed only when there are no errors.' : 'No valid MCQs parsed. Check the pasted format and try again.'}
            </p>
          )}
          {importResult && (
            <div className={`p-3 rounded-lg text-sm ${importResult.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {importResult.success ? (
                <>
                  <span className="font-medium">Imported {importResult.created} MCQ(s).</span>
                  {importResult.errors?.length > 0 && <span className="block mt-1"> {importResult.errors.length} block(s) had errors.</span>}
                  {importResult.partialBlockIndices?.length > 0 && <span className="block mt-1 text-amber-700">Block(s) {importResult.partialBlockIndices.join(', ')} were parsed without options – please edit those MCQs to add choices.</span>}
                </>
              ) : <span>{importResult.message}</span>}
            </div>
          )}
        </div>
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Format guide</h3>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>One MCQ per block; separate blocks with a blank line or number (1. 2. 3.)</li>
              <li>First line = question (optional: &quot;1. &quot; or &quot;Q. &quot; prefix)</li>
              <li>Next 4 lines = options; mark the correct one with <strong>(correct)</strong> or <strong>(c)</strong></li>
              <li>Then add <strong>Explanation:</strong> and your explanation text</li>
            </ul>
          </div>
          {preview && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Preview</h3>
                {hasParsedMcqs && <span className="text-sm text-green-600">{preview.mcqs.length} MCQ(s) parsed</span>}
              </div>
              {hasErrors && (
                <div className="p-3 bg-amber-50 border-b border-amber-100 space-y-1">
                  {preview.errors.map((err, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-amber-800">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>Block {err.blockIndex}: {err.message}</span>
                    </div>
                  ))}
                </div>
              )}
              {hasParsedMcqs && (
                <ul className="divide-y divide-gray-100 max-h-[28rem] overflow-y-auto">
                  {preview.mcqs.map((mcq, i) => {
                    const isPartial = (preview.partialBlockIndices || []).includes(i + 1);
                    const options = mcq.options || [];
                    const correctIndex = mcq.correctIndex ?? 0;
                    return (
                      <li key={i} className="p-4 hover:bg-gray-50/50 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm font-medium text-primary">
                          {i + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900">{mcq.question}</p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="inline-block text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{type}</span>
                            {isPartial && (
                              <span className="inline-block text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">No options – add after save</span>
                            )}
                          </div>
                          {!isPartial && options.length > 0 && (
                            <ul className="mt-2 space-y-1 text-sm text-gray-700">
                              {options.map((opt, oi) => (
                                <li key={oi} className={oi === correctIndex ? 'font-medium text-primary' : ''}>
                                  {String.fromCharCode(65 + oi)}) {opt}
                                  {oi === correctIndex && ' ✓'}
                                </li>
                              ))}
                            </ul>
                          )}
                          {mcq.explanation && (
                            <p className="text-sm text-gray-500 mt-2 pt-2 border-t border-gray-100">{mcq.explanation}</p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              {!hasParsedMcqs && !hasErrors && <div className="p-6 text-center text-gray-500 text-sm">No MCQs parsed. Check format and try again.</div>}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <Link to={basePath} className="text-primary font-medium hover:underline">← Back to paper MCQs</Link>
      </div>
    </>
  );
}
