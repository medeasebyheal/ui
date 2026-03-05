import { useEffect, useState, useCallback } from 'react';
import { Trash2, Check } from 'lucide-react';
import api from '../../api/client';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import Modal from '../../components/admin/Modal';

const LIMIT = 20;

export default function ContactQueries() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewItem, setViewItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetch = useCallback(() => {
    setLoading(true);
    api
      .get('/contact', { params: { page, limit: LIMIT } })
      .then(({ data }) => {
        setItems(data.docs || []);
        setTotal(data.total || 0);
      })
      .catch(() => {
        setItems([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleResolve = async (id) => {
    try {
      await api.post(`/contact/${id}/resolve`);
      setItems((prev) => prev.map((p) => (p._id === id ? { ...p, resolved: true } : p)));
    } catch (_) {}
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/contact/${deleteConfirm._id}`);
      setItems((prev) => prev.filter((p) => p._id !== deleteConfirm._id));
      setTotal((t) => Math.max(0, t - 1));
      setDeleteConfirm(null);
    } catch (_) {}
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Contact Queries</h2>
      </div>

      <div className="bg-white rounded-xl border p-4 shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-sm text-slate-500">
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Message</th>
              <th className="px-4 py-3">Package</th>
              <th className="px-4 py-3">Resolved</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={8} className="p-8 text-center">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center">No queries found.</td></tr>
            ) : items.map((it) => (
              <tr key={it._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm">{new Date(it.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3">{it.name || '—'}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{it.email}</td>
                <td className="px-4 py-3">{it.subject || '—'}</td>
                <td className="px-4 py-3 max-w-xl truncate">{it.message}</td>
                <td className="px-4 py-3">{it.packageInterest || '—'}</td>
                <td className="px-4 py-3">{it.resolved ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {!it.resolved && (
                      <button onClick={() => handleResolve(it._id)} className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md">
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => setViewItem(it)} className="px-2 py-1 border rounded-md">View</button>
                    <button onClick={() => setDeleteConfirm(it)} className="px-2 py-1 bg-red-50 text-red-600 rounded-md">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="text-sm text-slate-600">Showing page {page} of {totalPages}</div>
          <div className="flex items-center gap-2">
            <button disabled={page<=1} onClick={() => setPage((p)=>Math.max(1,p-1))} className="px-3 py-1 border rounded-md">Prev</button>
            <button disabled={page>=totalPages} onClick={() => setPage((p)=>Math.min(totalPages,p+1))} className="px-3 py-1 border rounded-md">Next</button>
          </div>
        </div>
      </div>

      {viewItem && (
        <Modal open onClose={() => setViewItem(null)} title="Contact Query">
          <div className="space-y-3">
            <p><strong>Name:</strong> {viewItem.name || '—'}</p>
            <p><strong>Email:</strong> {viewItem.email}</p>
            <p><strong>Phone:</strong> {viewItem.phone || '—'}</p>
            <p><strong>Subject:</strong> {viewItem.subject || '—'}</p>
            <p><strong>Package Interest:</strong> {viewItem.packageInterest || '—'}</p>
            <div className="pt-2">
              <p className="whitespace-pre-wrap">{viewItem.message}</p>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Query"
        message={deleteConfirm ? `Delete query from ${deleteConfirm.email}? This cannot be undone.` : ''}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        danger
      />
    </div>
  );
}

