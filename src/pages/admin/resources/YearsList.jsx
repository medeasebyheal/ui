import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, ArrowRight, Calendar, FileText, LayoutGrid } from 'lucide-react';
import api from '../../../api/client';
import ResourceBreadcrumb from '../../../components/admin/ResourceBreadcrumb';
import { YearForm } from '../../../components/admin/ResourceForms';
import Modal from '../../../components/admin/Modal';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';

const PER_PAGE = 10;

const PROGRAM_BADGE_STYLES = {
  MBBS: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  BDS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  PharmD: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

function getProgramBadgeClass(programName) {
  if (!programName) return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  const key = programName.trim().toUpperCase();
  return PROGRAM_BADGE_STYLES[key] || 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400';
}

export default function YearsList() {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [page, setPage] = useState(1);

  const load = () =>
    api
      .get('/admin/years')
      .then(({ data }) => setYears(Array.isArray(data) ? data : []))
      .catch(() => setYears([]));

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/years/${id}`);
      load();
      setDeleteConfirm(null);
    } catch (_) {}
  };

  const totalPages = Math.max(1, Math.ceil(years.length / PER_PAGE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return years.slice(start, start + PER_PAGE);
  }, [years, page]);
  const start = years.length === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const end = Math.min(page * PER_PAGE, years.length);

  const programCount = useMemo(() => new Set(years.map((y) => y.program?._id).filter(Boolean)).size, [years]);
  const totalModules = useMemo(() => years.reduce((acc, y) => acc + (y.modulesCount ?? 0), 0), [years]);
  const avgModulesPerYear = years.length ? (totalModules / years.length).toFixed(1) : '0';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-slate-500 dark:text-slate-400">Loading years...</div>
      </div>
    );
  }

  return (
    <>
      <ResourceBreadcrumb items={[{ label: 'Resources', path: null }]} />
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Years</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
              Select a year to manage its modules, subjects, topics and content. Organised by academic program.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormOpen('new')}
            className="bg-primary hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add year
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Year Name</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Associated Program</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right text-slate-500 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      No years yet. Add a year to start building the academic structure.
                    </td>
                  </tr>
                ) : (
                  paginated.map((year) => (
                    <tr key={year._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors group">
                      <td className="px-6 py-5">
                        <span className="font-semibold text-slate-900 dark:text-white">{year.name}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProgramBadgeClass(
                            year.program?.name
                          )}`}
                        >
                          {year.program?.name ?? '—'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setFormOpen(year)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="Edit"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(year)}
                            className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                          <Link
                            to={`/admin/resources/years/${year._id}`}
                            className="ml-2 flex items-center gap-1 text-sm font-semibold text-primary hover:underline group-hover:translate-x-1 transition-transform"
                          >
                            Open
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing <span className="font-medium text-slate-900 dark:text-white">{start}</span> to{' '}
              <span className="font-medium text-slate-900 dark:text-white">{end}</span> of{' '}
              <span className="font-medium text-slate-900 dark:text-white">{years.length}</span> years
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 text-sm rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {(() => {
                const show = Math.min(5, totalPages);
                const startPage = totalPages <= 5 ? 1 : Math.max(1, Math.min(page - 2, totalPages - show + 1));
                return Array.from({ length: show }, (_, i) => startPage + i).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-1 text-sm rounded border font-medium transition-colors ${
                      page === pageNum
                        ? 'border-primary bg-primary text-white'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                ));
              })()}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 text-sm rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-primary">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Total Academic Years</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{years.length}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Programs Active</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{programCount}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Avg Modules / Year</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{avgModulesPerYear}</p>
            </div>
          </div>
        </div>
      </div>

      {formOpen && <YearForm year={formOpen === 'new' ? null : formOpen} onSave={load} onClose={() => setFormOpen(null)} />}
      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete year"
        message={deleteConfirm ? `Delete "${deleteConfirm.name}"? This will remove all modules, subjects, topics and related content under it.` : ''}
        confirmLabel="Delete"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm._id)}
        danger
      />
    </>
  );
}
