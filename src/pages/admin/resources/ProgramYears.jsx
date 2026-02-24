import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../../api/client';
import ResourceBreadcrumb from '../../../components/admin/ResourceBreadcrumb';
import { YearForm } from '../../../components/admin/ResourceForms';
import Modal from '../../../components/admin/Modal';
import { Plus, Pencil, Trash2, FolderTree } from 'lucide-react';

export default function ProgramYears() {
  const { programId } = useParams();
  const [program, setProgram] = useState(null);
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadProgram = () =>
    api.get('/admin/programs').then(({ data }) => {
      const p = data.find((x) => x._id === programId);
      setProgram(p || null);
    }).catch(() => setProgram(null));
  const loadYears = () =>
    api.get('/admin/years', { params: { programId } }).then(({ data }) => setYears(data)).catch(() => setYears([]));

  const load = () => Promise.all([loadProgram(), loadYears()]);

  useEffect(() => {
    if (!programId) return;
    load().finally(() => setLoading(false));
  }, [programId]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/years/${id}`);
      loadYears();
      setDeleteConfirm(null);
    } catch (_) {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-gray-500">Loading years...</div>
      </div>
    );
  }
  if (!program) return <p className="text-gray-500">Program not found.</p>;

  const breadcrumbItems = [
    { label: 'Resources', path: '/admin/resources' },
    { label: program.name, path: null },
  ];

  return (
    <>
      <ResourceBreadcrumb items={breadcrumbItems} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Years</h1>
          <p className="text-sm text-gray-500 mt-1">{program.name} — select a year to manage its modules, subjects, topics and content.</p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen('new')}
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-medium shadow-sm hover:shadow transition-shadow"
        >
          <Plus className="w-5 h-5" /> Add year
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {years.map((year) => (
          <div
            key={year._id}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
          >
            <Link to={`/admin/resources/years/${year._id}`} className="block p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FolderTree className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-heading font-semibold text-gray-900 group-hover:text-primary transition-colors">{year.name}</h2>
                </div>
              </div>
            </Link>
            <div className="flex items-center gap-2 px-5 pb-4 border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setFormOpen(year); }}
                className="p-2 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setDeleteConfirm(year); }}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <Link
                to={`/admin/resources/years/${year._id}`}
                className="ml-auto text-sm font-medium text-primary hover:underline"
              >
                Open →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {years.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <FolderTree className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No years in this program</p>
          <p className="text-sm text-gray-400 mt-1">Add a year to start building the academic structure.</p>
          <button type="button" onClick={() => setFormOpen('new')} className="mt-4 text-primary font-medium hover:underline">
            Add first year
          </button>
        </div>
      )}

      {formOpen && (
        <YearForm
          year={formOpen === 'new' ? null : formOpen}
          programId={programId}
          onSave={loadYears}
          onClose={() => setFormOpen(null)}
        />
      )}
      {deleteConfirm && (
        <Modal open onClose={() => setDeleteConfirm(null)} title="Delete year">
          <p className="text-gray-600 mb-4">Delete &quot;{deleteConfirm.name}&quot;? This will remove all modules, subjects, topics and related content under it.</p>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border rounded-lg">Cancel</button>
            <button type="button" onClick={() => handleDelete(deleteConfirm._id)} className="px-4 py-2 bg-red-600 text-white rounded-lg">Delete</button>
          </div>
        </Modal>
      )}
    </>
  );
}
