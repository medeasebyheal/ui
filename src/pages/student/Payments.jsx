import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, TrendingUp, Package, Calendar, Search, SlidersHorizontal, Download, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

function formatInvoiceId(id) {
  if (!id) return '—';
  const str = String(id);
  const short = str.slice(-6).toUpperCase();
  const year = new Date().getFullYear();
  return `INV-${year}-${short}`;
}

function formatAmount(n) {
  if (n == null) return 'Rs 0';
  return `Rs ${Number(n).toLocaleString()}`;
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });
}

function StatusBadge({ status }) {
  const styles = {
    approved: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    rejected: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  };
  const labels = {
    approved: 'Approved',
    pending: 'Pending',
    rejected: 'Rejected',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
        styles[status] || styles.pending
      }`}
    >
      {labels[status] || status}
    </span>
  );
}

export default function StudentPayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/payments').then(({ data }) => setPayments(data)).catch(() => setPayments([])).finally(() => setLoading(false));
  }, []);

  const filteredPayments = useMemo(() => {
    if (!search.trim()) return payments;
    const q = search.trim().toLowerCase();
    return payments.filter(
      (p) =>
        (p.package?.name || '').toLowerCase().includes(q) ||
        formatInvoiceId(p._id).toLowerCase().includes(q)
    );
  }, [payments, search]);

  const totalSpent = useMemo(
    () => payments.filter((p) => p.status === 'approved').reduce((sum, p) => sum + (p.amount || 0), 0),
    [payments]
  );
  const lastApprovedPayment = useMemo(
    () => payments.find((p) => p.status === 'approved'),
    [payments]
  );
  const activePackagesCount = user?.packages?.length ?? 0;

  return (
    <div className="max-w-6xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Payments & Billing</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Manage your subscriptions and view transaction history.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Spent</span>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{formatAmount(totalSpent)}</h3>
          <p className="text-xs text-emerald-500 mt-2 flex items-center gap-1">
            {lastApprovedPayment ? (
              <>
                <TrendingUp className="w-3 h-3" />
                Last payment on {formatDate(lastApprovedPayment.createdAt)}
              </>
            ) : (
              <span className="text-slate-400">No payments yet</span>
            )}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Active Packages</span>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{activePackagesCount}</h3>
          <p className="text-xs text-slate-400 mt-2">
            {activePackagesCount > 0 ? 'Access your subscribed modules' : 'Apply for a package to get started'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Next Renewal</span>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">—</h3>
          <p className="text-xs text-slate-400 mt-2">Contact support for renewal details</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Transaction History</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search invoices..."
                className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent w-full sm:w-64"
              />
            </div>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <SlidersHorizontal className="w-5 h-5" />
              Filter
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Invoice ID
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Package Name
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Date
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        No payments yet.
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((p) => (
                      <tr
                        key={p._id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-primary font-medium">{formatInvoiceId(p._id)}</span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                          {p.package?.name || '—'}
                        </td>
                        <td className="px-6 py-4 text-slate-900 dark:text-slate-200">{formatAmount(p.amount)}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{formatDate(p.createdAt)}</td>
                        <td className="px-6 py-4 text-right">
                          <a
                            href={p.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-primary transition-colors"
                            title="View receipt"
                          >
                            <Download className="w-5 h-5" />
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {filteredPayments.length > 0 && (
              <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Showing 1 to {filteredPayments.length} of {filteredPayments.length} results
                </span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-8 bg-primary/5 dark:bg-primary/10 p-6 rounded-2xl border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-full">
            <MessageCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white">Having trouble with a payment?</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Our support team is here to help you with any billing queries.
            </p>
          </div>
        </div>
        <Link
          to="/contact"
          className="px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          Contact Support
        </Link>
      </div>
    </div>
  );
}
