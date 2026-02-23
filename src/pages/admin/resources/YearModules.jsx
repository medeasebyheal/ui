import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../../api/client';
import ResourceBreadcrumb from '../../../components/admin/ResourceBreadcrumb';
import { ModuleForm } from '../../../components/admin/ResourceForms';
import Modal from '../../../components/admin/Modal';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react';

export default function YearModules() {
  const { yearId } = useParams();
  const [year, setYear] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadYear = () => api.get('/admin/years').then(({ data }) => {
    const y = data.find((x) => x._id === yearId);
    setYear(y || null);
  }).catch(() => setYear(null));
  const loadModules = () => api.get(`/admin/years/${yearId}/modules`).then(({ data }) => setModules(data)).catch(() => setModules([]));

  useEffect(() => {
    if (!yearId) return;
    Promise.all([loadYear(), loadModules()]).finally(() => setLoading(false));
  }, [yearId]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/modules/${id}`);
      loadModules();
      setDeleteConfirm(null);
    } catch (_) {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }
  if (!year) return <p className="text-gray-500">Year not found.</p>;

  const breadcrumbItems = [
    { label: 'Resources', path: '/admin/resources' },
    ...(year.program ? [{ label: year.program.name, path: `/admin/resources/programs/${year.program._id}` }] : []),
    { label: year.name, path: null },
  ];

  return (
    <>
      <ResourceBreadcrumb items={breadcrumbItems} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Modules</h1>
          <p className="text-sm text-gray-500 mt-1">{year.name} — add modules and open one to manage subjects, topics and OSPEs.</p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen({})}
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-medium shadow-sm hover:shadow transition-shadow"
        >
          <Plus className="w-5 h-5" /> Add module
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod) => (
          <div key={mod._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
            <Link to={`/admin/resources/years/${yearId}/modules/${mod._id}`} className="block">
              <div className="h-24 bg-teal-50 flex items-center justify-center overflow-hidden">
                {mod.imageUrl ? (
                  <img src={mod.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <BookOpen className="w-8 h-8 text-primary/50" />
                )}
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="font-heading font-semibold text-gray-900 group-hover:text-primary transition-colors">{mod.name}</h2>
                    <p className="text-xs text-gray-500">Order: {mod.order}</p>
                  </div>
                </div>
              </div>
            </Link>
            <div className="flex items-center gap-2 px-5 pb-4 border-t border-gray-100 pt-3">
              <button type="button" onClick={(e) => { e.preventDefault(); setFormOpen(mod); }} className="p-2 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-lg" title="Edit"><Pencil className="w-4 h-4" /></button>
              <button type="button" onClick={(e) => { e.preventDefault(); setDeleteConfirm(mod); }} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 className="w-4 h-4" /></button>
              <Link to={`/admin/resources/years/${yearId}/modules/${mod._id}`} className="ml-auto text-sm font-medium text-primary hover:underline">Open →</Link>
            </div>
          </div>
        ))}
      </div>

      {modules.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No modules in this year</p>
          <button type="button" onClick={() => setFormOpen({})} className="mt-4 text-primary font-medium hover:underline">Add first module</button>
        </div>
      )}

      {formOpen && <ModuleForm yearId={yearId} module={formOpen._id ? formOpen : null} onSave={loadModules} onClose={() => setFormOpen(null)} />}
      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete module"
        message={deleteConfirm ? `Delete "${deleteConfirm.name}"? Subjects, topics and OSPEs under it will be affected.` : ''}
        confirmLabel="Delete"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm._id)}
        danger
      />
    </>
  );
}
