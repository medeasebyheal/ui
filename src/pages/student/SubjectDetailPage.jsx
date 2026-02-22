import { useEffect, useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { recordRecentView } from '../../utils/recentViews';

const SUBJECT_ICONS = [
  'biotech',
  'skeleton',
  'science',
  'pill',
  'microbiology',
  'analytics',
  'psychology',
  'vaccines',
];

function getSubjectIcon(name, index) {
  const lower = (name || '').toLowerCase();
  if (lower.includes('physio')) return 'biotech';
  if (lower.includes('anatomy')) return 'skeleton';
  if (lower.includes('biochem')) return 'science';
  if (lower.includes('pharma')) return 'pill';
  if (lower.includes('path')) return 'microbiology';
  return SUBJECT_ICONS[index % SUBJECT_ICONS.length];
}

const TOPICS_PER_PAGE = 8;

export default function SubjectDetailPage() {
  const { moduleId, subjectId } = useParams();
  const { user } = useAuth();
  const [subject, setSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [moduleSubjects, setModuleSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topicSearch, setTopicSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get(`/content/subjects/${subjectId}`).then((r) => r.data),
      api.get(`/content/subjects/${subjectId}/topics`).then((r) => r.data),
      api.get(`/content/modules/${moduleId}/subjects`).then((r) => r.data),
    ])
      .then(([sub, tops, subs]) => {
        if (cancelled) return;
        setSubject(sub);
        setTopics(tops || []);
        setModuleSubjects(subs || []);
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

  const sortedTopics = useMemo(() => {
    return [...(topics || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [topics]);

  const filteredTopics = useMemo(() => {
    if (!topicSearch.trim()) return sortedTopics;
    const q = topicSearch.trim().toLowerCase();
    return sortedTopics.filter((t) => t.name?.toLowerCase().includes(q));
  }, [sortedTopics, topicSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredTopics.length / TOPICS_PER_PAGE));
  const paginatedTopics = useMemo(() => {
    const start = (currentPage - 1) * TOPICS_PER_PAGE;
    return filteredTopics.slice(start, start + TOPICS_PER_PAGE);
  }, [filteredTopics, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [topicSearch]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <p className="animate-pulse text-slate-500 font-medium">Loading...</p>
      </div>
    );
  }
  if (error || !subject) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-slate-600">
        <p className="mb-4">{error || 'Subject not found'}</p>
        <Link
          to={`/student/modules/${moduleId}`}
          className="text-primary font-medium hover:underline"
        >
          Back to Module
        </Link>
      </div>
    );
  }

  const sortedModuleSubjects = [...moduleSubjects].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="min-h-screen bg-background-light text-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8">
        {/* Sidebar - Subjects */}
        <aside className="w-64 flex-shrink-0 hidden lg:block">
          <div className="sticky top-24">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 px-2">
              Subjects
            </h3>
            <nav className="space-y-1">
              {sortedModuleSubjects.map((s, idx) => {
                const isActive = s._id === subjectId;
                const icon = getSubjectIcon(s.name, idx);
                return (
                  <Link
                    key={s._id}
                    to={`/student/modules/${moduleId}/subjects/${s._id}`}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      isActive
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'hover:bg-white text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">{icon}</span>
                    <span className="font-medium truncate">{s.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="mt-8 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <h4 className="text-emerald-800 font-bold text-sm mb-1">Study Streak</h4>
              <p className="text-xs text-emerald-600 mb-3">
                Complete topics to build your streak!
              </p>
              <div className="flex gap-1 justify-between">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                  <div
                    key={i}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                      i < 5 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex text-xs font-medium text-slate-500 mb-4">
            <ol className="inline-flex items-center space-x-1">
              <li>
                <Link to="/modules" className="hover:text-primary">
                  Modules
                </Link>
              </li>
              <li>
                <span className="mx-2">/</span>
              </li>
              <li>
                <Link to={`/student/modules/${moduleId}`} className="hover:text-primary">
                  {subject.module?.name || 'Module'}
                </Link>
              </li>
              <li>
                <span className="mx-2">/</span>
              </li>
              <li className="text-slate-900">{subject.name}</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">
                  {subject.name}: Topic List
                </h1>
                <p className="text-slate-600 max-w-xl">
                  Master the fundamentals through our curriculum of lecture series and
                  practice assessments.
                </p>
              </div>
              <div className="relative w-full md:w-64">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">
                  search
                </span>
                <input
                  type="text"
                  value={topicSearch}
                  onChange={(e) => setTopicSearch(e.target.value)}
                  placeholder="Search topics..."
                  className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-primary focus:border-primary transition-all w-full"
                />
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <span className="material-symbols-outlined">menu_book</span>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Topics</p>
                <p className="text-lg font-bold text-slate-900">{filteredTopics.length}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4">
              <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                <span className="material-symbols-outlined">task_alt</span>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Completed</p>
                <p className="text-lg font-bold text-slate-900">0/{filteredTopics.length}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4">
              <div className="h-12 w-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                <span className="material-symbols-outlined">trending_up</span>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Overall Progress</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-900">0%</span>
                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full w-0" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Topic List */}
          <div className="space-y-4">
            {paginatedTopics.length === 0 ? (
              <p className="text-slate-500 py-12 text-center">
                No topics match your search.
              </p>
            ) : (
              paginatedTopics.map((topic, idx) => {
                const globalIndex = (currentPage - 1) * TOPICS_PER_PAGE + idx;
                const topicId = String(topic._id).slice(-6).toUpperCase();
                const accessible = hasModuleAccess;

                return (
                  <div
                    key={topic._id}
                    className={`bg-white rounded-2xl border border-slate-200 p-5 transition-all group ${
                      accessible
                        ? 'hover:shadow-xl hover:shadow-slate-200/50'
                        : 'opacity-80'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 rounded-md text-slate-500">
                            ID: {topicId}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-slate-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Not Started
                          </span>
                        </div>
                        <h3 className="text-xl font-display font-bold text-slate-900 group-hover:text-primary transition-colors">
                          {topic.name}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                          {topic.content?.replace(/<[^>]*>/g, '').slice(0, 120) ||
                            `Study ${topic.name} with MCQs and One Shot lecture.`}
                          {(topic.content?.length || 0) > 120 ? '...' : ''}
                        </p>
                        <div className="mt-4">
                          <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                            <span>PROGRESS</span>
                            <span>0%</span>
                          </div>
                          <div className="h-2 w-full max-w-[200px] bg-slate-100 rounded-full overflow-hidden">
                            <div className="bg-slate-300 h-full w-0" />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <Link
                          to={
                            accessible
                              ? `/student/modules/${moduleId}/subjects/${subjectId}/topics/${topic._id}/quiz`
                              : '#'
                          }
                          onClick={(e) => !accessible && e.preventDefault()}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border font-semibold text-sm transition-colors ${
                            accessible
                              ? 'border-slate-200 hover:bg-slate-50'
                              : 'border-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <span className="material-symbols-outlined text-lg text-primary">quiz</span>
                          MCQs
                        </Link>
                        <Link
                          to={
                            accessible
                              ? `/student/modules/${moduleId}/subjects/${subjectId}/topics/${topic._id}`
                              : '#'
                          }
                          onClick={(e) => !accessible && e.preventDefault()}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                            accessible
                              ? 'bg-primary text-white hover:bg-teal-700 shadow-md shadow-primary/20'
                              : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <span className="material-symbols-outlined text-lg">play_circle</span>
                          One Shot Lecture
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-between border-t border-slate-200 pt-6">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined">chevron_left</span>
                Previous
              </button>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                      p === currentPage
                        ? 'bg-primary text-white'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          )}

          {!hasModuleAccess && sortedTopics.length > 0 && (
            <div className="mt-8 p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center">
              <span className="material-symbols-outlined text-4xl text-amber-500 mb-2 block">lock</span>
              <p className="font-bold text-slate-900 mb-1">Unlock with Premium Package</p>
              <p className="text-sm text-slate-600 mb-4">
                Purchase a package to access all topics, MCQs, and One Shot lectures.
              </p>
              <Link
                to="/packages"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
              >
                View Packages
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
