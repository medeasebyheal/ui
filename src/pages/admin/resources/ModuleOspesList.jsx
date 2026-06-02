import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../../api/client';
import ResourceBreadcrumb from '../../../components/admin/ResourceBreadcrumb';
import Modal from '../../../components/admin/Modal';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';
import { toast } from 'react-hot-toast';
import { Plus, Pencil, Trash2, ClipboardList, Image, FileText } from 'lucide-react';

function getOspeSummary(ospe) {
  const hasStations = ospe.stations?.length > 0;
  const hasLegacy = ospe.questions?.length > 0;
  const totalQuestions = hasStations
    ? (ospe.stations || []).reduce((n, s) => n + (s.questions?.length || 0), 0)
    : (ospe.questions?.length || 0);
  const stationCount = ospe.stations?.length || 0;
  let typeLabel = ospe.type === 'viva_written' ? 'Viva (written)' : ospe.type === 'picture_mcq' ? 'Picture MCQ' : null;
  if (hasStations && !typeLabel) typeLabel = 'Stations';
  return { totalQuestions, stationCount, typeLabel, hasStations };
}

export default function ModuleOspesList() {
  const { yearId, moduleId } = useParams();
  const [year, setYear] = useState(null);
  const [module_, setModule_] = useState(null);
  const [ospes, setOspes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [allModules, setAllModules] = useState([]);
  const [targetModuleId, setTargetModuleId] = useState('');
  const [selectedOspeIds, setSelectedOspeIds] = useState([]);
  const [copying, setCopying] = useState(false);

  const loadYear = () => api.get('/admin/years').then(({ data }) => setYear(data.find((x) => x._id === yearId) || null)).catch(() => setYear(null));
  const loadModule = () => api.get(`/admin/years/${yearId}/modules`).then(({ data }) => setModule_(data.find((x) => x._id === moduleId) || null)).catch(() => setModule_(null));
  const loadOspes = () => api.get(`/admin/modules/${moduleId}/ospes`).then(({ data }) => setOspes(data)).catch(() => setOspes([]));

  useEffect(() => {
    if (!yearId || !moduleId) return;
    Promise.all([loadYear(), loadModule(), loadOspes()]).finally(() => setLoading(false));
  }, [yearId, moduleId]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/ospes/${id}`);
      loadOspes();
      setDeleteConfirm(null);
    } catch (_) {}
  };

  const loadAllModules = async () => {
    try {
      const { data } = await api.get('/admin/modules');
      setAllModules(data);
    } catch (_) {}
  };

  const handleCopy = async () => {
    if (!targetModuleId) return;
    if (selectedOspeIds.length === 0) return;
    setCopying(true);
    try {
      await api.post(`/admin/modules/${targetModuleId}/ospes/copy`, { 
        sourceModuleId: moduleId,
        ospeIds: selectedOspeIds
      });
      setCopyModalOpen(false);
      setTargetModuleId('');
      toast.success('OSPEs copied successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to copy OSPEs');
    } finally {
      setCopying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-gray-500">Loading OSPEs...</div>
      </div>
    );
  }
  if (!year || !module_) return <p className="text-gray-500">Not found.</p>;

  const breadcrumbItems = [
    { label: 'Resources', path: '/admin/resources' },
    ...(year.program ? [{ label: year.program.name, path: `/admin/resources/programs/${year.program._id}` }] : []),
    { label: year.name, path: `/admin/resources/years/${yearId}` },
    { label: module_.name, path: `/admin/resources/years/${yearId}/modules/${moduleId}` },
    { label: 'OSPEs', path: null },
  ];

  const basePath = `/admin/resources/years/${yearId}/modules/${moduleId}/ospes`;

  return (
    <>
      <ResourceBreadcrumb items={breadcrumbItems} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">OSPEs</h1>
          <p className="text-sm text-gray-500 mt-1">Picture-based MCQs and viva (written) OSPEs for {module_.name}.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              loadAllModules();
              setSelectedOspeIds(ospes.map(o => o._id));
              setCopyModalOpen(true);
            }}
            className="inline-flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-4 py-2.5 rounded-xl font-medium shadow-sm hover:bg-gray-50 transition-colors"
          >
            <ClipboardList className="w-5 h-5" /> Copy OSPEs to...
          </button>
          <Link
            to={`${basePath}/new`}
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-medium shadow-sm hover:shadow transition-colors"
          >
            <Plus className="w-5 h-5" /> Add OSPE
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-heading font-semibold text-gray-900">OSPEs ({ospes.length})</h2>
          <Link to={`${basePath}/new`} className="text-sm text-primary font-medium hover:underline">
            + Add OSPE
          </Link>
        </div>
        <ul className="divide-y divide-gray-100">
          {ospes.map((ospe, i) => {
            const { totalQuestions, stationCount, typeLabel } = getOspeSummary(ospe);
            return (
              <li
                key={ospe._id}
                className="p-4 hover:bg-gray-50/50 flex items-center justify-between gap-4 group"
              >
                <Link
                  to={`${basePath}/${ospe._id}/edit`}
                  className="flex items-start gap-3 min-w-0 flex-1"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm font-medium text-primary">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 group-hover:text-primary block truncate">
                      {ospe.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {typeLabel && (
                        <span className="inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                          {typeLabel === 'Picture MCQ' ? <Image className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                          {typeLabel}
                        </span>
                      )}
                      {stationCount > 0 && (
                        <span className="text-xs text-gray-500">
                          {stationCount} station{stationCount !== 1 ? 's' : ''}
                        </span>
                      )}
                      {totalQuestions > 0 && (
                        <span className="text-xs text-gray-500">
                          {totalQuestions} question{totalQuestions !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    to={`${basePath}/${ospe._id}/edit`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" /> Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(ospe)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        {ospes.length === 0 && (
          <div className="text-center py-16 bg-gray-50/50">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No OSPEs yet</p>
            <p className="text-sm text-gray-400 mt-1">Add picture-based or viva (written) OSPEs for this module.</p>
            <div className="flex gap-2 justify-center mt-4">
              <Link to={`${basePath}/new`} className="text-primary font-medium hover:underline">
                Add first OSPE
              </Link>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete OSPE"
        message={deleteConfirm ? `Delete "${deleteConfirm.name}"? This will remove the OSPE, its stations, and all questions.` : ''}
        confirmLabel="Delete"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm._id)}
        danger
      />

      {copyModalOpen && (
        <Modal open onClose={() => setCopyModalOpen(false)} title="Copy OSPEs to Another Module">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Select a destination module to copy the chosen OSPEs from the current module ({module_.name}).
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination Module</label>
              <select
                value={targetModuleId}
                onChange={(e) => setTargetModuleId(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary px-3 py-2 border bg-white"
              >
                <option value="">-- Select a module --</option>
                {allModules.map((m) => (
                  <option key={m._id} value={m._id} disabled={m._id === moduleId}>
                    {m.name} {m.year?.name ? `(${m.year.name})` : ''}
                  </option>
                ))}
              </select>
            </div>
            
            {ospes.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Select OSPEs to copy</label>
                  <button 
                    type="button" 
                    onClick={() => {
                      if (selectedOspeIds.length === ospes.length) setSelectedOspeIds([]);
                      else setSelectedOspeIds(ospes.map(o => o._id));
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    {selectedOspeIds.length === ospes.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {ospes.map(ospe => (
                    <label key={ospe._id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedOspeIds.includes(ospe._id)} 
                        onChange={(e) => {
                          if (e.target.checked) setSelectedOspeIds([...selectedOspeIds, ospe._id]);
                          else setSelectedOspeIds(selectedOspeIds.filter(id => id !== ospe._id));
                        }}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">{ospe.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            {ospes.length === 0 && (
              <p className="text-sm text-gray-500 mt-2 italic">No OSPEs available to copy from this module.</p>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setCopyModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!targetModuleId || copying || selectedOspeIds.length === 0}
                className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
              >
                {copying ? 'Copying...' : 'Copy OSPEs'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
