import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../../api/client';
import { ChevronRight, FileQuestion, ClipboardList, Pencil } from 'lucide-react';
import Modal from '../../../components/admin/Modal';

export default function ProffOtherSubjectDetail() {
  const { yearId, subjectId } = useParams();
  const [year, setYear] = useState(null);
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');

  const loadYear = () => {
    if (!yearId) return Promise.resolve();
    return api
      .get('/admin/proff/other')
      .then(({ data }) => {
        const y = data.years?.find((yr) => yr._id === yearId);
        const sub = y?.subjects?.find((s) => s._id === subjectId);
        setYear(y || null);
        setSubject(sub ? { ...sub } : null);
      })
      .catch(() => {
        setYear(null);
        setSubject(null);
      });
  };

  useEffect(() => {
    if (!yearId || !subjectId) {
      setYear(null);
      setSubject(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    loadYear().finally(() => setLoading(false));
  }, [yearId, subjectId]);

  const saveSubjectName = async () => {
    if (!year?._id || !subject?.name) return;
    const name = editName.trim();
    if (!name) return;
    setSaving(true);
    try {
      const subjects = (year.subjects || []).map((s) =>
        s._id === subjectId ? { ...s, name } : s
      );
      await api.put(`/admin/proff/other/years/${year._id}`, {
        name: year.name,
        subjects,
      });
      setSubject((s) => s && { ...s, name });
      setEditModalOpen(false);
    } catch (_) {}
    setSaving(false);
  };

  const openEdit = () => {
    setEditName(subject?.name || '');
    setEditModalOpen(true);
  };

  if (loading) return <div className="animate-pulse text-gray-500">Loading...</div>;
  if (!year || !subject) return <p className="text-gray-500">Subject not found.</p>;

  return (
    <>
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link to="/admin/proff" className="hover:text-primary">Proff</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/admin/proff/other" className="hover:text-primary">Other University</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to={`/admin/proff/other/years/${yearId}`} className="hover:text-primary">{year.name || 'Year'}</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">{subject.name || 'Subject'}</span>
      </nav>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-heading font-bold text-gray-900">{subject.name || 'Subject'}</h1>
          <button
            type="button"
            onClick={openEdit}
            className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg"
            title="Edit subject name"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-gray-500">Subject-wise Mix MCQs and OSPE (same structure as in modules).</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to={`/admin/proff/other/years/${yearId}/subjects/${subjectId}/mcqs`}
          className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-between gap-4 hover:border-primary/30 hover:bg-gray-50/50 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileQuestion className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Subject-wise Mix MCQs</p>
              <p className="text-sm text-gray-500">Add and manage MCQs for this subject.</p>
            </div>
          </div>
          <span className="text-primary font-medium text-sm group-hover:underline">Manage MCQs →</span>
        </Link>
        <Link
          to={`/admin/proff/other/years/${yearId}/subjects/${subjectId}/ospe`}
          className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-between gap-4 hover:border-primary/30 hover:bg-gray-50/50 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Subject-wise OSPE</p>
              <p className="text-sm text-gray-500">Stations + questions (same structure as modules).</p>
            </div>
          </div>
          <span className="text-primary font-medium text-sm group-hover:underline">Manage OSPE →</span>
        </Link>
      </div>

      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit subject name">
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Subject name</span>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
              placeholder="e.g. Anatomy"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditModalOpen(false)} className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              Cancel
            </button>
            <button type="button" onClick={saveSubjectName} disabled={saving || !editName.trim()} className="px-3 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50">
              Save
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
