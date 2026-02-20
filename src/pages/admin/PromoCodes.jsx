import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Tag, Pencil, Trash2 } from 'lucide-react';
import ConfirmDialog from '../../components/admin/ConfirmDialog';

export default function AdminPromoCodes() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({
    code: '',
    discountType: 'fixed',
    discountValue: '',
    validFrom: '',
    validTo: '',
    usageLimit: '',
    isActive: true,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCodes = () => {
    api.get('/admin/promo-codes').then(({ data }) => setCodes(data)).catch(() => setCodes([])).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const resetForm = () => {
    setForm({
      code: '',
      discountType: 'fixed',
      discountValue: '',
      validFrom: '',
      validTo: '',
      usageLimit: '',
      isActive: true,
    });
    setEditing(null);
    setError('');
  };

  const handleEdit = (promo) => {
    setEditing(promo);
    setForm({
      code: promo.code,
      discountType: promo.discountType || 'fixed',
      discountValue: promo.discountValue ?? '',
      validFrom: promo.validFrom ? promo.validFrom.slice(0, 16) : '',
      validTo: promo.validTo ? promo.validTo.slice(0, 16) : '',
      usageLimit: promo.usageLimit ?? '',
      isActive: promo.isActive !== false,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue) || 0,
        validFrom: form.validFrom || undefined,
        validTo: form.validTo || undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        isActive: form.isActive,
      };
      if (editing) {
        await api.put(`/admin/promo-codes/${editing._id}`, payload);
      } else {
        await api.post('/admin/promo-codes', payload);
      }
      resetForm();
      fetchCodes();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await api.delete(`/admin/promo-codes/${deleteId}`);
      setDeleteId(null);
      fetchCodes();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-gray-900 mb-6">Promo Codes</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4 max-w-lg">
        <h2 className="font-semibold text-gray-900">{editing ? 'Edit' : 'Create'} Promo Code</h2>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
          <input
            type="text"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            placeholder="e.g. SAVE250"
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount type</label>
            <select
              value={form.discountType}
              onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="fixed">Fixed (Rs)</option>
              <option value="percent">Percent (%)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
            <input
              type="number"
              value={form.discountValue}
              onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
              min={0}
              step={form.discountType === 'percent' ? 1 : 1}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valid from (optional)</label>
            <input
              type="datetime-local"
              value={form.validFrom}
              onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valid to (optional)</label>
            <input
              type="datetime-local"
              value={form.validTo}
              onChange={(e) => setForm((f) => ({ ...f, validTo: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Usage limit (optional)</label>
          <input
            type="number"
            value={form.usageLimit}
            onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
            min={0}
            placeholder="Unlimited"
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            className="rounded"
          />
          <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
          </button>
          {editing && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-4">
          {codes.length === 0 ? (
            <p className="text-gray-500">No promo codes yet.</p>
          ) : (
            codes.map((promo) => (
              <div key={promo._id} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-gray-900">{promo.code}</span>
                    {!promo.isActive && (
                      <span className="text-xs px-2 py-0.5 bg-gray-200 rounded">Inactive</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {promo.discountType === 'fixed' ? `₨${promo.discountValue}` : `${promo.discountValue}%`} off
                    {promo.usageLimit != null && ` • ${promo.usageCount}/${promo.usageLimit} used`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(promo)}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    <Pencil className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(promo._id)}
                    className="p-2 rounded-lg border border-red-200 hover:bg-red-50 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete promo code"
        message="Are you sure you want to delete this promo code?"
        onConfirm={handleDelete}
      />
    </div>
  );
}
