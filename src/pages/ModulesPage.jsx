import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Lock, LockOpen, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const CARD_BG_CLASSES = [
  'bg-teal-50',
  'bg-slate-50',
  'bg-red-50',
  'bg-blue-50',
  'bg-pink-50',
  'bg-indigo-50',
  'bg-orange-50',
  'bg-purple-50',
];

export default function ModulesPage() {
  const { user } = useAuth();
  const [years, setYears] = useState([]);
  const [modulesByYear, setModulesByYear] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  useEffect(() => {
    api.get('/content/years').then(({ data }) => setYears(data)).catch(() => setYears([])).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!years.length) return;
    Promise.all(years.map((y) => api.get(`/content/years/${y._id}/modules`).then((r) => ({ yearId: y._id, yearName: y.name, modules: r.data }))))
      .then((results) => {
        const next = {};
        results.forEach(({ yearId, yearName, modules }) => {
          next[yearId] = modules.map((m) => ({ ...m, yearId, yearName }));
        });
        setModulesByYear(next);
      })
      .catch(() => {});
  }, [years]);

  const allModules = useMemo(() => {
    return Object.values(modulesByYear).flat();
  }, [modulesByYear]);

  const filteredModules = useMemo(() => {
    let list = allModules;
    if (yearFilter) list = list.filter((m) => m.yearId === yearFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((m) => m.name?.toLowerCase().includes(q) || m.yearName?.toLowerCase().includes(q));
    }
    return list;
  }, [allModules, yearFilter, searchQuery]);

  // Module IDs the user has access to (from their registered packages only)
  const allowedModuleIds = useMemo(() => {
    const ids = new Set();
    if (!user?.packages?.length) return ids;
    user.packages.forEach((up) => {
      const pkg = up.package;
      if (pkg?.moduleIds?.length) {
        pkg.moduleIds.forEach((id) => {
          const idStr = typeof id === 'object' && id != null && (id._id || id.toString)
            ? String(id._id || id)
            : String(id);
          if (idStr && idStr !== 'undefined') ids.add(idStr);
        });
      }
    });
    return ids;
  }, [user?.packages]);

  return (
    <div className="min-h-screen bg-background-light text-slate-900 font-display">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl mb-4 tracking-tight">
            Curated Learning Modules
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Explore our comprehensive medical curriculum. Register and purchase a package to unlock full access to advanced sub-modules.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-10 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search modules, systems, or topics..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary focus:border-transparent placeholder-slate-400"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setYearFilter('')}
              className={`px-5 py-2.5 rounded-full font-medium whitespace-nowrap transition-colors ${
                !yearFilter
                  ? 'bg-primary text-white shadow-lg shadow-teal-500/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-primary'
              }`}
            >
              All Modules
            </button>
            {years.map((y) => (
              <button
                key={y._id}
                type="button"
                onClick={() => setYearFilter(y._id)}
                className={`px-5 py-2.5 rounded-full font-medium whitespace-nowrap transition-colors ${
                  yearFilter === y._id
                    ? 'bg-primary text-white shadow-lg shadow-teal-500/20'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-primary'
                }`}
              >
                {y.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-center text-slate-500 py-12">Loading modules...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredModules.map((mod, idx) => {
              const cardBg = CARD_BG_CLASSES[idx % CARD_BG_CLASSES.length];
              const modIdStr = mod._id != null ? String(mod._id) : (mod.id != null ? String(mod.id) : '');
              const moduleHasAccess = modIdStr && allowedModuleIds.has(modIdStr);
              return (
                <div
                  key={mod._id}
                  className="group module-card relative bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-2"
                >
                  <div className={`h-48 ${cardBg} flex items-center justify-center p-8 relative overflow-hidden`}>
                    {mod.imageUrl ? (
                      <img
                        src={mod.imageUrl}
                        alt=""
                        className="w-full h-full object-cover rounded-lg opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                    ) : (
                      <BookOpen className="w-16 h-16 text-primary/40" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent opacity-60 pointer-events-none" />
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-primary bg-teal-50 px-2 py-1 rounded">
                        {mod.yearName || '—'}
                      </span>
                      {moduleHasAccess ? (
                        <LockOpen className="w-5 h-5 text-slate-400" />
                      ) : (
                        <Lock className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-1">{mod.name}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2">
                      {mod.description || 'Subjects and topics for this module.'}
                    </p>
                  </div>
                  <div
                    className={`absolute inset-0 transition-opacity duration-300 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm pointer-events-none group-hover:pointer-events-auto ${
                      moduleHasAccess ? 'bg-primary/90' : 'bg-slate-900/90'
                    } opacity-0 group-hover:opacity-100`}
                  >
                    {moduleHasAccess ? (
                      <>
                        <BookOpen className="w-12 h-12 text-white mb-3" />
                        <h4 className="text-white font-bold text-lg mb-1">{mod.name}</h4>
                        <p className="text-teal-50 text-sm mb-6">View subjects and lessons</p>
                        <Link
                          to={`/student/modules/${mod._id}`}
                          className="bg-white text-primary px-6 py-2 rounded-full font-bold text-sm shadow-xl hover:bg-teal-50 transition-colors"
                        >
                          View Sub-modules
                        </Link>
                      </>
                    ) : (
                      <>
                        <Lock className="w-12 h-12 text-slate-400 mb-3" />
                        <h4 className="text-white font-bold text-lg mb-1">Locked Content</h4>
                        <p className="text-slate-300 text-sm mb-6">Register or purchase a package to access this module.</p>
                        <Link
                          to="/packages"
                          className="bg-primary text-white px-6 py-2 rounded-full font-bold text-sm shadow-xl hover:bg-teal-700 transition-colors"
                        >
                          Unlock Now
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredModules.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            {allModules.length === 0 ? 'No modules configured yet.' : 'No modules match your search or filter.'}
          </div>
        )}
      </div>
    </div>
  );
}
