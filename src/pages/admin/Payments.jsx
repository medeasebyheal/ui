import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState({ paymentId: null, reason: '' });

  const fetchPayments = () => {
    return api.get('/payments').then(({ data }) => setPayments(data)).catch(() => setPayments([])).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleVerify = async (id, status, rejectionReason) => {
    try {
      await api.patch(`/payments/${id}/verify`, { status, rejectionReason: rejectionReason || '' });
      await fetchPayments();
    } catch (_) {}
  };

  const handleRejectClick = (paymentId) => {
    setRejectModal({ paymentId, reason: '' });
  };

  const handleConfirmReject = () => {
    if (!rejectModal.paymentId || !rejectModal.reason.trim()) return;
    handleVerify(rejectModal.paymentId, 'rejected', rejectModal.reason.trim());
    setRejectModal({ paymentId: null, reason: '' });
  };

  const pending = payments.filter((p) => p.status === 'pending');
  const rest = payments.filter((p) => p.status !== 'pending');

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-gray-900 mb-6">Payments</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-6">
          {[...pending, ...rest].map((p) => (
            <div key={p._id} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-medium">{p.user?.name} – {p.user?.email}</p>
                <p className="text-sm text-gray-500">{p.package?.name} – ₨{p.amount}</p>
                <p className="text-sm">Status: <span className={p.status === 'approved' ? 'text-green-600' : p.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'}>{p.status}</span></p>
                {p.status === 'rejected' && p.rejectionReason && (
                  <p className="text-sm text-gray-600 mt-1">Reason: {p.rejectionReason}</p>
                )}
                {p.receiptUrl && (
                  <a href={p.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-sm">View receipt</a>
                )}
              </div>
              {p.status === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => handleVerify(p._id, 'approved')} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Approve</button>
                  <button onClick={() => handleRejectClick(p._id)} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Reject</button>
                </div>
              )}
            </div>
          ))}
          {payments.length === 0 && <p className="text-gray-500">No payments.</p>}
        </div>
      )}

      {/* Rejection reason modal */}
      {rejectModal.paymentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setRejectModal({ paymentId: null, reason: '' })}>
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-heading font-bold text-gray-900 mb-2">Reject payment</h2>
            <p className="text-sm text-gray-600 mb-4">Please provide a reason for rejection. The user will receive this in an email.</p>
            <textarea
              value={rejectModal.reason}
              onChange={(e) => setRejectModal((m) => ({ ...m, reason: e.target.value }))}
              placeholder="Enter rejection reason..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
              rows={4}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setRejectModal({ paymentId: null, reason: '' })}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={!rejectModal.reason.trim()}
                className="px-3 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
