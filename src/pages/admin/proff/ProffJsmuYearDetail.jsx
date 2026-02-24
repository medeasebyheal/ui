import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../../api/client';
import { ChevronRight, FileQuestion, ClipboardList, Plus, Pencil, Trash2 } from 'lucide-react';
import Modal from '../../../components/admin/Modal';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';

const DEFAULT_PAPERS = [
  { name: 'Paper 1 (Mix MCQs)', type: 'mcq' },
  { name: 'Paper 2 (Mix MCQs)', type: 'mcq' },
  { name: 'OSPE 1', type: 'ospe' },
  { name: 'OSPE 2', type: 'ospe' },
];

export default function ProffJsmuYearDetail() {
  const { yearId } = useParams();
  const [year, setYear] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [yearEditOpen, setYearEditOpen] = useState(false);
  const [yearEditName, setYearEditName] = useState('');

  const [paperModalOpen, setPaperModalOpen] = useState(false);
  const [paperEditing, setPaperEditing] = useState(null);
  const [paperForm, setPaperForm] = useState({ name: '', type: 'mcq' });

  const [deletePaperTarget, setDeletePaperTarget] = useState(null);

  const loadYear = () => {
    if (!yearId) return Promise.resolve();
    return api
      .get('/admin/proff/jsmu')
      .then(({ data }) => {
        const found = data.years?.find((y) => y._id === yearId);
        setYear(
          found
            ? { ...found, papers: found.papers?.length > 0 ? found.papers : [...DEFAULT_PAPERS] }
            : null
        );
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
      await api.put(`/admin/proff/jsmu/years/${year._id}`, payload);
      loadYear();
    } catch (_) {}
    setSaving(false);
  };

  const openAddPaper = () => {
    setPaperEditing(null);
    setPaperForm({ name: '', type: 'mcq' });
    setPaperModalOpen(true);
  };

  const openEditPaper = (p) => {
    setPaperEditing(p);
    setPaperForm({
      name: p.name || '',
      type: p.type || 'mcq',
    });
    setPaperModalOpen(true);
  };

  const submitPaper = async () => {
    const papers = [...(year?.papers || [])];
    if (paperEditing) {
      const idx = papers.findIndex((x) => x === paperEditing);
      if (idx >= 0) papers[idx] = { ...papers[idx], ...paperForm };
    } else {
      papers.push(paperForm);
    }
    await saveYear({ name: year.name, papers });
    setPaperModalOpen(false);
  };

  const openEditYear = () => {
    setYearEditName(year?.name || '');
    setYearEditOpen(true);
  };

  const submitYearName = async () => {
    await saveYear({ name: yearEditName, papers: year?.papers });
    setYearEditOpen(false);
  };

  const confirmDeletePaper = async () => {
    if (!deletePaperTarget || !year?.papers) return;
    const papers = year.papers.filter((p) => p !== deletePaperTarget);
    if (papers.length === 0) return;
    await saveYear({ name: year.name, papers });
    setDeletePaperTarget(null);
  };

  if (loading) return <div className="animate-pulse text-gray-500">Loading...</div>;
  if (!year) return <p className="text-gray-500">Year not found.</p>;

  const papers = year.papers?.length ? year.papers : DEFAULT_PAPERS;

  return (
    <>
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link to="/admin/proff" className="hover:text-primary">Proff</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/admin/proff/jsmu" className="hover:text-primary">JSMU</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">{year.name || 'Year'}</span>
      </nav>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-heading font-bold text-gray-900">{year.name || 'Year'}</h1>
            <button
              type="button"
              onClick={openEditYear}
              className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg"
              title="Edit year name"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">Papers: Mix MCQs and OSPE (same structure as module OSPEs).</p>
        </div>
        <button
          type="button"
          onClick={openAddPaper}
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-medium text-sm"
        >
          <Plus className="w-4 h-4" /> Add paper
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {papers.map((p, i) => (
          <div key={p._id || i} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                {p.type === 'ospe' ? <ClipboardList className="w-5 h-5 text-primary" /> : <FileQuestion className="w-5 h-5 text-primary" />}
              </div>
              <div>
                <p className="font-medium text-gray-900">{p.name}</p>
                <p className="text-xs text-gray-500">{p.type === 'ospe' ? 'OSPE (stations + questions)' : 'Mix MCQs'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => openEditPaper(p)}
                className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg"
                title="Edit paper"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setDeletePaperTarget(p)}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                title="Delete paper"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <Link
                to={`/admin/proff/jsmu/years/${yearId}/papers/${p._id}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Open <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      <Modal open={yearEditOpen} onClose={() => setYearEditOpen(false)} title="Edit year name">
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Name</span>
            <input
              type="text"
              value={yearEditName}
              onChange={(e) => setYearEditName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
              placeholder="Year name"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setYearEditOpen(false)} className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              Cancel
            </button>
            <button type="button" onClick={submitYearName} disabled={saving} className="px-3 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50">
              Save
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={paperModalOpen} onClose={() => setPaperModalOpen(false)} title={paperEditing ? 'Edit paper' : 'Add paper'}>
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Name</span>
            <input
              type="text"
              value={paperForm.name}
              onChange={(e) => setPaperForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
              placeholder="e.g. Paper 1 (Mix MCQs)"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Type</span>
            <select
              value={paperForm.type}
              onChange={(e) => setPaperForm((f) => ({ ...f, type: e.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
            >
              <option value="mcq">Mix MCQs</option>
              <option value="ospe">OSPE</option>
            </select>
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setPaperModalOpen(false)} className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              Cancel
            </button>
            <button type="button" onClick={submitPaper} disabled={saving || !paperForm.name.trim()} className="px-3 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50">
              {paperEditing ? 'Save' : 'Add'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deletePaperTarget}
        onClose={() => setDeletePaperTarget(null)}
        title="Delete paper"
        message={deletePaperTarget ? `Delete "${deletePaperTarget.name}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        onConfirm={confirmDeletePaper}
        danger
      />
    </>
  );
}
