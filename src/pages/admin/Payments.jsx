import { useEffect, useState, useMemo } from 'react';
import api from '../../api/client';
import Modal from '../../components/admin/Modal';

const PER_PAGE = 10;

function getInitials(name, email) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return '?';
}

function packageSubtitle(pkg) {
  if (!pkg) return '';
  const parts = [];
  if (pkg.description) parts.push(pkg.description);
  if (pkg.year != null) parts.push(`Year ${pkg.year}`);
  if (pkg.part != null) parts.push(`Part ${pkg.part}`);
  return parts.join(' • ') || pkg.name || '';
}

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [rejectModal, setRejectModal] = useState({ paymentId: null, reason: '' });
  const [menuOpen, setMenuOpen] = useState(null);

  const fetchPayments = () => {
    setLoading(true);
    return api
      .get('/payments')
      .then(({ data }) => setPayments(Array.isArray(data) ? data : []))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchInput, statusFilter]);

  const handleVerify = async (id, status, rejectionReason) => {
    try {
      await api.patch(`/payments/${id}/verify`, { status, rejectionReason: rejectionReason || '' });
      await fetchPayments();
      setMenuOpen(null);
    } catch (_) {}
  };

  const handleRejectClick = (paymentId) => {
    setRejectModal({ paymentId, reason: '' });
    setMenuOpen(null);
  };

  const handleConfirmReject = () => {
    if (!rejectModal.paymentId || !rejectModal.reason.trim()) return;
    handleVerify(rejectModal.paymentId, 'rejected', rejectModal.reason.trim());
    setRejectModal({ paymentId: null, reason: '' });
  };

  const totalRevenue = useMemo(
    () => payments.filter((p) => p.status === 'approved').reduce((sum, p) => sum + (p.amount || 0), 0),
    [payments]
  );
  const pendingCount = useMemo(() => payments.filter((p) => p.status === 'pending').length, [payments]);

  const filtered = useMemo(() => {
    let list = payments;
    const q = searchInput.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.user?.name?.toLowerCase().includes(q) ||
          p.user?.email?.toLowerCase().includes(q) ||
          p.package?.name?.toLowerCase().includes(q)
      );
    }
    if (statusFilter) list = list.filter((p) => p.status === statusFilter);
    return list;
  }, [payments, searchInput, statusFilter]);

  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PER_PAGE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, page]);

  const start = totalFiltered === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const end = Math.min(page * PER_PAGE, totalFiltered);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header + Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Payments</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage and track student subscriptions and transactions.</p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:gap-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 min-w-[180px]">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Revenue</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">Rs. {totalRevenue.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 min-w-[180px]">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined">pending_actions</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pending</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{pendingCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by student, email or package..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <span className="material-symbols-outlined text-sm">file_download</span>
            Export
          </button>
        </div>
      </div>

      {/* Payment cards */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-slate-500 dark:text-slate-400">
            Loading...
          </div>
        ) : paginated.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-slate-500 dark:text-slate-400">
            No payments found.
          </div>
        ) : (
          paginated.map((p) => (
            <div
              key={p._id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:shadow-md transition-shadow group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-400 shrink-0">
                    {getInitials(p.user?.name, p.user?.email)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 dark:text-white truncate">{p.user?.name || '—'}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{p.user?.email}</p>
                  </div>
                </div>
                <div className="flex-1 lg:border-l lg:border-slate-200 dark:lg:border-slate-800 lg:pl-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Package Details</span>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{p.package?.name || '—'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{packageSubtitle(p.package)}</p>
                  </div>
                </div>
                <div className="lg:w-32">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Amount</span>
                  <p className="text-lg font-bold text-primary">Rs. {(p.amount || 0).toLocaleString()}</p>
                </div>
                <div className="lg:w-32">
                  {p.status === 'approved' && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 font-semibold inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-600 shrink-0" />
                      Approved
                    </span>
                  )}
                  {p.status === 'pending' && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 font-semibold inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                      Pending
                    </span>
                  )}
                  {p.status === 'rejected' && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 font-semibold inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                      Rejected
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {p.receiptUrl && (
                    <a
                      href={p.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white transition-all text-sm font-medium"
                    >
                      <span className="material-symbols-outlined text-sm">receipt</span>
                      View Receipt
                    </a>
                  )}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setMenuOpen(menuOpen === p._id ? null : p._id)}
                      className="p-2 text-slate-400 hover:text-red-500 transition rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      aria-label="More actions"
                    >
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                    {menuOpen === p._id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} aria-hidden="true" />
                        <div className="absolute right-0 top-full mt-1 py-1 min-w-[140px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-20">
                          {p.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleVerify(p._id, 'approved')}
                                className="w-full px-4 py-2 text-left text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectClick(p._id)}
                                className="w-full px-4 py-2 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {p.status === 'rejected' && p.rejectionReason && (
                            <div className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                              Reason: {p.rejectionReason}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Showing <span className="font-medium text-slate-900 dark:text-slate-100">{start}</span> to{' '}
          <span className="font-medium text-slate-900 dark:text-slate-100">{end}</span> of{' '}
          <span className="font-medium text-slate-900 dark:text-slate-100">{totalFiltered}</span> results
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let p;
            if (totalPages <= 5) p = i + 1;
            else if (page <= 3) p = i + 1;
            else if (page >= totalPages - 2) p = totalPages - 4 + i;
            else p = page - 2 + i;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`w-10 h-10 flex items-center justify-center rounded-lg font-medium transition ${
                  page === p ? 'bg-primary text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {p}
              </button>
            );
          })}
          {totalPages > 5 && <span className="mx-1 text-slate-400">...</span>}
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Reject modal */}
      {rejectModal.paymentId && (
        <Modal open onClose={() => setRejectModal({ paymentId: null, reason: '' })} title="Reject payment">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Please provide a reason for rejection. The user will receive this in an email.
          </p>
          <textarea
            value={rejectModal.reason}
            onChange={(e) => setRejectModal((m) => ({ ...m, reason: e.target.value }))}
            placeholder="Enter rejection reason..."
            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-primary resize-none text-sm"
            rows={4}
          />
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={() => setRejectModal({ paymentId: null, reason: '' })}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmReject}
              disabled={!rejectModal.reason.trim()}
              className="px-4 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Reject
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
