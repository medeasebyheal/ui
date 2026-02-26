import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, UserPlus, KeyRound } from 'lucide-react';
import api from '../../api/client';
import Modal from '../../components/admin/Modal';

export default function AdminsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState({ id: null, name: '' });
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '' });
  const [resetPassword, setResetPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchAdmins = useCallback(() => {
    setLoading(true);
    api
      .get('/admin/admins')
      .then(({ data }) => setAdmins(Array.isArray(data) ? data : []))
      .catch(() => setAdmins([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isSuperAdmin) fetchAdmins();
  }, [isSuperAdmin, fetchAdmins]);

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setError('');
    const { name, email, password } = addForm;
    if (!email?.trim() || !password || password.length < 6) {
      setError('Email and password (min 6 characters) are required.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/admin/admins', { name: name?.trim() || undefined, email: email.trim(), password });
      setAddOpen(false);
      setAddForm({ name: '', email: '', password: '' });
      fetchAdmins();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create admin.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetOpen.id || !resetPassword || resetPassword.length < 6) return;
    setError('');
    setSaving(true);
    try {
      await api.patch(`/admin/admins/${resetOpen.id}/reset-password`, { newPassword: resetPassword });
      setResetOpen({ id: null, name: '' });
      setResetPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setSaving(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4">
        <ShieldCheck className="w-12 h-12 text-slate-400 mb-4" />
        <p className="text-slate-600 dark:text-slate-400 font-medium">Access denied. Only super admin can manage admins.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <p className="text-slate-500 font-medium animate-pulse">Loading admins...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Admins</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage admin accounts and reset passwords.</p>
        </div>
        <button
          type="button"
          onClick={() => { setAddOpen(true); setError(''); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Add Admin
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No admins yet. Add one to get started.
                  </td>
                </tr>
              ) : (
                admins.map((a) => (
                  <tr key={a._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{a.name || '—'}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{a.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-lg ${
                          a.role === 'superadmin'
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {a.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => setResetOpen({ id: a._id, name: a.name || a.email })}
                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
                      >
                        <KeyRound className="w-4 h-4" />
                        Reset password
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {addOpen && (
        <Modal open onClose={() => { setAddOpen(false); setError(''); setAddForm({ name: '', email: '', password: '' }); }} title="Add Admin">
          <form onSubmit={handleAddAdmin} className="space-y-4">
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name (optional)</label>
              <input
                type="text"
                value={addForm.name}
                onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
                placeholder="Admin name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
              <input
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password (min 6 characters) *</label>
              <input
                type="password"
                value={addForm.password}
                onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
                placeholder="••••••••"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setAddOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50 hover:bg-teal-700">
                {saving ? 'Creating…' : 'Create Admin'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {resetOpen.id && (
        <Modal open onClose={() => { setResetOpen({ id: null, name: '' }); setResetPassword(''); setError(''); }} title={`Reset password: ${resetOpen.name}`}>
          <form onSubmit={handleResetPassword} className="space-y-4">
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New password (min 6 characters) *</label>
              <input
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
                placeholder="••••••••"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setResetOpen({ id: null, name: '' })} className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">
                Cancel
              </button>
              <button type="submit" disabled={saving || resetPassword.length < 6} className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50 hover:bg-teal-700">
                {saving ? 'Updating…' : 'Update password'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
