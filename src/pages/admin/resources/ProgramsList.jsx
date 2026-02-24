import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Activity, Pill, Plus, Search, Filter, Download, Calendar, LayoutGrid, Pencil, Trash2, ArrowRight, CheckCircle, Users, Hourglass, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../../api/client';
import ResourceBreadcrumb from '../../../components/admin/ResourceBreadcrumb';
import { ProgramForm } from '../../../components/admin/ResourceForms';
import Modal from '../../../components/admin/Modal';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';

const PER_PAGE = 10;

const PROGRAM_SUBTITLES = {
  MBBS: 'Bachelor of Medicine',
  BDS: 'Bachelor of Dental Surgery',
  PharmD: 'Doctor of Pharmacy',
};

function getProgramSubtitle(name) {
  if (!name) return '';
  const key = name.trim().toUpperCase();
  return PROGRAM_SUBTITLES[key] || name;
}

const ROW_STYLES = [
  { Icon: GraduationCap, bg: 'bg-teal-100 dark:bg-teal-900/30', iconCl: 'text-teal-600 dark:text-teal-400' },
  { Icon: Activity, bg: 'bg-blue-100 dark:bg-blue-900/30', iconCl: 'text-blue-600 dark:text-blue-400' },
  { Icon: Pill, bg: 'bg-purple-100 dark:bg-purple-900/30', iconCl: 'text-purple-600 dark:text-purple-400' },
];

function getRowStyle(index) {
  return ROW_STYLES[index % ROW_STYLES.length] || ROW_STYLES[0];
}

function formatCreated(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ProgramsList() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({ students: null, pending: 0 });

  const load = () =>
    api
      .get('/admin/programs')
      .then(({ data }) => setPrograms(Array.isArray(data) ? data : []))
      .catch(() => setPrograms([]));

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.get('/admin/dashboard').then(({ data }) => {
      if (data?.userCount != null) setStats((s) => ({ ...s, students: data.userCount }));
      if (data?.pendingPayments != null) setStats((s) => ({ ...s, pending: data.pendingPayments }));
    }).catch(() => {});
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/programs/${id}`);
      load();
      setDeleteConfirm(null);
    } catch (_) {}
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return programs;
    return programs.filter((p) => (p.name || '').toLowerCase().includes(q));
  }, [programs, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, page]);
  const start = filtered.length === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const end = Math.min(page * PER_PAGE, filtered.length);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-slate-500 dark:text-slate-400">Loading programs...</div>
      </div>
    );
  }

  return (
    <>
      <ResourceBreadcrumb items={[{ label: 'Resources', path: null }]} />
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Programs</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
              Manage all academic programs (MBBS, BDS, PharmD). Organize years, modules, and learning content across each program.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormOpen('new')}
            className="bg-primary hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>Add Program</span>
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden rounded-2xl">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-4 flex-1 min-w-[240px]">
              <div className="relative flex-1 max-w-md">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter by program name..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors" title="Filter">
                <Filter className="w-5 h-5" />
              </button>
              <button type="button" className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors" title="Download">
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-6 py-4 text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Program Name</th>
                  <th className="px-6 py-4 text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4 text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Stats</th>
                  <th className="px-6 py-4 text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      {programs.length === 0
                        ? 'No programs yet. Add a program (MBBS, BDS, PharmD) to start building the academic structure.'
                        : 'No programs match your filter.'}
                    </td>
                  </tr>
                ) : (
                  paginated.map((program, idx) => {
                    const style = getRowStyle((page - 1) * PER_PAGE + idx);
                    const yearsCount = program.yearsCount ?? 0;
                    const modulesCount = program.modulesCount ?? 0;
                    return (
                      <tr key={program._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${style.bg} ${style.iconCl}`}>
                              <style.Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">{program.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{getProgramSubtitle(program.name)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm text-slate-600 dark:text-slate-400">{formatCreated(program.createdAt)}</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4 text-xs font-medium">
                            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                              <Calendar className="w-3.5 h-3.5" />
                              {yearsCount} {yearsCount === 1 ? 'Year' : 'Years'}
                            </span>
                            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                              <LayoutGrid className="w-3.5 h-3.5" />
                              {modulesCount} Modules
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setFormOpen(program)}
                              className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                              title="Edit"
                            >
                              <Pencil className="w-5 h-5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm(program)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                            <Link
                              to={`/admin/resources/programs/${program._id}`}
                              className="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-white rounded-lg transition-all border border-primary/20"
                            >
                              OPEN
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/30 flex-wrap gap-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Showing {filtered.length === 0 ? 0 : start} to {end} of {filtered.length} Programs
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {(() => {
                const show = Math.min(5, totalPages);
                const start = totalPages <= 5 ? 1 : Math.max(1, Math.min(page - 2, totalPages - show + 1));
                return Array.from({ length: show }, (_, i) => start + i).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-md text-xs font-bold transition-colors ${
                      page === pageNum ? 'bg-primary text-white' : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
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
                className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Active Programs</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{programs.length}</p>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Enrolled Students</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.students != null ? stats.students.toLocaleString() : '—'}</p>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-orange-600 dark:text-orange-400">
              <Hourglass className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Pending Review</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.pending}</p>
            </div>
          </div>
        </div>
      </div>

      {formOpen && <ProgramForm program={formOpen === 'new' ? null : formOpen} onSave={load} onClose={() => setFormOpen(null)} />}
      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete program"
        message={deleteConfirm ? `Delete "${deleteConfirm.name}"? Years and content under it will remain but will no longer be grouped under this program.` : ''}
        confirmLabel="Delete"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm._id)}
        danger
      />
    </>
  );
}
