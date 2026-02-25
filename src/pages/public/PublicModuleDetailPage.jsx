import { useEffect, useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, BookOpen, Search, ArrowRight, FlaskConical, Palette, Droplet, Activity, Dna, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

const SUBJECT_PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=200&fit=crop',
];
const OSPE_ICONS = [
  { Icon: Palette, iconClass: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
  { Icon: Droplet, iconClass: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' },
  { Icon: Activity, iconClass: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
  { Icon: FlaskConical, iconClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { Icon: Dna, iconClass: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' },
];

export default function PublicModuleDetailPage() {
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
      api.get(`/content/modules/${moduleId}/ospes`).then((r) => r.data).catch(() => []),
    ])
      .then(([mod, subs, osps]) => {
        if (cancelled) return;
        setModule(mod);
        setSubjects(subs || []);
        setOspes(Array.isArray(osps) ? osps : []);
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

  const filteredSubjects = useMemo(() => {
    const sorted = [...(subjects || [])].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    if (!subjectSearch.trim()) return sorted;
    const q = subjectSearch.trim().toLowerCase();
    return sorted.filter((s) => s.name?.toLowerCase().includes(q));
  }, [subjects, subjectSearch]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <p className="animate-pulse text-slate-500 font-medium">Loading...</p>
      </div>
    );
  }
  if (error || !module) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-slate-600 dark:text-slate-400">
        <p className="mb-4">{error || 'Module not found'}</p>
        <Link to="/modules" className="text-primary font-medium hover:underline">Back to Modules</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6 flex-wrap">
          <Link to="/modules" className="hover:text-primary transition-colors">Modules</Link>
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
          <span className="text-slate-900 dark:text-white font-medium">{module.name}</span>
        </nav>

        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 font-heading">
                {module.name}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
                {module.description || 'Explore subjects, topics, MCQs, and OSPEs. Sign in to access practice and videos.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {module.year?.name && (
                <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-semibold border border-primary/20">
                  {module.year.name}
                </span>
              )}
              {user ? (
                <Link
                  to={`/student/modules/${moduleId}`}
                  className="px-4 py-1.5 bg-primary text-white rounded-full text-sm font-semibold hover:bg-teal-700 transition-colors"
                >
                  Open in Student Panel
                </Link>
              ) : (
                <Link
                  to={`/login?redirect=${encodeURIComponent(`/student/modules/${moduleId}`)}`}
                  className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary text-white rounded-full text-sm font-semibold hover:bg-teal-700 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Sign in to access
                </Link>
              )}
            </div>
          </div>
        </div>

        <section className="mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-slate-200 dark:border-slate-700 pb-4">
            <h2 className="text-2xl font-bold flex items-center text-slate-900 dark:text-white">
              <BookOpen className="w-6 h-6 mr-2 text-primary" />
              Subjects
            </h2>
            <div className="relative w-full sm:w-72">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={subjectSearch}
                onChange={(e) => setSubjectSearch(e.target.value)}
                placeholder="Search subjects..."
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-full text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSubjects.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 col-span-full py-8">No subjects in this module.</p>
            ) : (
              filteredSubjects.map((sub, idx) => {
                const topicCount = sub.topicIds?.length ?? 0;
                const imgSrc = sub.imageUrl || module.imageUrl || SUBJECT_PLACEHOLDER_IMAGES[idx % SUBJECT_PLACEHOLDER_IMAGES.length];
                return (
                  <Link
                    key={sub._id}
                    to={`/modules/${moduleId}/subjects/${sub._id}`}
                    className="group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 hover:border-primary/30"
                  >
                    <div className="h-32 bg-slate-100 dark:bg-slate-700 relative overflow-hidden">
                      <img
                        alt=""
                        src={imgSrc}
                        className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.src = SUBJECT_PLACEHOLDER_IMAGES[0]; }}
                      />
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-bold mb-1 text-slate-900 dark:text-white">{sub.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                        {sub.description || 'View topics and content for this subject.'}
                      </p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
                          {topicCount} topic{topicCount !== 1 ? 's' : ''}
                        </span>
                        <span className="text-primary font-semibold text-sm flex items-center">
                          Explore <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-8 border-b border-slate-200 dark:border-slate-700 pb-4">
            <h2 className="text-2xl font-bold flex items-center text-slate-900 dark:text-white">
              <FlaskConical className="w-6 h-6 mr-2 text-primary" />
              OSPEs & Practical Prep
            </h2>
            {user && (
              <Link
                to={`/student/modules/${moduleId}/ospes`}
                className="text-primary font-semibold text-sm hover:underline"
              >
                Attempt in Student Panel →
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {ospes.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 col-span-full py-8">No OSPEs in this module yet.</p>
            ) : (
              ospes.map((ospe, idx) => {
                const { Icon: OspeIcon, iconClass } = OSPE_ICONS[idx % OSPE_ICONS.length];
                return (
                  <div
                    key={ospe._id}
                    className="flex items-start p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm"
                  >
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 mr-4 ${iconClass}`}>
                      <OspeIcon className="w-8 h-8" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-lg mb-1 text-slate-900 dark:text-white">{ospe.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                        {ospe.description || 'Practical preparation for OSPE assessment.'}
                      </p>
                      {user ? (
                        <Link
                          to={`/student/ospes/${ospe._id}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Attempt in Student Panel →
                        </Link>
                      ) : (
                        <Link
                          to={`/login?redirect=${encodeURIComponent(`/student/ospes/${ospe._id}`)}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                        >
                          <LogIn className="w-4 h-4" />
                          Sign in to attempt
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
