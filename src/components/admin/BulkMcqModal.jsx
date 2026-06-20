import { useState } from 'react';
import api from '../../api/client';
import { toast } from 'react-hot-toast';
import Modal from './Modal';
import BulkMcqImportResult from './BulkMcqImportResult';
import { useParseLoadingMessage } from '../../hooks/useParseLoadingMessage';
import { Loader2 } from 'lucide-react';

export default function BulkMcqModal({ topicId, onSave, onClose }) {
  const [text, setText] = useState('');
  const [type, setType] = useState('text');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const loadingMessage = useParseLoadingMessage(loading);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post(`/admin/topics/${topicId}/mcqs/bulk`, { text: text.trim(), type });
      setResult({
        success: true,
        created: data.created,
        errors: data.errors,
        partialBlockIndices: data.partialBlockIndices || [],
        source: data.source,
        usage: data.usage,
      });
      if (data.created > 0) {
        onSave?.();
        setText('');
      }
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || 'Failed';
      if (status === 429 && err.response?.data?.resetAt) {
        const when = new Date(err.response.data.resetAt).toLocaleString();
        toast.error(`Gemini API exhausted. Try again after ${when}.`);
      }
      setResult({ success: false, message: msg });
    }
    setLoading(false);
  };

  return (
    <Modal open onClose={onClose} title="Bulk import MCQs">
      <p className="text-sm text-gray-600 mb-3">
        Paste MCQs in any format — numbering, labels, and markers are optional. AI will extract questions, options, correct answers, and explanations automatically.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type for all</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
            <option value="text">Text MCQ</option>
            <option value="guess_until_correct">Guess until correct</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pasted text</label>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={12} className="w-full px-3 py-2 border rounded-lg font-mono text-sm" placeholder="Question&#10;Option A&#10;Option B (correct)&#10;Option C&#10;Option D&#10;Explanation: Your explanation here." />
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-primary">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{loadingMessage}</span>
          </div>
        )}
        <BulkMcqImportResult result={result} />
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Close</button>
          <button type="submit" disabled={loading || !text.trim()} className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50">
            {loading ? 'Importing...' : 'Import MCQs'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
