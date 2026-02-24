import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Droplet, Wind, Heart, Brain, Dna, Accessibility, Activity, FlaskConical, Syringe, BarChart3, BookOpen, ChevronRight, ChevronDown, ChevronUp, Lock, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { getRecentViews } from '../../utils/recentViews';

const MODULE_ICONS = [
  { Icon: GraduationCap, bg: 'bg-primary/10', text: 'text-primary' },
  { Icon: Droplet, bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-500' },
  { Icon: Wind, bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-500' },
  { Icon: Heart, bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-500' },
  { Icon: Brain, bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-500' },
  { Icon: Dna, bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-500' },
];

const SUBJECT_ICONS = [Accessibility, Activity, FlaskConical, Dna, Syringe, BarChart3];

function getSubjectIconComponent(idx) {
  return SUBJECT_ICONS[idx % SUBJECT_ICONS.length];
}

const MBBS_STUDY_TIPS = [
  'Read one topic from theory, then solve 10–15 MCQs on the same topic the same day. Application cements memory.',
  'Before bed, mentally recall the day’s topics (no notes). Sleep consolidates what you actively retrieve.',
  'Use the “see one, do one, teach one” approach: watch a procedure, practice it, then explain it to a peer.',
  'Stick to one standard book per subject for first reading. Multiple sources too early cause confusion.',
  'Clinical postings: write 2–3 case summaries daily. History, examination, and differentials improve with practice.',
  'Revise anatomy with diagrams and cadaver correlation. Spatial memory is stronger than text-only learning.',
  'Group study works best for viva: one asks, others answer. Rotate subjects so everyone gets questioned.',
  'Time your revision: 1st repeat in 24–48 hours, 2nd in a week, 3rd before exams. Spacing beats cramming.',
  'For pharmacology, learn one drug per class (prototype), then compare others. Reduces overload.',
  'Practice writing answers under time limits. Exam speed comes from habit, not last-minute practice.',
];

function getModuleStyle(idx) {
  return MODULE_ICONS[idx % MODULE_ICONS.length];
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
  const [studyTipIndex, setStudyTipIndex] = useState(() =>
    Math.floor(Math.random() * MBBS_STUDY_TIPS.length)
  );

  useEffect(() => {
    const t = setInterval(() => {
      setStudyTipIndex((prev) => {
        if (MBBS_STUDY_TIPS.length <= 1) return prev;
        let next = Math.floor(Math.random() * MBBS_STUDY_TIPS.length);
        while (next === prev) next = Math.floor(Math.random() * MBBS_STUDY_TIPS.length);
        return next;
      });
    }, 6000);
    return () => clearInterval(t);
  }, []);

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">My Resources</h1>
          <p className="text-slate-500 text-sm">Explore your medical curriculum modules and materials.</p>
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
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold group-hover:text-primary transition-colors truncate">{item.name}</h3>
                    <p className="text-xs text-slate-500 truncate">{item.meta || 'Resource'}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          {years.map((year) => (
            <div key={year._id}>
              <div className="flex items-center justify-between mb-2" onClick={() => loadModules(year._id)}>
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
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
                  const ModuleIcon = style.Icon;
                  const totalTopics = subjects.reduce((acc, s) => acc + (topicsBySubject[s._id]?.length || 0), 0);

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
                            <ModuleIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">{mod.name}</h3>
                            <div className="flex items-center gap-4 mt-1 flex-wrap">
                              <span className="text-[11px] text-slate-400">• {totalTopics} Lessons</span>
                              <span className="text-[11px] text-slate-400">• {ospes.length} Resource{ospes.length !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </div>

                      {isExpanded && (
                        <div className="p-6 space-y-8 bg-slate-50/50 dark:bg-slate-800/30">
                          {subjects.map((sub, subIdx) => {
                            const topics = (topicsBySubject[sub._id] || []).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                            const SubIcon = getSubjectIconComponent(subIdx);
                            const subjectUrl = `/student/modules/${mod._id}/subjects/${sub._id}`;

                            return (
                              <div key={sub._id}>
                                <Link
                                  to={subjectUrl}
                                  className="flex items-center justify-between mb-4 group/subject cursor-pointer rounded-lg -mx-2 px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <SubIcon className="w-5 h-5 text-primary/80 group-hover/subject:text-primary transition-colors" />
                                    <h4 className="font-semibold text-slate-700 dark:text-slate-300 group-hover/subject:text-primary transition-colors">{sub.name}</h4>
                                  </div>
                                  <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500 flex items-center gap-1">
                                    {topics.length} Topic{topics.length !== 1 ? 's' : ''}
                                    <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                                  </span>
                                </Link>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-7 border-l-2 border-slate-100 dark:border-slate-800 ml-2">
                                  {topics.map((topic) => {
                                    const accessible = hasAccess;
                                    const Wrapper = accessible ? Link : 'div';
                                    const wrapperProps = accessible
                                      ? { to: `/student/modules/${mod._id}/subjects/${sub._id}/topics/${topic._id}` }
                                      : {};

                                    return (
                                      <Wrapper
                                        key={topic._id}
                                        {...wrapperProps}
                                        className={`p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 hover:shadow-md transition-shadow group cursor-pointer ${!accessible ? 'opacity-70' : ''}`}
                                      >
                                        {accessible ? (
                                          <BookOpen className="w-5 h-5 mb-3 text-primary" />
                                        ) : (
                                          <Lock className="w-5 h-5 mb-3 text-slate-400" />
                                        )}
                                        <h5 className={`text-sm font-semibold mb-1 ${accessible ? 'group-hover:text-primary transition-colors' : ''}`}>
                                          {topic.name}
                                        </h5>
                                        <p className="text-[11px] text-slate-500 mb-4 line-clamp-2">
                                          {topic.description || 'Study material for this topic.'}
                                        </p>
                                        <span className={`inline-flex items-center text-[11px] font-bold uppercase gap-1 ${accessible ? 'text-primary' : 'text-slate-400'}`}>
                                          {accessible ? (
                                            <>
                                              <BookOpen className="w-3.5 h-3.5 inline-block" />
                                              Open
                                            </>
                                          ) : (
                                            'Locked'
                                          )}
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
                                      <FileText className="w-5 h-5" />
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

        <div className="mt-10 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-100 dark:border-teal-900/30 overflow-hidden">
          <h4 className="text-sm font-bold text-primary mb-2">Study Tip</h4>
          <p
            key={studyTipIndex}
            className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed min-h-[3.5rem] study-tip-animate"
          >
            {MBBS_STUDY_TIPS[studyTipIndex]}
          </p>
        </div>

        {!user?.packages?.length && (
          <div className="mt-auto pt-10">
            <div className="bg-slate-900 text-white p-5 rounded-2xl relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="text-sm font-bold mb-1">Pro Subscription</h4>
                <p className="text-[11px] text-slate-400 mb-4">Get full access to all modules, OSPE practice, and premium content with a Pro plan.</p>
                <Link
                  to="/packages"
                  className="block w-full py-2 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors text-center"
                >
                  SUBSCRIBE
                </Link>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
