import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Download, Users, Wallet, AlertTriangle, BookOpen, HelpCircle, BadgeCheck, Clock, Pencil, Receipt, PlusCircle, FileEdit, GraduationCap, Wrench } from 'lucide-react';
import api from '../../api/client';

export default function AdminDashboard() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [removeFifthLoading, setRemoveFifthLoading] = useState(false);
  const [removeFifthResult, setRemoveFifthResult] = useState(null);
  const [activateTrialLoading, setActivateTrialLoading] = useState(false);
  const [activateTrialResult, setActivateTrialResult] = useState(null);

  useEffect(() => {
    api
      .get('/admin/dashboard')
      .then(({ data: res }) => setData(res))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const handleRemoveFifthOption = () => {
    if (removeFifthLoading) return;
    setRemoveFifthResult(null);
    setRemoveFifthLoading(true);
    api
      .post('/admin/mcqs/remove-fifth-option')
      .then(({ data: res }) => {
        setRemoveFifthResult(res);
        if (res?.updated > 0) setData((prev) => (prev ? { ...prev, mcqCount: (prev.mcqCount ?? 0) } : null));
      })
      .catch((err) => setRemoveFifthResult({ error: err.response?.data?.message || err.message || 'Request failed' }))
      .finally(() => setRemoveFifthLoading(false));
  };

  const handleActivateFreeTrialForAll = () => {
    if (activateTrialLoading) return;
    setActivateTrialResult(null);
    setActivateTrialLoading(true);
    api
      .post('/admin/free-trial/activate-all')
      .then(({ data: res }) => {
        setActivateTrialResult(res);
      })
      .catch((err) =>
        setActivateTrialResult({
          error: err.response?.data?.message || err.message || 'Request failed',
        })
      )
      .finally(() => setActivateTrialLoading(false));
  };

  const stats = data || {};
  const recentUsers = data?.recentUsers || [];
  const recentPayments = data?.recentPayments || [];
  const programCount = stats.programCount ?? 0;
  const yearCount = stats.yearCount ?? 0;
  const moduleCount = stats.moduleCount ?? 0;
  const topicCount = stats.topicCount ?? 0;
  const contentCompleteness = moduleCount > 0 ? Math.min(100, Math.round((topicCount / (moduleCount * 5)) * 100)) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-slate-500 font-medium animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard Overview</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Welcome back. Here&apos;s what&apos;s happening with MedEase today.</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg shadow-sm hover:bg-teal-700 transition-all font-medium w-fit"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          to="/admin/users"
          className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Students</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{stats.userCount ?? 0}</h3>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-slate-400 dark:text-slate-500">Registered students</span>
          </div>
        </Link>

        {isSuperAdmin && (
          <Link
            to="/admin/payments"
            className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Payments</p>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{stats.pendingPayments ?? 0}</h3>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl">
                <Wallet className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              {(stats.pendingPayments ?? 0) > 0 ? (
                <span className="flex items-center text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded-full gap-0.5">
                  <AlertTriangle className="w-3 h-3" />
                  Action Needed
                </span>
              ) : (
                <span className="text-xs text-slate-400 dark:text-slate-500">All clear</span>
              )}
            </div>
          </Link>
        )}

        <Link
          to="/admin/resources"
          className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Programs / Years / Modules</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{programCount} / {yearCount} / {moduleCount}</h3>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${contentCompleteness}%` }} />
            </div>
            <p className="text-[10px] mt-1 text-slate-400 dark:text-slate-500">Content completeness {contentCompleteness}%</p>
          </div>
        </Link>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total MCQs</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{stats.mcqCount ?? 0}</h3>
            </div>
            <div className="p-3 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-xl">
              <HelpCircle className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-slate-400 dark:text-slate-500">Across all topics</span>
          </div>
        </div>
      </div>

      {/* Recent Users + Recent Payments (payments only for super admin) */}
      <div className={`grid grid-cols-1 gap-8 ${isSuperAdmin ? 'lg:grid-cols-3' : ''}`}>
        <div className={`${isSuperAdmin ? 'lg:col-span-2' : ''} bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden`}>
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Recent Users</h3>
            <Link to="/admin/users" className="text-primary hover:underline text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Verified</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {recentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                      No users yet
                    </td>
                  </tr>
                ) : (
                  recentUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                          {(u.name || 'U').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{u.name || '—'}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{u.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-bold rounded-lg flex items-center gap-1 w-fit ${
                            u.isVerified
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {u.isVerified ? <BadgeCheck className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                          {u.isVerified ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link to="/admin/users" className="text-slate-400 hover:text-primary transition-colors inline-flex">
                          <Pencil className="w-5 h-5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {isSuperAdmin && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Recent Payments</h3>
            </div>
            <div className="p-6 space-y-6">
              {recentPayments.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No payments yet.</p>
              ) : (
                recentPayments.slice(0, 5).map((p) => (
                  <div key={p._id} className="flex items-start gap-4">
                    <div
                      className={`p-2 rounded-lg ${
                        p.status === 'approved'
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                          : p.status === 'rejected'
                            ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
                            : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{p.user?.name || '—'}</h4>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">Rs. {p.amount}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{p.package?.name || '—'}</p>
                      <div className="flex items-center justify-between pt-2">
                        <span
                          className={`text-[10px] font-bold uppercase ${
                            p.status === 'approved'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : p.status === 'rejected'
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {p.status}
                        </span>
                        {p.receiptUrl && (
                          <a
                            href={p.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold text-primary hover:underline"
                          >
                            VIEW RECEIPT
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                <Link
                  to="/admin/payments"
                  className="block w-full py-2.5 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-600 transition-all text-center"
                >
                  View All Transactions
                </Link>
              </div>
            </div>
          </div>
        )}

        {isSuperAdmin && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                Maintenance Tools
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                  Activate free-trial packages for all student users (all years/modules configured as free-trial).
                </p>
                <button
                  type="button"
                  onClick={handleActivateFreeTrialForAll}
                  disabled={activateTrialLoading}
                  className="px-4 py-2 bg-primary hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                >
                  <Wrench className="w-4 h-4" />
                  {activateTrialLoading ? 'Running…' : 'Activate free trial for all students'}
                </button>
                {activateTrialResult && (
                  <p
                    className={`mt-2 text-sm font-medium ${
                      activateTrialResult.error
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {activateTrialResult.error ||
                      `Done. Created ${activateTrialResult.created ?? 0} free-trial UserPackage records.`}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MCQ Maintenance - commented out from UI
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Wrench className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          MCQ Maintenance
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Remove the 5th option from any MCQs that have more than 4 options (e.g. when &quot;Correct Answer: C&quot; was saved as option E).
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={handleRemoveFifthOption}
            disabled={removeFifthLoading}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            {removeFifthLoading ? 'Running…' : 'Remove 5th option from all MCQs'}
          </button>
          {removeFifthResult && (
            <span className={`text-sm font-medium ${removeFifthResult.error ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {removeFifthResult.error || (removeFifthResult.updated === 0 ? removeFifthResult.message : `${removeFifthResult.message} (correctIndex fixed for ${removeFifthResult.correctedIndex ?? 0})`)}
            </span>
          )}
        </div>
      </div>
      */}

      {/* CTA Banner */}
      <div className="bg-gradient-to-r from-teal-500 to-primary p-8 rounded-3xl text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
        <div className="relative z-10">
          <h3 className="text-2xl font-bold">Manage Your Course Content</h3>
          <p className="text-teal-50 mt-1">Upload new modules, create packages, or manage existing learning resources.</p>
          <div className="flex flex-wrap gap-4 mt-6">
            <Link
              to="/admin/packages"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-primary rounded-xl font-bold shadow-lg hover:bg-slate-100 transition-all"
            >
              <PlusCircle className="w-5 h-5" />
              Add Package
            </Link>
            <Link
              to="/admin/resources"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-400/30 border border-teal-200 text-white rounded-xl font-bold backdrop-blur-sm hover:bg-teal-400/40 transition-all"
            >
              <FileEdit className="w-5 h-5" />
              Edit Topics
            </Link>
          </div>
        </div>
        <div className="relative z-10 w-32 h-32 bg-white/10 rounded-full flex items-center justify-center border border-white/20 shrink-0">
          <GraduationCap className="w-16 h-16 opacity-80" />
        </div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-3xl" aria-hidden="true" />
        <div className="absolute top-0 right-1/4 w-24 h-24 bg-white/5 rounded-full blur-2xl" aria-hidden="true" />
      </div>
    </div>
  );
}
