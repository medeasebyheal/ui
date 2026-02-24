import { useState } from 'react';
import api from '../../api/client';
import Modal from './Modal';

const OSPE_TYPES = [
  { value: 'picture_mcq', label: 'Picture-based MCQ' },
  { value: 'viva_written', label: 'Viva (written answer)' },
];

export default function OspeForm({ moduleId, ospe, onSave, onClose }) {
  const [name, setName] = useState(ospe?.name ?? '');
  const [questions, setQuestions] = useState(ospe?.questions?.length ? ospe.questions.map((q) => ({ questionText: q.questionText, imageUrl: q.imageUrl ?? '', type: q.type || 'picture_mcq', options: [...(q.options || []), '', '', ''].slice(0, 4), correctIndex: q.correctIndex ?? 0, expectedAnswer: q.expectedAnswer ?? '' })) : [{ questionText: '', imageUrl: '', type: 'picture_mcq', options: ['', '', '', ''], correctIndex: 0, expectedAnswer: '' }]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(null);

  const addQuestion = () => setQuestions((q) => [...q, { questionText: '', imageUrl: '', type: 'picture_mcq', options: ['', '', '', ''], correctIndex: 0, expectedAnswer: '' }]);
  const removeQuestion = (i) => setQuestions((q) => q.filter((_, idx) => idx !== i));
  const updateQuestion = (i, field, value) => setQuestions((q) => { const n = [...q]; n[i] = { ...n[i], [field]: value }; return n; });
  const updateOption = (qi, oi, value) => setQuestions((q) => { const n = [...q]; const opts = [...(n[qi].options || [])]; opts[oi] = value; n[qi] = { ...n[qi], options: opts }; return n; });

  const handleFileChange = async (e, qi) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(qi);
    try {
      const form = new FormData();
      form.append('image', file);
      const { data } = await api.post('/admin/upload-image', form);
      updateQuestion(qi, 'imageUrl', data.url);
    } catch (_) {}
    setUploading(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name,
      questions: questions.map((q) => ({
        questionText: q.questionText,
        imageUrl: q.imageUrl || undefined,
        type: q.type,
        options: q.type === 'picture_mcq' ? (q.options || []).filter(Boolean) : undefined,
        correctIndex: q.type === 'picture_mcq' ? q.correctIndex : undefined,
        expectedAnswer: q.type === 'viva_written' ? q.expectedAnswer : undefined,
      })),
    };
    setSaving(true);
    try {
      if (ospe?._id) await api.put(`/admin/ospes/${ospe._id}`, payload);
      else await api.post(`/admin/modules/${moduleId}/ospes`, payload);
      onSave?.();
      onClose?.();
    } catch (_) {}
    setSaving(false);
  };

  return (
    <Modal open onClose={onClose} title={ospe ? 'Edit OSPE' : 'Add OSPE'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Questions</label>
            <button type="button" onClick={addQuestion} className="text-primary text-sm font-medium">+ Add question</button>
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {questions.map((q, qi) => (
              <div key={qi} className="p-3 border rounded-lg bg-gray-50 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Q{qi + 1}</span>
                  <button type="button" onClick={() => removeQuestion(qi)} className="text-red-600 text-sm">Remove</button>
                </div>
                <input value={q.questionText} onChange={(e) => updateQuestion(qi, 'questionText', e.target.value)} placeholder="Question text" required className="w-full px-3 py-2 border rounded text-sm" />
                <select value={q.type} onChange={(e) => updateQuestion(qi, 'type', e.target.value)} className="w-full px-3 py-2 border rounded text-sm">
                  {OSPE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <div>
                  <label className="text-xs text-gray-500">Image (optional)</label>
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, qi)} disabled={uploading === qi} className="w-full text-xs" />
                  {q.imageUrl && <img src={q.imageUrl} alt="" className="mt-1 max-h-20 rounded object-contain" />}
                </div>
                {q.type === 'picture_mcq' && (
                  <div className="text-sm">
                    <label className="text-xs text-gray-500">Options (correct index)</label>
                    {[0, 1, 2, 3].map((oi) => (
                      <div key={oi} className="flex items-center gap-2 mt-1">
                        <input type="radio" name={`q${qi}-correct`} checked={q.correctIndex === oi} onChange={() => updateQuestion(qi, 'correctIndex', oi)} />
                        <input value={(q.options || [])[oi] ?? ''} onChange={(e) => updateOption(qi, oi, e.target.value)} className="flex-1 px-2 py-1 border rounded text-sm" placeholder={`Option ${oi + 1}`} />
                      </div>
                    ))}
                  </div>
                )}
                {q.type === 'viva_written' && (
                  <div>
                    <label className="text-xs text-gray-500">Expected answer</label>
                    <input value={q.expectedAnswer} onChange={(e) => updateQuestion(qi, 'expectedAnswer', e.target.value)} className="w-full px-3 py-2 border rounded text-sm" placeholder="Expected answer for marking" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50">Save</button>
        </div>
      </form>
    </Modal>
  );
}
