import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  History,
  School,
  ArrowRight,
  BookOpen,
  FileText,
  Flame,
  Lightbulb,
  ClipboardList,
  ClipboardCheck,
  Accessibility,
  Activity,
  FlaskConical,
  Dna,
  Syringe,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { getRecentViews } from '../../utils/recentViews';

const SUBJECT_ICONS = [Accessibility, Activity, FlaskConical, Dna, Syringe, BarChart3];
const SUBJECT_COLORS = [
  { ring: 'ring-teal-500/20', accent: 'text-primary', hover: 'hover:border-primary' },
  { ring: 'ring-rose-500/20', accent: 'text-rose-600', hover: 'hover:border-rose-500' },
  { ring: 'ring-indigo-500/20', accent: 'text-indigo-600', hover: 'hover:border-indigo-500' },
  { ring: 'ring-amber-500/20', accent: 'text-amber-600', hover: 'hover:border-amber-500' },
];

const MBBS_STUDY_TIPS = [
  'Read one topic from theory, then solve 10–15 MCQs on the same topic the same day. Application cements memory.',
  'Before bed, mentally recall the day’s topics (no notes). Sleep consolidates what you actively retrieve.',
  'Use the "see one, do one, teach one" approach: watch a procedure, practice it, then explain it to a peer.',
  'Stick to one standard book per subject for first reading. Multiple sources too early cause confusion.',
  'Time your revision: 1st repeat in 24–48 hours, 2nd in a week, 3rd before exams. Spacing beats cramming.',
  'Practice writing answers under time limits. Exam speed comes from habit, not last-minute practice.',
];

const PLACEHOLDER_IMAGES = {
  module: 'https://placehold.co/800x400/0D9488/white?text=Module',
};

function getSubjectStyle(idx) {
  const icon = SUBJECT_ICONS[idx % SUBJECT_ICONS.length];
  const color = SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
  return { Icon: icon, ...color };
}

function timeAgo(ms) {
  if (!ms) return '';
  const sec = Math.floor((Date.now() - ms) / 1000);
  if (sec < 60) return 'Just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
  return 'Earlier';
}

export default function StudentResources() {
  const { user } = useAuth();
  const [years, setYears] = useState([]);
  const [modulesByYear, setModulesByYear] = useState({});
  const [subjectsByModule, setSubjectsByModule] = useState({});
  const [topicsBySubject, setTopicsBySubject] = useState({});
  const [ospesByModule, setOspesByModule] = useState({});
  const [loadingSubjects, setLoadingSubjects] = useState({});
  const [recentViews, setRecentViews] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [studyTipIndex, setStudyTipIndex] = useState(() => Math.floor(Math.random() * MBBS_STUDY_TIPS.length));
  const [expandedModules, setExpandedModules] = useState({});

  const enrolledModuleIds = useMemo(() => {
    const ids = new Set();
    if (!user?.packages?.length) return ids;
    user.packages.forEach((up) => {
      const pkg = up.package;
      if (pkg?.moduleIds?.length) {
        pkg.moduleIds.forEach((id) => {
          const idStr = typeof id === 'object' && id != null ? String(id._id || id) : String(id);
          if (idStr && idStr !== 'undefined') ids.add(idStr);
        });
      }
    });
    return ids;
  }, [user?.packages]);

  const hasModuleAccess = (moduleId) => enrolledModuleIds.has(String(moduleId));

  useEffect(() => {
    const t = setInterval(() => {
      setStudyTipIndex((i) => (i + 1) % MBBS_STUDY_TIPS.length);
    }, 6000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    api.get('/content/years').then(({ data }) => setYears(data)).catch(() => setYears([]));
  }, []);

  useEffect(() => {
    if (!years.length) return;
    years.forEach((year) => {
      api.get(`/content/years/${year._id}/modules`)
        .then(({ data }) => setModulesByYear((prev) => ({ ...prev, [year._id]: data })))
        .catch(() => {});
    });
  }, [years.length]);

  useEffect(() => {
    setRecentViews(getRecentViews());
    const handler = () => setRecentViews(getRecentViews());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const loadSubjects = async (moduleId) => {
    const id = String(moduleId);
    if (subjectsByModule[id]) return;
    setLoadingSubjects((p) => ({ ...p, [id]: true }));
    try {
      const [subRes, ospeRes] = await Promise.all([
        api.get(`/content/modules/${id}/subjects`),
        api.get(`/ospes/modules/${id}`).catch(() => ({ data: [] })),
      ]);
      const subs = Array.isArray(subRes.data) ? subRes.data : (subRes.data?.data ?? []);
      setSubjectsByModule((p) => ({ ...p, [id]: subs }));
      setOspesByModule((p) => ({ ...p, [id]: ospeRes.data ?? [] }));
      const topicPromises = subs.map((s) =>
        api.get(`/content/subjects/${s._id}/topics`).then((r) => ({
          subjectId: s._id,
          data: Array.isArray(r.data) ? r.data : (r.data?.data ?? []),
        }))
      );
      const results = await Promise.all(topicPromises);
      setTopicsBySubject((p) => {
        const next = { ...p };
        results.forEach(({ subjectId, data }) => {
          next[String(subjectId)] = data || [];
        });
        return next;
      });
    } catch (err) {
      setSubjectsByModule((p) => ({ ...p, [id]: [] }));
      setOspesByModule((p) => ({ ...p, [id]: [] }));
    } finally {
      setLoadingSubjects((p) => ({ ...p, [id]: false }));
    }
  };

  const toggleModule = (modId) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
    loadSubjects(modId);
  };

  const displayName = user?.name?.trim() || user?.email?.split('@')[0] || 'Student';
  const yearLabel = user?.academicDetails?.year ? `MS ${user.academicDetails.year}` : 'Student';
  const recentToShow = (recentViews.length > 0 ? recentViews : []).slice(0, 3);
  // derive study streak from available user fields (fallback to 0)
  const studyStreakDays = Number(user?.studyStreak ?? user?.streakDays ?? user?.profile?.streak ?? 0) || 0;
  const studyStreakGoal = 30;
  const studyStreakPct = Math.max(0, Math.min(100, Math.round((studyStreakDays / studyStreakGoal) * 100)));

  const matchSearch = (text) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (text || '').toLowerCase().includes(q);
  };

  return (
    <div className="flex flex-1 min-w-0 w-full bg-[#F8FAFC] dark:bg-[#0F172A]">
      <div className="flex-1 min-w-0 p-6 lg:p-8 overflow-y-auto custom-scrollbar">
        {/* Header */}
       

        {/* Welcome card - teal gradient like login/signup */}
        <section className="mb-8">
          <div className="rounded-2xl p-6 shadow-lg border border-white/10 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #0D5C58 0%, #1A938F 50%, #26D0CE 100%)' }}>
            <div className="absolute -top-16 -left-16 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -right-12 -bottom-12 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
            <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Welcome back, {displayName}! 👋</h1>
                <p className="text-white/90">Access your modules and continue learning.</p>
              </div>
              <img src="/stato.png" alt="" className="w-20 h-auto sm:w-24 flex-shrink-0 opacity-95 drop-shadow-lg" aria-hidden />
            </div>
          </div>
        </section>

        {/* Recently Viewed */}
        {recentToShow.length > 0 && (
          <section className="mb-10">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-white mb-4">
              <History className="w-5 h-5 text-[#0D9488]" />
              Recently Viewed
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentToShow.map((item, idx) => (
                <Link
                  key={`${item.type}-${item.id}-${idx}`}
                  to={item.url}
                  className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden group cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="h-24 w-full relative overflow-hidden bg-gradient-to-br from-[#0D9488]/20 to-[#0D9488]/5">
                    <div className="absolute inset-0 card-image-overlay" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-[#0D9488]/40" />
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{item.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.meta || 'Resource'} {item.viewedAt ? `• ${timeAgo(item.viewedAt)}` : ''}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-[#0D9488] transition-colors shrink-0 ml-2" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Medical Curriculum by Year */}
        <section className="space-y-10">
          {years.map((year) => {
            // differentiate "not loaded yet" (undefined) from "loaded but empty" ([])
            const yearModules = Object.prototype.hasOwnProperty.call(modulesByYear, year._id)
              ? modulesByYear[year._id]
              : undefined;
            const accessibleModules = (yearModules || []).filter((mod) => hasModuleAccess(mod._id));
            // hide the year only when modules are loaded and none are accessible to the user
            if (yearModules !== undefined && accessibleModules.length === 0) return null;

            return (
              <div key={year._id}>
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
                  <School className="w-5 h-5 text-[#0D9488]" />
                  Medical Curriculum {year.name}
                </h3>

                {!modulesByYear[year._id] ? (
                  <div className="bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-100 dark:border-slate-800 p-12 text-center">
                    <p className="text-slate-500 dark:text-slate-400 animate-pulse">Loading modules…</p>
                  </div>
                ) : (
                  accessibleModules
                    .filter((mod) => matchSearch(mod.name) || matchSearch(mod.description))
                    .map((mod, modIdx) => {
                      const modId = String(mod._id);
                      const isExpanded = expandedModules[modId];
                      const subjects = subjectsByModule[modId] || [];
                      const loading = loadingSubjects[modId];
                      const ospes = ospesByModule[modId] || [];
                      const moduleImage = mod.imageUrl || PLACEHOLDER_IMAGES.module;

                      return (
                        <div
                          key={mod._id}
                          className="bg-white dark:bg-[#1E293B] rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden mb-10"
                        >
                          {/* Module hero */}
                          <div className="relative h-48 group">
                            <img
                              src={moduleImage}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = PLACEHOLDER_IMAGES.module;
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 to-transparent flex flex-col justify-end p-6 lg:p-8">
                              <div className="flex justify-between items-end w-full gap-4">
                                <div>
                                  <span className="bg-[#0D9488]/90 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-2 inline-block">
                                    {year.name}
                                  </span>
                                  <h4 className="text-2xl lg:text-3xl font-bold text-white">{mod.name}</h4>
                                  <p className="text-slate-200 text-sm mt-1 line-clamp-1">
                                    {mod.description || 'Subjects and topics'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="p-6 lg:p-8">
                            <button
                              type="button"
                              onClick={() => toggleModule(modId)}
                              className="flex items-center gap-2 text-[#0D9488] font-semibold hover:underline mb-6"
                            >
                              {isExpanded ? 'Hide subjects' : 'Browse subjects & topics'}
                              <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </button>

                            {isExpanded && (
                              <div className="space-y-10">
                                {loading && (
                                  <p className="text-slate-500 dark:text-slate-400 text-sm py-8 text-center">Loading subjects and topics…</p>
                                )}
                                {!loading && subjects.length === 0 && (
                                  <p className="text-slate-500 dark:text-slate-400 text-sm py-8 text-center">No subjects in this module yet.</p>
                                )}
                                {!loading &&
                                  subjects.map((sub, subIdx) => {
                                    const topics = (topicsBySubject[String(sub._id)] || []).sort((a, b) =>
                                      (a.name || '').localeCompare(b.name || '')
                                    );
                                    const subjectStyle = getSubjectStyle(subIdx);
                                    const SubIcon = subjectStyle.Icon;
                                    const subjectUrl = `/student/modules/${mod._id}/subjects/${sub._id}`;

                                    return (
                                      <div
                                        key={sub._id}
                                        className={subIdx > 0 ? 'pt-8 border-t border-slate-100 dark:border-slate-800' : ''}
                                      >
                                    <div className="flex justify-between items-center mb-6">
                                          <Link
                                            to={subjectUrl}
                                            className="flex items-center gap-4 no-underline group hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg px-2 py-1 transition-colors"
                                          >
                                            <div className={`w-10 h-10 rounded-lg overflow-hidden ring-2 ${subjectStyle.ring} bg-white dark:bg-slate-800 flex items-center justify-center transition-transform group-hover:scale-105`}>
                                              <SubIcon className={`w-5 h-5 ${subjectStyle.accent}`} />
                                            </div>
                                            <div>
                                              <h5 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-[#0D9488]">{sub.name}</h5>
                                              <p className="text-xs text-slate-400 group-hover:text-slate-600">
                                                {topics.length} topic{topics.length !== 1 ? 's' : ''}
                                              </p>
                                            </div>
                                          </Link>
                                          <Link
                                            to={subjectUrl}
                                            className="text-sm font-semibold text-[#0D9488] hover:underline flex items-center gap-1"
                                          >
                                            View all <ArrowRight className="w-4 h-4" />
                                          </Link>
                                        </div>
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                          {topics.slice(0, 6).map((topic) => (
                                            <Link
                                              key={topic._id}
                                              to={`/student/modules/${mod._id}/subjects/${sub._id}/topics/${topic._id}`}
                                              className={`group relative bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden ${subjectStyle.hover} transition-all flex flex-col`}
                                            >
                                              <div className="h-32 relative bg-slate-100 dark:bg-slate-800">
                                                <div className="absolute inset-0 bg-gradient-to-br from-[#0D9488]/10 to-transparent group-hover:from-transparent transition-all" />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                  <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                                                </div>
                                              </div>
                                              <div className="p-5 flex-1 flex flex-col">
                                                <h6 className="font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">{topic.name}</h6>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 flex-1">
                                                  {topic.description || 'Study material for this topic.'}
                                                </p>
                                                <span className="text-[#0D9488] text-xs font-bold flex items-center gap-1 uppercase tracking-wider group-hover:gap-2 transition-all">
                                                  Open module <ChevronRight className="w-3.5 h-3.5" />
                                                </span>
                                              </div>
                                            </Link>
                                          ))}
                                        </div>
                                        {topics.length > 6 && (
                                          <div className="mt-4">
                                            <Link
                                              to={subjectUrl}
                                              className="text-sm font-semibold text-[#0D9488] hover:underline"
                                            >
                                              +{topics.length - 6} more in {sub.name}
                                            </Link>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}

                                {/* OSPE block: once per module */}
                                {!loading && ospes.length > 0 && (
                                  <div className="pt-8 mt-8 border-t border-slate-100 dark:border-slate-800">
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">OSPE Practice</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      {ospes.map((ospe) => (
                                        <Link
                                          key={ospe._id}
                                          to={`/student/ospes/${ospe._id}`}
                                          className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 hover:border-[#0D9488] transition-all"
                                        >
                                          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                            <FileText className="w-5 h-5" />
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <h6 className="font-semibold text-slate-900 dark:text-white truncate">{ospe.name}</h6>
                                            <p className="text-xs text-slate-500 truncate">{ospe.description || 'Practice exam'}</p>
                                          </div>
                                          <span className="text-xs font-bold text-[#0D9488] shrink-0">Start</span>
                                        </Link>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            );
          })}
        </section>

        {years.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-slate-500 dark:text-slate-400">No resources available.</p>
          </div>
        )}
      </div>

      {/* Right sidebar */}
      <aside className="hidden xl:flex w-80 flex-shrink-0 flex-col border-l border-slate-100 dark:border-slate-800 bg-white dark:bg-[#1E293B] p-8 overflow-y-auto custom-scrollbar">
        <div className="space-y-8">
          <div className="text-center pb-8 border-b border-slate-100 dark:border-slate-800">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 rounded-full border-4 border-[#0D9488]/20 p-1 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl font-bold text-[#0D9488] overflow-hidden">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  (displayName[0] || 'S').toUpperCase()
                )}
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{displayName}</h3>
            <p className="text-slate-500 dark:text-slate-400">Medical Student • {yearLabel}</p>
          </div>

          <div className="bg-[#0D9488]/5 dark:bg-[#0D9488]/10 p-6 rounded-3xl border border-[#0D9488]/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-[#0D9488] p-2 rounded-lg text-white">
                <Flame className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white">Study Streak</h4>
            </div>
            <div className="flex items-end gap-1 mb-4">
              <span className="text-4xl font-bold text-[#0D9488]">{studyStreakDays}</span>
              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium pb-1">Days</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mb-2 overflow-hidden">
              <div className="bg-[#0D9488] h-full" style={{ width: `${studyStreakPct}%` }} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Keep learning — {studyStreakDays}/{studyStreakGoal} days</p>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
              Upcoming
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500 uppercase tracking-widest font-bold">
                2
              </span>
            </h4>
            <div className="space-y-3">
              <Link
                to="/student/resources"
                className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center shrink-0">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div className="overflow-hidden min-w-0">
                  <p className="text-sm font-bold truncate">OSPE Practice</p>
                  <p className="text-xs text-slate-500">Complete a module</p>
                </div>
              </Link>
              <Link
                to="/student/resources"
                className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div className="overflow-hidden min-w-0">
                  <p className="text-sm font-bold truncate">Topic Quiz</p>
                  <p className="text-xs text-slate-500">From your subjects</p>
                </div>
              </Link>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-3xl border border-amber-100 dark:border-amber-900/30">
            <div className="flex items-center gap-2 mb-3 text-amber-700 dark:text-amber-500">
              <Lightbulb className="w-5 h-5" />
              <h4 className="font-bold">Study Tip</h4>
            </div>
            <p className="text-sm text-amber-800/90 dark:text-amber-200/90 leading-relaxed italic">
              &ldquo;{MBBS_STUDY_TIPS[studyTipIndex]}&rdquo;
            </p>
          </div>

          {!user?.packages?.length && (
            <div className="bg-slate-900 text-white p-5 rounded-2xl">
              <h4 className="text-sm font-bold mb-1">Pro Subscription</h4>
              <p className="text-xs text-slate-400 mb-4">Get full access to all modules and OSPE practice.</p>
              <Link
                to="/packages"
                className="block w-full py-2.5 bg-white text-slate-900 rounded-lg text-sm font-bold hover:bg-slate-100 transition-colors text-center"
              >
                SUBSCRIBE
              </Link>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
