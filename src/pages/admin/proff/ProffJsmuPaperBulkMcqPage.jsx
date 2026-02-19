import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import pdfToText from 'react-pdftotext';
import api from '../../../api/client';
import { ChevronRight, Upload, AlertCircle, FileText, Youtube, FileUp } from 'lucide-react';

const FORMAT_EXAMPLE = `1. A 45-year-old male presents with central chest pain radiating to the left arm. ECG shows ST elevation in leads V1–V4. Which artery is most likely occluded?
A) Right coronary artery
B) Left circumflex artery
C) Left anterior descending artery (correct)
D) Left main coronary artery
Explanation: ST elevation in V1–V4 localizes to the anterior wall, supplied by the left anterior descending (LAD) artery.
video: https://www.youtube.com/watch?v=...

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
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const pdfInputRef = useRef(null);

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
        setPdfError(null);
      }
    } catch (e) {
      setImportResult({ success: false, message: e.response?.data?.message || 'Import failed' });
    }
    setImportLoading(false);
  };

  const handlePdfFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setPdfError('Please select a PDF file.');
      return;
    }
    setPdfError(null);
    setPdfLoading(true);
    setImportResult(null);
    setPreview(null);
    try {
      const extractedText = await pdfToText(file);
      const trimmed = (extractedText || '').trim();
      if (!trimmed) {
        setPdfError('No text could be extracted from this PDF.');
        setPdfLoading(false);
        return;
      }
      setText(trimmed);
      const { data } = await api.post(`${basePath}/mcqs/parse`, { text: trimmed });
      setPreview(data);
    } catch (err) {
      setPdfError(err?.message || 'Failed to extract text from PDF.');
      setPreview(null);
    }
    setPdfLoading(false);
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
        Paste your medical MCQs below or upload a PDF to extract text. Use the format: question, 4 options (mark one with &quot;(correct)&quot;), then &quot;Explanation:&quot; and text, and optional &quot;video: https://...&quot;. Separate each MCQ with a blank line or number (1. 2. 3.).
      </p>

      <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">Extract from PDF</label>
        <input ref={pdfInputRef} type="file" accept=".pdf,application/pdf" onChange={handlePdfFile} disabled={pdfLoading} className="hidden" />
        <button type="button" onClick={() => pdfInputRef.current?.click()} disabled={pdfLoading} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 text-gray-700 font-medium hover:border-primary hover:bg-primary/5 hover:text-primary disabled:opacity-50 transition-colors">
          <FileUp className="w-5 h-5" /> {pdfLoading ? 'Extracting & parsing...' : 'Choose PDF file'}
        </button>
        {pdfError && <p className="mt-2 text-sm text-red-600 flex items-center gap-1"><AlertCircle className="w-4 h-4 flex-shrink-0" />{pdfError}</p>}
      </div>

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
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={14} className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary focus:border-primary" placeholder={FORMAT_EXAMPLE} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleParse} disabled={parseLoading || !text.trim()} className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-medium disabled:opacity-50">
              <FileText className="w-5 h-5" /> {parseLoading ? 'Parsing...' : 'Parse & preview'}
            </button>
            <button type="button" onClick={handleImport} disabled={importLoading || !canSave} title={preview?.errors?.length > 0 ? 'Fix parse errors before saving' : undefined} className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl font-medium disabled:opacity-50">
              <Upload className="w-5 h-5" /> {importLoading ? 'Importing...' : 'Save MCQs'}
            </button>
          </div>
          {preview?.errors?.length > 0 && (
            <p className="text-sm text-amber-700 flex items-center gap-1">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {hasParsedMcqs ? 'Fix parse errors above before saving. Save is allowed only when there are no errors.' : 'No valid MCQs parsed. Check the PDF or pasted format and try again.'}
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
              <li>Optional: <strong>video: https://youtube.com/...</strong> for a YouTube link</li>
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
                <ul className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                  {preview.mcqs.map((mcq, i) => {
                    const isPartial = (preview.partialBlockIndices || []).includes(i + 1);
                    return (
                      <li key={i} className="p-3 hover:bg-gray-50/50">
                        <p className="font-medium text-gray-900 line-clamp-2">{i + 1}. {mcq.question}</p>
                        {isPartial ? <p className="text-xs text-amber-700 mt-1 font-medium">No options parsed – will save with placeholders; edit to add choices.</p> : <p className="text-xs text-gray-500 mt-1">Correct: {mcq.options[mcq.correctIndex]}</p>}
                        {mcq.explanation && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{mcq.explanation}</p>}
                        {mcq.videoUrl && <p className="text-xs text-primary mt-1 flex items-center gap-1"><Youtube className="w-3.5 h-3.5" /> Video link</p>}
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
