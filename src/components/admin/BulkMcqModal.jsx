import { useState } from 'react';
import api from '../../api/client';
import { toast } from 'react-hot-toast';
import Modal from './Modal';

export default function BulkMcqModal({ topicId, onSave, onClose }) {
  const [text, setText] = useState('');
  const [type, setType] = useState('text');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post(`/admin/topics/${topicId}/mcqs/bulk`, { text, type });
      setResult(data);
      if (data.created > 0) onSave?.();
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || 'Failed';
      if (status === 429 && err.response?.data?.resetAt) {
        const when = new Date(err.response.data.resetAt).toLocaleString();
        toast.error(`Gemini API exhausted. Try again after ${when}.`);
      }
      setResult({ error: msg });
    }
    setLoading(false);
  };

  return (
    <Modal open onClose={onClose} title="Bulk import MCQs">
      <p className="text-sm text-gray-600 mb-3">Paste one block per MCQ. Format: first line = question, next 4 lines = options (one with &quot;(correct)&quot;), then line &quot;explanation&quot;, then explanation text. Separate blocks with a blank line.</p>
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
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={12} className="w-full px-3 py-2 border rounded-lg font-mono text-sm" placeholder="Question&#10;Option A&#10;Option B&#10;Option C&#10;Option D (correct)&#10;explanation&#10;Your explanation here." />
        </div>
        {result && (
          <div className={`text-sm p-2 rounded ${result.error ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {result.error ?? `Created ${result.created} MCQs.${result.errors?.length ? ` ${result.errors.length} errors.` : ''}`}
          </div>
        )}
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Close</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50">Import</button>
        </div>
      </form>
    </Modal>
  );
}
