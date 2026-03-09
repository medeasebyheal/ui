import { useEffect, useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, BookOpen, Search, Lock, LockOpen, ArrowRight, FlaskConical, Palette, Droplet, Activity, Dna } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { recordRecentView } from '../../utils/recentViews';

const SUBJECT_PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=200&fit=crop',
];
const OSPE_ICONS = [
  { Icon: Palette, iconClass: 'bg-indigo-50 text-indigo-600' },
  { Icon: Droplet, iconClass: 'bg-rose-50 text-rose-600' },
  { Icon: Activity, iconClass: 'bg-amber-50 text-amber-600' },
  { Icon: FlaskConical, iconClass: 'bg-emerald-50 text-emerald-600' },
  { Icon: Dna, iconClass: 'bg-violet-50 text-violet-600' },
];

export default function ModuleDetailPage() {
  const { moduleId } = useParams();
  const { user } = useAuth();
  const [module, setModule] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [ospes, setOspes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subjectSearch, setSubjectSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get(`/content/modules/${moduleId}`).then((r) => r.data),
      api.get(`/content/modules/${moduleId}/subjects`).then((r) => r.data),
      api.get(`/ospes/modules/${moduleId}`).then((r) => r.data).catch(() => []),
    ])
      .then(([mod, subs, osps]) => {
        if (cancelled) return;
        setModule(mod);
        setSubjects(subs || []);
        setOspes(osps || []);
        if (mod) {
          recordRecentView({
            type: 'module',
            id: mod._id,
            name: mod.name,
            url: `/student/modules/${mod._id}`,
            meta: mod.year?.name || 'Module',
            icon: 'school',
            iconBg: 'bg-primary/10',
            iconColor: 'text-primary',
          });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.response?.status === 404 ? 'Module not found' : 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [moduleId]);

  const hasModuleAccess = useMemo(() => {
    const ids = new Set();
    if (!user?.packages?.length) return false;
    user.packages.forEach((up) => {
      const pkg = up.package;
      if (pkg?.moduleIds?.length) {
        pkg.moduleIds.forEach((id) => {
          const idStr = typeof id === 'object' && id != null ? String(id._id || id) : String(id);
          if (idStr && idStr !== 'undefined') ids.add(idStr);
        });
      }
    });
    return ids.has(String(moduleId));
  }, [user?.packages, moduleId]);

  const filteredSubjects = useMemo(() => {
    const sorted = [...(subjects || [])].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    if (!subjectSearch.trim()) return sorted;
    const q = subjectSearch.trim().toLowerCase();
    return sorted.filter((s) => s.name?.toLowerCase().includes(q));
  }, [subjects, subjectSearch]);

  const sortedOspes = useMemo(
    () => [...(ospes || [])].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)),
    [ospes]
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <p className="animate-pulse text-slate-500 font-medium">Loading...</p>
      </div>
    );
  }
  if (error || !module) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-slate-600">
        <p className="mb-4">{error || 'Module not found'}</p>
        <Link to="/modules" className="text-primary font-medium hover:underline">
          Back to Modules
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex text-sm text-slate-500 mb-4">
          <ol className="flex items-center space-x-2">
            <li>
              <Link to="/modules" className="hover:text-primary">
                Modules
              </Link>
            </li>
            <li>
              <ChevronRight className="w-3 h-3 inline-block" />
            </li>
            <li>
              <span className="text-slate-900 font-medium">{module.name}</span>
            </li>
          </ol>
        </nav>

        {/* Module Header - styled card like subject page */}
        <div className="mb-12 rounded-2xl p-8 shadow-lg border border-white/30 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #0D5C58 0%, #1A938F 50%, #26D0CE 100%)' }}>
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" aria-hidden />
          <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-white/5 rounded-full blur-2xl" aria-hidden />
          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2 font-heading">
                {module.name}
              </h1>
              <p className="text-white/90 text-lg max-w-2xl">
                {module.description || 'Explore subjects, topics, and practice MCQs to master this module.'}
              </p>
              <p className="mt-3 text-white/80 text-sm font-medium">
                Total Subjects: <span className="font-bold text-white">{subjects.length}</span>
              </p>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
             
                <img src="/stato.png" alt="MedEase" className="w-28 h-auto rounded-2xl opacity-95 drop-shadow-lg" aria-hidden />
            
            </div>
          </div>
        </div>

        {/* Module Subjects */}
        <section className="mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-slate-200 pb-4">
            <h2 className="text-2xl font-bold flex items-center text-slate-900">
              <BookOpen className="w-6 h-6 mr-2 text-primary" />
              Module Subjects
            </h2>
            <div className="relative w-full sm:w-72">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={subjectSearch}
                onChange={(e) => setSubjectSearch(e.target.value)}
                placeholder="Search subjects..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-full text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSubjects.length === 0 ? (
              <p className="text-slate-500 col-span-full py-8">
                No subjects match your search.
              </p>
            ) : (
              filteredSubjects.map((sub, idx) => {
                const topicCount = sub.topicIds?.length ?? 0;
                const accessible = hasModuleAccess;
                const imgSrc =
                  sub.imageUrl ||
                  module.imageUrl ||
                  SUBJECT_PLACEHOLDER_IMAGES[idx % SUBJECT_PLACEHOLDER_IMAGES.length];
                const Wrapper = accessible ? Link : 'div';
                const wrapperProps = accessible
                  ? { to: `/student/modules/${moduleId}/subjects/${sub._id}` }
                  : {};

                return (
                  <Wrapper
                    key={sub._id}
                    {...wrapperProps}
                    className={`group relative bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all duration-300 ${
                      accessible
                        ? 'hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 cursor-pointer hover:border-primary/30'
                        : 'grayscale opacity-90 cursor-default'
                    }`}
                  >
                    <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                      <img
                        alt={sub.name}
                        src={imgSrc}
                        className={`w-full h-full object-cover transition-transform duration-500 ${
                          accessible ? 'group-hover:scale-105' : ''
                        }`}
                        onError={(e) => {
                          e.target.src = SUBJECT_PLACEHOLDER_IMAGES[0];
                        }}
                      />
                      <div className="absolute top-3 right-3 bg-white/95 p-1.5 rounded-lg shadow-sm border border-slate-200">
                        {accessible ? (
                          <LockOpen className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Lock className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-slate-900 mb-1">{sub.name}</h3>
                     
                      {accessible ? (
                        <span className="text-primary font-semibold text-sm inline-flex items-center gap-1">
                          Explore <ArrowRight className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium text-sm">Locked</span>
                      )}
                    </div>
                  </Wrapper>
                );
              })
            )}
          </div>
        </section>

        {/* OSPEs & Practical Prep */}
        <section>
          <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
            <h2 className="text-2xl font-bold flex items-center text-slate-900">
              <FlaskConical className="w-6 h-6 mr-2 text-primary" />
              OSPEs & Practical Prep
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedOspes.length === 0 ? (
              <p className="text-slate-500 col-span-full py-8">
                No OSPEs in this module yet.
              </p>
            ) : (
              sortedOspes.map((ospe, idx) => {
                const { Icon: OspeIcon, iconClass } = OSPE_ICONS[idx % OSPE_ICONS.length];
                const accessible = hasModuleAccess;

                return (
                  <Link
                    key={ospe._id}
                    to={accessible ? `/student/ospes/${ospe._id}` : '#'}
                    onClick={(e) => !accessible && e.preventDefault()}
                    className={`flex items-start p-6 bg-white border border-primary/20 rounded-2xl transition-colors shadow-sm ${
                      accessible
                        ? 'hover:border-primary/50 hover:shadow-primary/10 cursor-pointer'
                        : 'opacity-75 cursor-default pointer-events-none'
                    }`}
                  >
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 mr-4 ${iconClass}`}
                    >
                      <OspeIcon className="w-8 h-8" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-lg mb-1 text-slate-900">{ospe.name}</h3>
                      <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                        {ospe.description ||
                          'Practical preparation with stations and questions for OSPE assessment.'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {ospe.stations?.length > 0 && (
                          <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                            {ospe.stations.length} Station{ospe.stations.length !== 1 ? 's' : ''}
                          </span>
                        )}
                        {accessible ? (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-medium">
                            Practice
                          </span>
                        ) : (
                          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">
                            Locked
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
