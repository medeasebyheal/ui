import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../../api/client';
import { Plus, Trash2, ChevronRight, Pencil } from 'lucide-react';
import Modal from '../../../components/admin/Modal';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';

export default function ProffOtherYearDetail() {
  const { yearId } = useParams();
  const [year, setYear] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [subjectEditing, setSubjectEditing] = useState(null);
  const [subjectFormName, setSubjectFormName] = useState('');
  const [deleteSubjectTarget, setDeleteSubjectTarget] = useState(null);

  const loadYear = () => {
    if (!yearId) return Promise.resolve();
    return api
      .get('/admin/proff/other')
      .then(({ data }) => {
        const found = data.years?.find((y) => y._id === yearId);
        setYear(found ? { ...found } : null);
      })
      .catch(() => setYear(null));
  };

  useEffect(() => {
    if (!yearId) {
      setYear(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    loadYear().finally(() => setLoading(false));
  }, [yearId]);

  const saveYear = async (payload) => {
    if (!year?._id) return;
    setSaving(true);
    try {
      await api.put(`/admin/proff/other/years/${year._id}`, payload);
      await loadYear();
    } catch (_) {}
    setSaving(false);
  };

  const openAddSubject = () => {
    setSubjectEditing(null);
    setSubjectFormName('');
    setSubjectModalOpen(true);
  };

  const openEditSubject = (sub) => {
    setSubjectEditing(sub);
    setSubjectFormName(sub.name || '');
    setSubjectModalOpen(true);
  };

  const submitSubject = async () => {
    const name = subjectFormName.trim();
    if (!name) return;
    const subjects = [...(year?.subjects || [])];
    if (subjectEditing) {
      const idx = subjects.findIndex((s) => s._id === subjectEditing._id);
      if (idx >= 0) subjects[idx] = { ...subjects[idx], name };
    } else {
      subjects.push({ name });
    }
    await saveYear({ name: year.name, subjects });
    setSubjectModalOpen(false);
  };

  const confirmDeleteSubject = async () => {
    if (!deleteSubjectTarget || !year?.subjects) return;
    const subjects = year.subjects.filter((s) => s._id !== deleteSubjectTarget._id);
    await saveYear({ name: year.name, subjects });
    setDeleteSubjectTarget(null);
  };

  if (loading) return <div className="animate-pulse text-gray-500">Loading...</div>;
  if (!year) return <p className="text-gray-500">Year not found.</p>;

  const subjects = year.subjects || [];

  return (
    <>
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link to="/admin/proff" className="hover:text-primary">Proff</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/admin/proff/other" className="hover:text-primary">Other University</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">{year.name || 'Year'}</span>
      </nav>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">{year.name || 'Year'}</h1>
          <p className="text-sm text-gray-500 mt-1">Subjects: each has subject-wise Mix MCQs and OSPE (same structure as modules).</p>
        </div>
        <button
          type="button"
          onClick={openAddSubject}
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-medium text-sm"
        >
          <Plus className="w-4 h-4" /> Add subject
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <ul className="divide-y divide-gray-100">
          {subjects.length === 0 ? (
            <li className="p-8 text-center text-gray-500">
              <p>No subjects yet. Add a subject for Mix MCQs and OSPE.</p>
              <button type="button" onClick={openAddSubject} className="mt-3 text-primary font-medium hover:underline">
                Add first subject
              </button>
            </li>
          ) : (
            subjects.map((sub) => (
              <li key={sub._id} className="flex items-center justify-between p-4 hover:bg-gray-50/50">
                <span className="font-medium text-gray-900">{sub.name || 'Subject'}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditSubject(sub)}
                    className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg"
                    title="Edit subject"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteSubjectTarget(sub)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    title="Remove subject"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Link
                    to={`/admin/proff/other/years/${yearId}/subjects/${sub._id}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    Open <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      <Modal open={subjectModalOpen} onClose={() => setSubjectModalOpen(false)} title={subjectEditing ? 'Edit subject' : 'Add subject'}>
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Subject name</span>
            <input
              type="text"
              value={subjectFormName}
              onChange={(e) => setSubjectFormName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
              placeholder="e.g. Anatomy"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setSubjectModalOpen(false)} className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              Cancel
            </button>
            <button type="button" onClick={submitSubject} disabled={saving || !subjectFormName.trim()} className="px-3 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50">
              {subjectEditing ? 'Save' : 'Add'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteSubjectTarget}
        onClose={() => setDeleteSubjectTarget(null)}
        title="Delete subject"
        message={deleteSubjectTarget ? `Delete "${deleteSubjectTarget.name || 'Subject'}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        onConfirm={confirmDeleteSubject}
        danger
      />
    </>
  );
}
