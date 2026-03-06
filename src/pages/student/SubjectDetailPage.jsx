import { useEffect, useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ChevronRight,
  Dna,
  Brain,
  GraduationCap,
  FlaskConical,
  Pill,
  Microscope,
  BarChart3,
  Video,
  HelpCircle,
  PlayCircle,
  Lock,
  Film,
  ArrowRight,
} from 'lucide-react';
import ControlledYouTubePlayer from '../../components/student/ControlledYouTubePlayer';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { useProtectedContent } from '../../hooks/useProtectedContent';
import { recordRecentView } from '../../utils/recentViews';
import { getYouTubeThumbnail } from '../../utils/youtube';

const TOPIC_PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=200&fit=crop';

const TOPIC_ICON_MAP = [
  { Icon: Dna, bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  { Icon: Brain, bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
  { Icon: GraduationCap, bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
  { Icon: FlaskConical, bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
  { Icon: Pill, bg: 'bg-rose-50 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400' },
  { Icon: Microscope, bg: 'bg-cyan-50 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400' },
  { Icon: BarChart3, bg: 'bg-indigo-50 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400' },
];

function getTopicIcon(index) {
  return TOPIC_ICON_MAP[index % TOPIC_ICON_MAP.length];
}

export default function SubjectDetailPage() {
  const { moduleId, subjectId } = useParams();
  const { user } = useAuth();
  const [subject, setSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [oneShotLectures, setOneShotLectures] = useState([]);
  const [moduleSubjects, setModuleSubjects] = useState([]);
  const [moduleName, setModuleName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [oneShotVideoPlaying, setOneShotVideoPlaying] = useState(false);
  const [firstModuleId, setFirstModuleId] = useState(null);

  useProtectedContent();

  useEffect(() => {
    let cancelled = false;
    api.get('/content/years-with-modules').then(r => {
      if (!cancelled && Array.isArray(r.data)) {
        let first = null;
        let minTime = Infinity;
        r.data.forEach(y => {
          (y.modules || []).forEach(m => {
            const t = new Date(m.createdAt || 0).getTime();
            if (t < minTime) { minTime = t; first = String(m._id); }
          });
        });
        setFirstModuleId(first);
      }
    }).catch(() => { });
    Promise.all([
      api.get(`/content/subjects/${subjectId}`).then((r) => r.data),
      api.get(`/content/subjects/${subjectId}/topics`).then((r) => r.data),
      api.get(`/content/subjects/${subjectId}/one-shot-lectures`).then((r) => r.data || []).catch(() => []),
      api.get(`/content/modules/${moduleId}/subjects`).then((r) => r.data),
      api.get(`/content/modules/${moduleId}`).then((r) => r.data).catch(() => ({ name: 'Module' })),
    ])
      .then(([sub, tops, lectures, subs, mod]) => {
        if (cancelled) return;
        setSubject(sub);
        // API may return paginated { topics, page, limit } or an array
        setTopics(Array.isArray(tops) ? tops : (Array.isArray(tops?.topics) ? tops.topics : []));
        const list = Array.isArray(lectures) ? lectures : [];
        setOneShotLectures(list);
        setSelectedLecture(list[0] || null);
        setOneShotVideoPlaying(false);
        setModuleSubjects(subs || []);
        setModuleName(mod?.name || subject?.module?.name || 'Module');
        if (sub) {
          recordRecentView({
            type: 'subject',
            id: sub._id,
            name: sub.name,
            url: `/student/modules/${moduleId}/subjects/${sub._id}`,
            meta: 'Subject',
            icon: 'view_in_ar',
            iconBg: 'bg-purple-50 dark:bg-purple-900/30',
            iconColor: 'text-purple-600',
          });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.response?.status === 404 ? 'Subject not found' : 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [subjectId, moduleId]);

  const hasModuleAccess = useMemo(() => {
    const ids = new Set();
    if (!user?.packages?.length) return false;
    user.packages.forEach((up) => {
      if (!up || up.status !== 'active') return;
      const pkg = up.package || {};
      const name = (pkg.name || '').toString();
      const planKey = pkg.planKey || '';
      const isTrialPkg = /free[-\s]?trial/i.test(name) || String(planKey) === 'free-trial';
      if (isTrialPkg) return; // Exclude free trial from FULL module access

      if (pkg?.moduleIds?.length) {
        pkg.moduleIds.forEach((id) => {
          const idStr = typeof id === 'object' && id != null ? String(id._id || id) : String(id);
          if (idStr && idStr !== 'undefined') ids.add(idStr);
        });
      }
    });
    return ids.has(String(moduleId));
  }, [user?.packages, moduleId]);

  const hasActiveFreeTrial = useMemo(() => {
    if (!user?.packages?.length) return false;
    const now = Date.now();
    return user.packages.some((up) => {
      if (!up || up.status !== 'active') return false;
      const pkg = up.package || {};
      const name = (pkg.name || '').toString();
      const planKey = pkg.planKey || '';
      // expiry check on user-package if available
      if (up.expiresAt && new Date(up.expiresAt).getTime() <= now) return false;
      return /free[-\s]?trial/i.test(name) || String(planKey) === 'free-trial';
    });
  }, [user?.packages]);

  const sortedTopics = useMemo(() => {
    return [...(topics || [])].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [topics]);

  const firstTopic = useMemo(() => {
    if (!topics || topics.length === 0) return null;
    return topics.reduce((min, t) => {
      if (!t) return min;
      if (!min) return t;
      return new Date(t.createdAt) < new Date(min.createdAt) ? t : min;
    }, null);
  }, [topics]);

  const sortedModuleSubjects = useMemo(() => {
    return [...moduleSubjects].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [moduleSubjects]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <p className="animate-pulse text-slate-500 font-medium">Loading...</p>
      </div>
    );
  }
  if (error || !subject) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-slate-600 dark:text-slate-400">
        <p className="mb-4">{error || 'Subject not found'}</p>
        <Link to={`/student/modules/${moduleId}`} className="text-primary font-medium hover:underline">
          Back to Module
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100">
      <div className="p-8 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6 flex-wrap">
          <Link to="/student/resources" className="hover:text-primary transition-colors">Modules</Link>
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
          <Link to={`/student/modules/${moduleId}`} className="hover:text-primary transition-colors">
            {moduleName}
          </Link>
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
          <span className="text-slate-900 dark:text-white font-medium">{subject.name}</span>
        </nav>

        {/* Hero card - same background & layout as Dashboard "Welcome back" */}
        <div className="mb-10 rounded-2xl p-8 shadow-lg border border-white/30 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #0D5C58 0%, #1A938F 50%, #26D0CE 100%)' }}>
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" aria-hidden />
          <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-white/5 rounded-full blur-2xl" aria-hidden />
          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2 font-heading">
                {subject.name}: Topic List
              </h1>
              <p className="text-white/90 text-lg">
                Master the fundamentals through our curriculum of high-yield lecture series and interactive practice
                assessments designed for medical professionals.
              </p>
              <p className="mt-3 text-white/80 text-sm font-medium">
                Total Topics: <span className="font-bold text-white">{sortedTopics.length}</span>
              </p>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">

              <img src="/stato.png" alt="" className="w-24 h-auto sm:w-28 opacity-95 drop-shadow-lg" aria-hidden />
            </div>
          </div>
        </div>

        {/* Subject pills */}
        <div className="flex items-center gap-3 mb-10 overflow-x-auto pb-2 scrollbar-hide">
          {sortedModuleSubjects.map((s) => {
            const isActive = s._id === subjectId;
            return (
              <Link
                key={s._id}
                to={`/student/modules/${moduleId}/subjects/${s._id}`}
                className={`shrink-0 px-6 py-2.5 rounded-full font-medium transition-all active:scale-95 ${isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
              >
                {s.name}
              </Link>
            );
          })}
        </div>

        {/* Topic grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {sortedTopics.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 dark:text-slate-400">
              No topics in this subject yet.
            </div>
          ) : (
            sortedTopics.map((topic) => {
              const topicIdShort = String(topic._id).slice(-6).toUpperCase();
              const progressPercent = topic.progressPercent ?? 0;
              const isFirstTopic = firstTopic && String(firstTopic._id) === String(topic._id);
              const accessible = hasModuleAccess || (hasActiveFreeTrial && isFirstTopic && String(moduleId) === firstModuleId);
              const topicImageUrl = topic.imageUrl || TOPIC_PLACEHOLDER_IMAGE;

              return (
                <div
                  key={topic._id}
                  className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-200 dark:border-slate-700 flex flex-col h-full"
                >
                  <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-700/50 relative overflow-hidden">
                    <img
                      src={topicImageUrl}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = TOPIC_PLACEHOLDER_IMAGE;
                      }}
                    />
                    <span className="absolute top-2 right-2 text-xs font-mono text-slate-500 bg-white/90 dark:bg-slate-800/90 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                      ID: {topicIdShort}
                    </span>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-primary transition-colors">
                      {topic.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 flex-1 line-clamp-2">
                      {topic.content?.replace(/<[^>]*>/g, '').slice(0, 100) ||
                        `Study ${topic.name} with MCQs and explanatory video.`}
                      {(topic.content?.length || 0) > 100 ? '…' : ''}
                    </p>
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                        <span className="text-slate-500 dark:text-slate-400">Progress</span>
                        <span className="text-primary">{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${progressPercent}%`,
                            boxShadow: '0 0 10px rgba(6, 146, 133, 0.4)',
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Link
                        to={
                          accessible
                            ? `/student/modules/${moduleId}/subjects/${subjectId}/topics/${topic._id}/quiz`
                            : '#'
                        }
                        onClick={(e) => !accessible && e.preventDefault()}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-colors ${accessible
                            ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                          }`}
                      >
                        <HelpCircle className="w-5 h-5" />
                        MCQs
                      </Link>
                      <Link
                        to={
                          accessible
                            ? `/student/modules/${moduleId}/subjects/${subjectId}/topics/${topic._id}`
                            : '#'
                        }
                        onClick={(e) => !accessible && e.preventDefault()}
                        className={`flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${accessible
                            ? 'bg-primary text-white hover:bg-teal-700 shadow-lg shadow-primary/20'
                            : 'bg-slate-200 dark:bg-slate-600 text-slate-500 cursor-not-allowed'
                          }`}
                      >
                        <PlayCircle className="w-5 h-5" />
                        Explanatory Video
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* One Shot Lectures */}
        <section className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                <Video className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold font-heading">One Shot Lectures</h2>
            </div>
          </div>

          {!hasModuleAccess ? (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-3xl p-8 text-center">
              <Lock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Unlock with a package</h4>
              <p className="text-slate-600 dark:text-slate-400 mb-4 max-w-sm mx-auto">
                Purchase a package to access One Shot lectures for this subject.
              </p>
              <Link
                to="/packages"
                className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
              >
                View packages
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : oneShotLectures.length === 0 ? (
            <div className="bg-white dark:bg-slate-800/50 rounded-3xl p-12 border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <Film className="w-10 h-10 text-slate-300 dark:text-slate-500" />
              </div>
              <h4 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">No One Shot Lectures Found</h4>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                There are currently no &quot;One Shot&quot; comprehensive review lectures available for this module.
                Check back soon!
              </p>
            </div>
          ) : (
            <>
              {/* Inline embedded player - same style as topic page */}
              <div
                className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative group select-none"
                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
              >
                {oneShotVideoPlaying && selectedLecture ? (
                  <ControlledYouTubePlayer
                    youtubeUrl={selectedLecture.youtubeUrl}
                    title={selectedLecture.title}
                    className="absolute inset-0 w-full h-full rounded-2xl"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img
                      alt={selectedLecture?.title || 'One Shot Lecture'}
                      className="w-full h-full object-cover opacity-60"
                      src={getYouTubeThumbnail(selectedLecture?.youtubeUrl) || 'logo.png'}
                      onError={(e) => { e.target.src = 'logo.png'; }}
                    />
                    <button
                      type="button"
                      onClick={() => setOneShotVideoPlaying(true)}
                      className="absolute w-20 h-20 bg-primary/90 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 transition-transform cursor-pointer"
                      aria-label="Play One Shot Lecture"
                    >
                      <PlayCircle className="w-10 h-10" />
                    </button>
                  </div>
                )}
              </div>
              {selectedLecture && (
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{selectedLecture.title}</h3>
              )}
              {/* Switch lecture if multiple */}
              {oneShotLectures.length > 1 && (
                <ul className="mt-6 space-y-2">
                  {oneShotLectures.map((lecture) => (
                    <li key={lecture._id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLecture(lecture);
                          setOneShotVideoPlaying(false);
                        }}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all group text-left ${selectedLecture?._id === lecture._id
                            ? 'bg-primary/10 dark:bg-primary/20 border-primary/30'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary/30'
                          }`}
                      >
                        <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 text-red-600 dark:text-red-400">
                          <Video className="w-6 h-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 dark:text-white">{lecture.title}</p>
                        </div>
                        <PlayCircle className="w-5 h-5 text-slate-400 flex-shrink-0 group-hover:text-primary transition-colors" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>

        {!hasModuleAccess && sortedTopics.length > 0 && (
          <div className="mt-12 p-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-3xl text-center">
            <Lock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <p className="font-bold text-slate-900 dark:text-white mb-1">Unlock with Premium Package</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Purchase a package to access all topics, MCQs, and explanatory videos.
            </p>
            <Link
              to="/packages"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
            >
              View Packages
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
