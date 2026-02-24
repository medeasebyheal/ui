import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api/client';
import { Plus, Trash2, ChevronRight, FolderTree } from 'lucide-react';

function normalizeYears(jsmu) {
  return jsmu?.years ?? [];
}

export default function ProffJsmuYears() {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = () =>
    api
      .get('/admin/proff/jsmu')
      .then(({ data }) => setYears(normalizeYears(data)))
      .catch(() => setYears([]));

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const addYear = async () => {
    setAdding(true);
    try {
      await api.post('/admin/proff/jsmu/years', { name: `Year ${years.length + 1}` });
      await load();
    } catch (_) {}
    setAdding(false);
  };

  const updateYearName = async (yearId, name) => {
    try {
      await api.put(`/admin/proff/jsmu/years/${yearId}`, { name });
      setYears((prev) => prev.map((y) => (y._id === yearId ? { ...y, name } : y)));
    } catch (_) {}
  };

  const removeYear = async (yearId) => {
    setDeletingId(yearId);
    try {
      await api.delete(`/admin/proff/jsmu/years/${yearId}`);
      await load();
    } catch (_) {}
    setDeletingId(null);
  };

  if (loading) return <div className="animate-pulse text-gray-500">Loading...</div>;

  return (
    <>
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link to="/admin/proff" className="hover:text-primary">Proff</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">JSMU</span>
      </nav>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">JSMU</h1>
          <p className="text-sm text-gray-500 mt-1">Year-wise: Paper 1, Paper 2, OSPE 1, OSPE 2 per year.</p>
        </div>
        <button
          type="button"
          onClick={addYear}
          disabled={adding}
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-medium text-sm disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> {adding ? 'Adding...' : 'Add year'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <ul className="divide-y divide-gray-100">
          {years.length === 0 ? (
            <li className="p-8 text-center text-gray-500">
              <FolderTree className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No years yet. Add a year to define Paper 1, Paper 2, OSPE 1, OSPE 2.</p>
              <button
                type="button"
                onClick={addYear}
                disabled={adding}
                className="mt-3 text-primary font-medium hover:underline disabled:opacity-50"
              >
                Add first year
              </button>
            </li>
          ) : (
            years.map((yr) => (
              <li key={yr._id} className="flex items-center justify-between p-4 hover:bg-gray-50/50">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <input
                    defaultValue={yr.name || ''}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v && v !== (yr.name || '')) updateYearName(yr._id, v);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.target.blur();
                    }}
                    className="font-medium text-gray-900 bg-transparent border-none focus:ring-0 p-0 w-48"
                    placeholder="Year name"
                  />
                  <span className="text-sm text-gray-500">
                    {Array.isArray(yr.papers) ? yr.papers.length : 4} papers
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => removeYear(yr._id)}
                    disabled={deletingId === yr._id}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                    title="Remove year"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Link
                    to={`/admin/proff/jsmu/years/${yr._id}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    Open <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </>
  );
}
