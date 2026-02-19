import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../../api/client';
import { ChevronRight, Plus, Pencil, Trash2, HelpCircle } from 'lucide-react';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';

export default function ProffOtherSubjectMcqs() {
  const { yearId, subjectId } = useParams();
  const [year, setYear] = useState(null);
  const [subject, setSubject] = useState(null);
  const [mcqs, setMcqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const basePath = `/admin/proff/other/years/${yearId}/subjects/${subjectId}`;

  const loadMeta = () =>
    api.get('/admin/proff/other').then(({ data }) => {
      const y = data.years?.find((x) => x._id === yearId) || null;
      const sub = y?.subjects?.find((x) => x._id === subjectId) || null;
      setYear(y);
      setSubject(sub);
    }).catch(() => { setYear(null); setSubject(null); });

  const loadMcqs = () => api.get(`${basePath}/mcqs`).then(({ data }) => setMcqs(data)).catch(() => setMcqs([]));

  useEffect(() => {
    if (!yearId || !subjectId) return;
    setLoading(true);
    Promise.all([loadMeta(), loadMcqs()]).finally(() => setLoading(false));
  }, [yearId, subjectId]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`${basePath}/mcqs/${deleteConfirm._id}`);
      loadMcqs();
      setDeleteConfirm(null);
    } catch (_) {}
  };

  if (loading) return <div className="animate-pulse text-gray-500 py-12">Loading...</div>;
  if (!year || !subject) return <p className="text-gray-500">Year or subject not found.</p>;

  const breadcrumb = (
    <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
      <Link to="/admin/proff" className="hover:text-primary">Proff</Link>
      <ChevronRight className="w-4 h-4" />
      <Link to="/admin/proff/other" className="hover:text-primary">Other University</Link>
      <ChevronRight className="w-4 h-4" />
      <Link to={`/admin/proff/other/years/${yearId}`} className="hover:text-primary">{year.name || 'Year'}</Link>
      <ChevronRight className="w-4 h-4" />
      <Link to={basePath} className="hover:text-primary">{subject.name || 'Subject'}</Link>
      <ChevronRight className="w-4 h-4" />
      <span className="text-gray-900 font-medium">MCQs</span>
    </nav>
  );

  return (
    <>
      {breadcrumb}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Subject-wise MCQs</h1>
          <p className="text-sm text-gray-500 mt-1">Mix MCQs for {subject.name || 'this subject'}.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`${basePath}/mcqs/bulk`} className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50">
            Bulk import
          </Link>
          <Link to={`${basePath}/mcqs/new`} className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-medium text-sm">
            <Plus className="w-5 h-5" /> Add MCQ
          </Link>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-heading font-semibold text-gray-900">MCQs ({mcqs.length})</h2>
        </div>
        <ul className="divide-y divide-gray-100">
          {mcqs.map((mcq, i) => (
            <li key={mcq._id} className="p-4 hover:bg-gray-50/50 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 line-clamp-2">{mcq.question}</p>
                <span className="inline-block text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 mt-1">{mcq.type}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link to={`${basePath}/mcqs/${mcq._id}/edit`} className="p-2 text-gray-500 hover:text-primary rounded-lg" title="Edit"><Pencil className="w-4 h-4" /></Link>
                <button type="button" onClick={() => setDeleteConfirm(mcq)} className="p-2 text-gray-500 hover:text-red-600 rounded-lg" title="Delete"><Trash2 className="w-4 h-4" /></button>
              </div>
            </li>
          ))}
        </ul>
        {mcqs.length === 0 && (
          <div className="text-center py-16 bg-gray-50/50">
            <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No MCQs yet</p>
            <p className="text-sm text-gray-400 mt-1">Add an MCQ to get started.</p>
            <Link to={`${basePath}/mcqs/new`} className="inline-block mt-4 text-primary font-medium hover:underline">Add MCQ</Link>
          </div>
        )}
      </div>
      <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete MCQ" message={deleteConfirm ? 'Delete this MCQ?' : ''} confirmLabel="Delete" onConfirm={handleDelete} danger />
    </>
  );
}
