import { useEffect, useState, useCallback } from 'react';
import { UserPlus, Search, Eye, Pencil, Trash2, Ban, Unlock, UserX } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api/client';
import Modal from '../../components/admin/Modal';
import ConfirmDialog from '../../components/admin/ConfirmDialog';

const LIMIT = 20;

function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getInitials(name, email) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return '?';
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('');
  const [viewUser, setViewUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [actionConfirm, setActionConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [verifyError, setVerifyError] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', contact: '' });

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = { page, limit: LIMIT };
    if (search) params.search = search;
    if (roleFilter) params.role = roleFilter;
    if (verifiedFilter !== '') params.verified = verifiedFilter;
    api
      .get('/users', { params })
      .then(({ data }) => {
        setUsers(data.users || []);
        setTotal(data.total ?? 0);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [page, search, roleFilter, verifiedFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleVerify = async (id) => {
    setVerifyError(null);
    try {
      await api.patch(`/users/${id}/verify`);
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, isVerified: true } : u)));
      if (viewUser?._id === id) setViewUser((u) => (u ? { ...u, isVerified: true } : null));
    } catch (err) {
      const message = err.response?.data?.message || 'Verification failed. User must be subscribed to a package first.';
      setVerifyError(message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editUser?._id) return;
    setSaving(true);
    try {
      const { data } = await api.put(`/users/${editUser._id}`, {
        name: editForm.name.trim() || editUser.name,
        contact: editForm.contact.trim() || undefined,
      });
      setUsers((prev) => prev.map((u) => (u._id === data._id ? data : u)));
      setEditUser(null);
    } catch (_) {}
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/users/${deleteConfirm._id}`);
      setUsers((prev) => prev.filter((u) => u._id !== deleteConfirm._id));
      setTotal((t) => Math.max(0, t - 1));
      setDeleteConfirm(null);
      toast.success('User deleted');
    } catch (_) {
      toast.error('Failed to delete user');
    }
  };

  const handleBlock = async (id) => {
    try {
      const { data } = await api.patch(`/users/${id}/block`);
      setUsers((prev) => prev.map((u) => (u._id === data._id ? data : u)));
      if (viewUser?._id === data._id) setViewUser(data);
      toast.success('User blocked');
    } catch (_) {
      toast.error('Failed to block user');
    }
    setActionConfirm(null);
  };

  const handleUnblock = async (id) => {
    try {
      const { data } = await api.patch(`/users/${id}/unblock`);
      setUsers((prev) => prev.map((u) => (u._id === data._id ? data : u)));
      if (viewUser?._id === data._id) setViewUser(data);
      toast.success('User unblocked');
    } catch (_) {
      toast.error('Failed to unblock user');
    }
    setActionConfirm(null);
  };

  const handleRevoke = async (id) => {
    try {
      const { data } = await api.patch(`/users/${id}/revoke`);
      // API returns updated user in data.user
      const updatedUser = data.user || data;
      setUsers((prev) => prev.map((u) => (u._id === updatedUser._id ? updatedUser : u)));
      if (viewUser?._id === updatedUser._id) setViewUser(updatedUser);
      toast.success('User access revoked');
    } catch (_) {
      toast.error('Failed to revoke access');
    }
    setActionConfirm(null);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({ name: u.name || '', contact: u.contact || '' });
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const start = total === 0 ? 0 : (page - 1) * LIMIT + 1;
  const end = Math.min(page * LIMIT, total);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {verifyError && (
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
          <span>{verifyError}</span>
          <button type="button" onClick={() => setVerifyError(null)} className="font-medium hover:underline shrink-0">Dismiss</button>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Users</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">Manage your students and administrators roles.</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-teal-700 text-white font-medium rounded-lg transition-all shadow-sm w-fit"
        >
          <UserPlus className="w-4 h-4" />
          Add New User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, email or ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-0 rounded-lg focus:ring-2 focus:ring-primary text-sm transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={verifiedFilter}
            onChange={(e) => setVerifiedFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border-0 rounded-lg text-sm px-4 py-2 focus:ring-2 focus:ring-primary cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="true">Verified</option>
            <option value="false">Pending</option>
          </select>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border-0 rounded-lg text-sm px-4 py-2 focus:ring-2 focus:ring-primary cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">User Details</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Role</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Joined Date</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-primary font-bold shrink-0">
                          {getInitials(u.name, u.email)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{u.name || '—'}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 capitalize">{u.role || '—'}</td>
                    <td className="px-6 py-4">
                      {u.isVerified ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 shrink-0" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 shrink-0" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{formatDate(u.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!u.isBlocked ? (
                          <button
                            type="button"
                            onClick={() => setActionConfirm({ type: 'block', user: u })}
                            className="p-2 text-slate-400 hover:text-slate-700 transition-colors rounded-lg hover:bg-slate-100"
                            title="Block"
                          >
                            <Ban className="w-5 h-5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActionConfirm({ type: 'unblock', user: u })}
                            className="p-2 text-slate-400 hover:text-emerald-600 transition-colors rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/10"
                            title="Unblock"
                          >
                            <Unlock className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (u.activePlanId == null) return;
                            setActionConfirm({ type: 'revoke', user: u });
                          }}
                          disabled={u.activePlanId == null}
                          className={`p-2 text-slate-400 transition-colors rounded-lg ${
                            u.activePlanId == null
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10'
                          }`}
                          title={u.activePlanId == null ? 'Access already revoked' : 'Revoke Access'}
                        >
                          <UserX className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewUser(u)}
                          className="p-2 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-primary/10"
                          title="View"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(u)}
                          className="p-2 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-primary/10"
                          title="Edit"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        {/* Verify action removed from listing; verification can be performed from the user detail modal */}
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(u)}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing <span className="font-medium text-slate-900 dark:text-slate-100">{start}</span> to{' '}
            <span className="font-medium text-slate-900 dark:text-slate-100">{end}</span> of{' '}
            <span className="font-medium text-slate-900 dark:text-slate-100">{total}</span> results
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-md hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              Previous
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
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    page === p
                      ? 'bg-primary text-white'
                      : 'border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            {totalPages > 5 && <span className="text-slate-400 px-1">...</span>}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-md hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* View modal */}
      {viewUser && (
        <Modal open onClose={() => { setViewUser(null); setVerifyError(null); }} title="User Details">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-primary font-bold text-lg">
                {getInitials(viewUser.name, viewUser.email)}
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{viewUser.name || '—'}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{viewUser.email}</p>
              </div>
            </div>
            <dl className="grid grid-cols-1 gap-2 text-sm">
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Role</dt>
                <dd className="font-medium text-slate-900 dark:text-slate-100 capitalize">{viewUser.role || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Status</dt>
                <dd>{viewUser.isVerified ? 'Verified' : 'Pending'}</dd>
              </div>
              {viewUser.contact && (
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Contact</dt>
                  <dd className="font-medium text-slate-900 dark:text-slate-100">{viewUser.contact}</dd>
                </div>
              )}
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Joined</dt>
                <dd className="font-medium text-slate-900 dark:text-slate-100">{formatDate(viewUser.createdAt)}</dd>
              </div>
            </dl>
            {verifyError && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                {verifyError}
              </p>
            )}
            {!viewUser.isVerified && (
              <button
                type="button"
                onClick={() => handleVerify(viewUser._id)}
                className="w-full py-2 bg-primary text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
              >
                Verify user
              </button>
            )}
          </div>
        </Modal>
      )}

      {/* Edit modal */}
      {editUser && (
        <Modal open onClose={() => setEditUser(null)} title="Edit User">
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contact</label>
              <input
                type="text"
                value={editForm.contact}
                onChange={(e) => setEditForm((f) => ({ ...f, contact: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Email and role cannot be changed here.</p>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setEditUser(null)} className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete User"
        message={deleteConfirm ? `Delete ${deleteConfirm.name || deleteConfirm.email}? This cannot be undone.` : ''}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        danger
      />
      <ConfirmDialog
        open={!!actionConfirm}
        onClose={() => setActionConfirm(null)}
        title={
          actionConfirm?.type === 'block'
            ? 'Block user'
            : actionConfirm?.type === 'unblock'
            ? 'Unblock user'
            : actionConfirm?.type === 'revoke'
            ? 'Revoke user access'
            : ''
        }
        message={
          actionConfirm
            ? actionConfirm.type === 'block'
              ? `Block ${actionConfirm.user?.name || actionConfirm.user?.email}? The user will be unable to log in.`
              : actionConfirm.type === 'unblock'
              ? `Unblock ${actionConfirm.user?.name || actionConfirm.user?.email}?`
              : actionConfirm.type === 'revoke'
              ? `Revoke access for ${actionConfirm.user?.name || actionConfirm.user?.email}? This will expire their subscriptions and log them out of all devices.`
              : ''
            : ''
        }
        confirmLabel={
          actionConfirm?.type === 'block' ? 'Block' : actionConfirm?.type === 'unblock' ? 'Unblock' : actionConfirm?.type === 'revoke' ? 'Revoke' : ''
        }
        onConfirm={() => {
          if (!actionConfirm) return;
          if (actionConfirm.type === 'block') handleBlock(actionConfirm.user._id);
          else if (actionConfirm.type === 'unblock') handleUnblock(actionConfirm.user._id);
          else if (actionConfirm.type === 'revoke') handleRevoke(actionConfirm.user._id);
        }}
        danger={actionConfirm?.type === 'block' || actionConfirm?.type === 'revoke'}
      />
    </div>
  );
}
