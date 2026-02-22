import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { getRecentViews } from '../../utils/recentViews';

const MODULE_ICONS = [
  { icon: 'school', bg: 'bg-primary/10', text: 'text-primary', progress: 'bg-primary' },
  { icon: 'opacity', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-500', progress: 'bg-red-400' },
  { icon: 'air', bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-500', progress: 'bg-indigo-400' },
  { icon: 'favorite', bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-500', progress: 'bg-rose-400' },
  { icon: 'psychology', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-500', progress: 'bg-amber-400' },
  { icon: 'biotech', bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-500', progress: 'bg-violet-400' },
];

const SUBJECT_ICONS = ['accessibility_new', 'monitor_heart', 'science', 'biotech', 'vaccines', 'analytics'];
const RECENT_ICONS = ['psychology', 'receipt_long', 'view_in_ar'];

function getModuleStyle(idx) {
  return MODULE_ICONS[idx % MODULE_ICONS.length];
}

function getSubjectIcon(idx) {
  return SUBJECT_ICONS[idx % SUBJECT_ICONS.length];
}

export default function StudentResources() {
  const { user } = useAuth();
  const [years, setYears] = useState([]);
  const [modulesByYear, setModulesByYear] = useState({});
  const [subjectsByModule, setSubjectsByModule] = useState({});
  const [topicsBySubject, setTopicsBySubject] = useState({});
  const [ospesByModule, setOspesByModule] = useState({});
  const [expanded, setExpanded] = useState({});
  const [recentViews, setRecentViews] = useState([]);
  const [syncing, setSyncing] = useState(false);

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
    api.get('/content/years').then(({ data }) => setYears(data)).catch(() => setYears([]));
  }, []);

  useEffect(() => {
    if (years.length === 0) return;
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

  const loadModules = async (yearId) => {
    if (modulesByYear[yearId]) return;
    const { data } = await api.get(`/content/years/${yearId}/modules`);
    setModulesByYear((p) => ({ ...p, [yearId]: data }));
  };

  const loadSubjects = async (moduleId) => {
    if (subjectsByModule[moduleId]) return;
    const [subRes, ospeRes] = await Promise.all([
      api.get(`/content/modules/${moduleId}/subjects`),
      api.get(`/ospes/modules/${moduleId}`).catch(() => ({ data: [] })),
    ]);
    const subs = subRes.data || [];
    setSubjectsByModule((p) => ({ ...p, [moduleId]: subs }));
    setOspesByModule((p) => ({ ...p, [moduleId]: ospeRes.data }));
    const topicPromises = subs.map((s) =>
      api.get(`/content/subjects/${s._id}/topics`).then((r) => ({ subjectId: s._id, data: r.data }))
    );
    const results = await Promise.all(topicPromises);
    setTopicsBySubject((p) => {
      const next = { ...p };
      results.forEach(({ subjectId, data }) => {
        next[subjectId] = data || [];
      });
      return next;
    });
  };

  const toggle = (key) => setExpanded((e) => ({ ...e, [key]: !e[key] }));

  const handleSyncProgress = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 1500);
  };

  const fallbackRecentItems = useMemo(() => {
    const items = [];
    for (const year of years) {
      const mods = modulesByYear[year._id] || [];
      for (const mod of mods) {
        const subs = subjectsByModule[mod._id] || [];
        for (const sub of subs) {
          const tops = topicsBySubject[sub._id] || [];
          for (const t of tops.slice(0, 1)) {
            items.push({
              type: 'topic',
              id: t._id,
              name: t.name,
              url: `/student/modules/${mod._id}/subjects/${sub._id}/topics/${t._id}`,
              meta: sub.name,
              icon: RECENT_ICONS[items.length % RECENT_ICONS.length],
              iconBg: 'bg-teal-50 dark:bg-teal-900/30',
              iconColor: 'text-primary',
            });
            if (items.length >= 3) return items;
          }
        }
        const ospes = ospesByModule[mod._id] || [];
        for (const o of ospes.slice(0, 1)) {
          items.push({
            type: 'ospe',
            id: o._id,
            name: o.name,
            url: `/student/ospes/${o._id}`,
            meta: 'Practice Exam',
            icon: 'receipt_long',
            iconBg: 'bg-blue-50 dark:bg-blue-900/30',
            iconColor: 'text-blue-600',
          });
          if (items.length >= 3) return items;
        }
      }
    }
    return items;
  }, [years, modulesByYear, subjectsByModule, topicsBySubject, ospesByModule]);

  const displayRecent = recentViews.length > 0 ? recentViews : fallbackRecentItems;
  const recentToShow = displayRecent.slice(0, 3);

  return (
    <div className="flex flex-1 min-w-0 w-full">
      <div className="flex-1 min-w-0 max-w-6xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">My Resources</h1>
            <p className="text-slate-500 text-sm">Explore your medical curriculum modules and materials.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="px-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">filter_list</span>
              Filter
            </button>
            <button
              type="button"
              onClick={handleSyncProgress}
              disabled={syncing}
              className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70"
            >
              <span className={`material-symbols-outlined text-sm ${syncing ? 'animate-spin' : ''}`}>sync</span>
              {syncing ? 'Syncing...' : 'Sync Progress'}
            </button>
          </div>
        </div>

        {recentToShow.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Recently Viewed</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentToShow.map((item, idx) => (
                <Link
                  key={`${item.type}-${item.id}-${idx}`}
                  to={item.url}
                  className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4 hover:border-primary transition-all cursor-pointer group"
                >
                  <div
                    className={`w-12 h-12 ${item.iconBg || 'bg-teal-50 dark:bg-teal-900/30'} rounded-lg flex items-center justify-center ${item.iconColor || 'text-primary'}`}
                  >
                    <span className="material-symbols-outlined">{item.icon || 'menu_book'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold group-hover:text-primary transition-colors truncate">{item.name}</h3>
                    <p className="text-xs text-slate-500 truncate">{item.meta || 'Resource'}</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-300 flex-shrink-0">chevron_right</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          {years.map((year) => (
            <div key={year._id}>
              <div className="flex items-center justify-between mb-2" onClick={() => loadModules(year._id)}>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Medical Curriculum {year.name}
                </h2>
              </div>
              {modulesByYear[year._id] ? (
                (modulesByYear[year._id] || []).map((mod, modIdx) => {
                  const isExpanded = expanded[`m-${mod._id}`];
                  const hasAccess = hasModuleAccess(mod._id);
                  const subjects = subjectsByModule[mod._id] || [];
                  const ospes = ospesByModule[mod._id] || [];
                  const style = getModuleStyle(modIdx);
                  const totalTopics = subjects.reduce((acc, s) => acc + (topicsBySubject[s._id]?.length || 0), 0);
                  const progress = totalTopics > 0 ? Math.min(65, Math.round((modIdx / Math.max(modulesByYear[year._id].length, 1)) * 100)) : 0;

                  return (
                    <div
                      key={mod._id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm mb-4"
                    >
                      <div
                        className="p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-200 dark:border-slate-800"
                        onClick={() => {
                          toggle(`m-${mod._id}`);
                          loadSubjects(mod._id);
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 ${style.bg} rounded-xl flex items-center justify-center ${style.text}`}>
                            <span className="material-symbols-outlined">{style.icon}</span>
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">{mod.name}</h3>
                            <div className="flex items-center gap-4 mt-1 flex-wrap">
                              <div className="flex items-center gap-1.5">
                                <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className={`${style.progress} h-full`}
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span className="text-[11px] font-bold text-primary">{progress}% Complete</span>
                              </div>
                              <span className="text-[11px] text-slate-400">• {totalTopics} Lessons</span>
                              <span className="text-[11px] text-slate-400">• {ospes.length} Resource{ospes.length !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-slate-400">
                          {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                      </div>

                      {isExpanded && (
                        <div className="p-6 space-y-8 bg-slate-50/50 dark:bg-slate-800/30">
                          {subjects.map((sub, subIdx) => {
                            const topics = (topicsBySubject[sub._id] || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                            const subIcon = getSubjectIcon(subIdx);

                            return (
                              <div key={sub._id}>
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-2">
                                    <span className={`material-symbols-outlined text-primary/80 text-lg`}>{subIcon}</span>
                                    <h4 className="font-semibold text-slate-700 dark:text-slate-300">{sub.name}</h4>
                                  </div>
                                  <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">
                                    {topics.length} Topic{topics.length !== 1 ? 's' : ''}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-7 border-l-2 border-slate-100 dark:border-slate-800 ml-2">
                                  {topics.map((topic, topicIdx) => {
                                    const accessible = hasAccess;
                                    const status = topicIdx === 0 ? 'completed' : topicIdx === 1 ? 'in_progress' : 'locked';
                                    const Wrapper = accessible && status !== 'locked' ? Link : 'div';
                                    const wrapperProps =
                                      accessible && status !== 'locked'
                                        ? { to: `/student/modules/${mod._id}/subjects/${sub._id}/topics/${topic._id}` }
                                        : {};

                                    return (
                                      <Wrapper
                                        key={topic._id}
                                        {...wrapperProps}
                                        className={`p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 hover:shadow-md transition-shadow group cursor-pointer ${
                                          status === 'in_progress' ? 'border-l-primary border-l-4' : ''
                                        } ${status === 'locked' ? 'opacity-70' : ''}`}
                                      >
                                        <span
                                          className={`material-symbols-outlined text-xl mb-3 ${
                                            status === 'locked' ? 'text-slate-400' : 'text-primary'
                                          }`}
                                        >
                                          {status === 'locked' ? 'lock' : 'menu_book'}
                                        </span>
                                        <h5
                                          className={`text-sm font-semibold mb-1 ${
                                            status !== 'locked' ? 'group-hover:text-primary transition-colors' : ''
                                          }`}
                                        >
                                          {topic.name}
                                        </h5>
                                        <p className="text-[11px] text-slate-500 mb-4 line-clamp-2">
                                          {topic.description || 'Study material for this topic.'}
                                        </p>
                                        <span
                                          className={`inline-flex items-center text-[11px] font-bold uppercase gap-1 ${
                                            status === 'completed'
                                              ? 'text-primary'
                                              : status === 'in_progress'
                                                ? 'text-slate-400'
                                                : 'text-slate-400'
                                          }`}
                                        >
                                          {status === 'completed' && (
                                            <>
                                              <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                              Completed
                                            </>
                                          )}
                                          {status === 'in_progress' && (
                                            <>
                                              <span className="material-symbols-outlined text-[14px]">play_circle</span>
                                              In Progress
                                            </>
                                          )}
                                          {status === 'locked' && 'Locked'}
                                        </span>
                                      </Wrapper>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}

                          {ospes.length > 0 && (
                            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                              {ospes.map((ospe) => (
                                <div
                                  key={ospe._id}
                                  className="flex items-center justify-between py-4 first:pt-0"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600">
                                      <span className="material-symbols-outlined">description</span>
                                    </div>
                                    <div>
                                      <h5 className="text-sm font-semibold text-slate-900 dark:text-white">{ospe.name}</h5>
                                      <p className="text-xs text-slate-500">
                                        {ospe.description || 'Objective Structured Practical Examination'}
                                      </p>
                                    </div>
                                  </div>
                                  {hasAccess ? (
                                    <Link
                                      to={`/student/ospes/${ospe._id}`}
                                      className="px-4 py-2 text-xs font-bold border border-blue-200 dark:border-blue-900 text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                    >
                                      START PRACTICE
                                    </Link>
                                  ) : (
                                    <span className="text-xs text-slate-400 font-medium">Locked</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm p-8">
                  <p className="text-slate-500 text-center animate-pulse">Loading modules for {year.name}...</p>
                </div>
              )}
            </div>
          ))}
        </section>

        {years.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-slate-500">No resources available.</p>
          </div>
        )}
      </div>

      <aside className="hidden xl:flex w-72 flex-shrink-0 flex-col p-6 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-6">Upcoming Milestones</h2>
        <div className="space-y-6">
          <div className="relative pl-6 pb-6 border-l-2 border-slate-100 dark:border-slate-800">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-white dark:border-slate-900" />
            <p className="text-[10px] font-bold text-primary uppercase mb-1">Next up</p>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Continue Learning</h4>
            <p className="text-xs text-slate-500 mt-1">Pick up where you left off from your curriculum.</p>
          </div>
          <div className="relative pl-6 pb-6 border-l-2 border-slate-100 dark:border-slate-800">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-300 border-4 border-white dark:border-slate-900" />
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">OSPE Practice</p>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Practice Exams</h4>
            <p className="text-xs text-slate-500 mt-1">Complete OSPE modules to prepare for assessments.</p>
          </div>
          <div className="relative pl-6 pb-2 border-l-2 border-slate-100 dark:border-slate-800">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-300 border-4 border-white dark:border-slate-900" />
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Stay consistent</p>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Study Streak</h4>
            <p className="text-xs text-slate-500 mt-1">Review topics regularly for better retention.</p>
          </div>
        </div>

        <div className="mt-10 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-100 dark:border-teal-900/30">
          <h4 className="text-sm font-bold text-primary mb-2">Study Tip</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Try &quot;Spaced Repetition&quot; with the OSPE resources. Reviewing materials 24 hours after your first lesson improves retention by 40%.
          </p>
          <a href="/packages" className="mt-3 text-xs font-bold text-primary hover:underline inline-block">
            LEARN MORE
          </a>
        </div>

        <div className="mt-auto pt-10">
          <div className="bg-slate-900 text-white p-5 rounded-2xl relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="text-sm font-bold mb-1">Premium Access</h4>
              <p className="text-[11px] text-slate-400 mb-4">Unlock 3D anatomy models and 500+ mock questions.</p>
              <Link
                to="/packages"
                className="block w-full py-2 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors text-center"
              >
                UPGRADE NOW
              </Link>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
          </div>
        </div>
      </aside>
    </div>
  );
}
