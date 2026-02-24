import { useState } from 'react';
import api from '../../api/client';
import Modal from './Modal';

const MCQ_TYPES = [
  { value: 'text', label: 'Text MCQ' },
  { value: 'image', label: 'Image-based MCQ' },
  { value: 'guess_until_correct', label: 'Guess until correct' },
];

export default function McqForm({ topicId, mcq, onSave, onClose }) {
  const [question, setQuestion] = useState(mcq?.question ?? '');
  const [options, setOptions] = useState(mcq?.options?.length ? mcq.options : ['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(mcq?.correctIndex ?? 0);
  const [explanation, setExplanation] = useState(mcq?.explanation ?? '');
  const [type, setType] = useState(mcq?.type ?? 'text');
  const [imageUrl, setImageUrl] = useState(mcq?.imageUrl ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

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
    if (opts.length < 2) return alert('At least 2 options required');
    if (correctIndex < 0 || correctIndex >= opts.length) return alert('Select correct option');
    setSaving(true);
    try {
      const payload = { question, options: opts, correctIndex, explanation, type, imageUrl: type === 'image' ? imageUrl : undefined };
      if (mcq?._id) await api.put(`/admin/topics/${topicId}/mcqs/${mcq._id}`, payload);
      else await api.post(`/admin/topics/${topicId}/mcqs`, payload);
      onSave?.();
      onClose?.();
    } catch (_) {}
    setSaving(false);
  };

  return (
    <Modal open onClose={onClose} title={mcq ? 'Edit MCQ' : 'Add MCQ'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
            {MCQ_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
          <textarea value={question} onChange={(e) => setQuestion(e.target.value)} required rows={2} className="w-full px-3 py-2 border rounded-lg" />
        </div>
        {type === 'image' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question image</label>
            <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} className="w-full text-sm" />
            {imageUrl && <img src={imageUrl} alt="" className="mt-2 max-h-32 rounded object-contain" />}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Options (mark correct below)</label>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2 mt-1">
              <input type="radio" name="correct" checked={correctIndex === i} onChange={() => setCorrectIndex(i)} />
              <input value={options[i] ?? ''} onChange={(e) => setOptions((o) => { const n = [...o]; n[i] = e.target.value; return n; })} className="flex-1 px-3 py-2 border rounded-lg" placeholder={`Option ${String.fromCharCode(65 + i)}`} />
            </div>
          ))}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
          <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50">Save</button>
        </div>
      </form>
    </Modal>
  );
}
