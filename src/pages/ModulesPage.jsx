import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Lock, LockOpen, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

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

  const filteredModules = useMemo(() => {
    let list = allModules;
    if (yearFilter) list = list.filter((m) => m.yearId === yearFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((m) => m.name?.toLowerCase().includes(q) || m.yearName?.toLowerCase().includes(q));
    }
    // In student panel: show only modules the student has access to
    if (user && allowedModuleIds.size > 0) {
      list = list.filter((m) => {
        const idStr = m._id != null ? String(m._id) : (m.id != null ? String(m.id) : '');
        return idStr && allowedModuleIds.has(idStr);
      });
    }
    return list;
  }, [allModules, yearFilter, searchQuery, user, allowedModuleIds]);

 

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
              const modIdStr = mod._id != null ? String(mod._id) : (mod.id != null ? String(mod.id) : '');
              const moduleHasAccess = modIdStr && allowedModuleIds.has(modIdStr);
              const imgSrc = mod.imageUrl || null;
              return (
                <div
                  key={mod._id}
                  className="group module-card relative bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="aspect-[4/3] bg-slate-100 flex items-center justify-center relative overflow-hidden">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <BookOpen className="w-16 h-16 text-slate-300" />
                    )}
                    <div className="absolute top-3 right-3 bg-white/95 p-1.5 rounded-lg shadow border border-slate-200">
                      {moduleHasAccess ? (
                        <LockOpen className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Lock className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>
                  <div className="p-5">
                    {mod.yearName && (
                      <p className="text-xs font-semibold text-primary mb-1">{mod.yearName}</p>
                    )}
                    <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-1">{mod.name}</h3>
                    <p className="text-xs text-slate-500 mb-4 line-clamp-2">
                      {mod.description || 'Subjects and topics for this module.'}
                    </p>
                    {moduleHasAccess ? (
                      <Link
                        to={`/student/modules/${mod._id}`}
                        className="text-primary font-semibold text-sm inline-flex items-center gap-1 hover:underline"
                      >
                        View Sub-modules <span aria-hidden>→</span>
                      </Link>
                    ) : (
                      <Link
                        to="/packages"
                        className="text-slate-500 font-medium text-sm hover:text-primary transition-colors"
                      >
                        Unlock to access
                      </Link>
                    )}
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
            {allModules.length === 0
              ? 'No modules configured yet.'
              : user && allowedModuleIds.size === 0
                ? (
                    <>
                      You don’t have access to any modules yet.{' '}
                      <Link to="/packages" className="text-primary font-medium hover:underline">Purchase a package</Link>
                      {' '}to unlock content.
                    </>
                  )
                : 'No modules match your search or filter.'}
          </div>
        )}
      </div>
    </div>
  );
}
