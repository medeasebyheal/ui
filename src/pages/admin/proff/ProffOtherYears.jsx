import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api/client';
import { Plus, Trash2, ChevronRight, FolderTree, Pencil } from 'lucide-react';
import Modal from '../../../components/admin/Modal';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';

function normalizeYears(doc) {
  return doc?.years ?? [];
}

export default function ProffOtherYears() {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [yearModalOpen, setYearModalOpen] = useState(false);
  const [yearEditing, setYearEditing] = useState(null);
  const [yearFormName, setYearFormName] = useState('');
  const [deleteYearTarget, setDeleteYearTarget] = useState(null);

  const load = () =>
    api
      .get('/admin/proff/other')
      .then(({ data }) => setYears(normalizeYears(data)))
      .catch(() => setYears([]));

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const openAddYear = () => {
    setYearEditing(null);
    setYearFormName(`Year ${years.length + 1}`);
    setYearModalOpen(true);
  };

  const openEditYear = (yr) => {
    setYearEditing(yr);
    setYearFormName(yr.name || '');
    setYearModalOpen(true);
  };

  const submitYear = async () => {
    const name = yearFormName.trim();
    if (!name) return;
    setAdding(true);
    try {
      if (yearEditing) {
        await api.put(`/admin/proff/other/years/${yearEditing._id}`, {
          name,
          subjects: yearEditing.subjects || [],
        });
      } else {
        await api.post('/admin/proff/other/years', {
          name,
        });
      }
      await load();
      setYearModalOpen(false);
    } catch (_) {}
    setAdding(false);
  };

  const confirmDeleteYear = async () => {
    if (!deleteYearTarget) return;
    setDeletingId(deleteYearTarget._id);
    try {
      await api.delete(`/admin/proff/other/years/${deleteYearTarget._id}`);
      await load();
      setDeleteYearTarget(null);
    } catch (_) {}
    setDeletingId(null);
  };

  if (loading) return <div className="animate-pulse text-gray-500">Loading...</div>;

  return (
    <>
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link to="/admin/proff" className="hover:text-primary">Proff</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">Other University</span>
      </nav>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Other University</h1>
          <p className="text-sm text-gray-500 mt-1">Years → subject-wise Mix MCQs and OSPE per subject.</p>
        </div>
        <button
          type="button"
          onClick={openAddYear}
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-medium text-sm"
        >
          <Plus className="w-4 h-4" /> Add year
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <ul className="divide-y divide-gray-100">
          {years.length === 0 ? (
            <li className="p-8 text-center text-gray-500">
              <FolderTree className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No years yet. Add a year, then add subjects (Mix MCQs + OSPE per subject).</p>
              <button type="button" onClick={openAddYear} className="mt-3 text-primary font-medium hover:underline">
                Add first year
              </button>
            </li>
          ) : (
            years.map((yr) => (
              <li key={yr._id} className="flex items-center justify-between p-4 hover:bg-gray-50/50">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="font-medium text-gray-900">{yr.name || 'Year'}</span>
                  <span className="text-sm text-gray-500">{(yr.subjects || []).length} subject(s)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditYear(yr)}
                    className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg"
                    title="Edit year"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteYearTarget(yr)}
                    disabled={deletingId === yr._id}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                    title="Remove year"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Link
                    to={`/admin/proff/other/years/${yr._id}`}
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

      <Modal open={yearModalOpen} onClose={() => setYearModalOpen(false)} title={yearEditing ? 'Edit year' : 'Add year'}>
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Year name</span>
            <input
              type="text"
              value={yearFormName}
              onChange={(e) => setYearFormName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
              placeholder="e.g. Year 1"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setYearModalOpen(false)} className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              Cancel
            </button>
            <button type="button" onClick={submitYear} disabled={adding || !yearFormName.trim()} className="px-3 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50">
              {yearEditing ? 'Save' : 'Add'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteYearTarget}
        onClose={() => setDeleteYearTarget(null)}
        title="Delete year"
        message={deleteYearTarget ? `Delete "${deleteYearTarget.name || 'Year'}" and all its subjects? This cannot be undone.` : ''}
        confirmLabel="Delete"
        onConfirm={confirmDeleteYear}
        danger
      />
    </>
  );
}
