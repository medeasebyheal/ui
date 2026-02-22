import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { recordRecentView } from '../../utils/recentViews';

function getYouTubeVideoId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const watchMatch = trimmed.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
  const shortMatch = trimmed.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  const embedMatch = trimmed.match(/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return watchMatch?.[1] || shortMatch?.[1] || embedMatch?.[1] || null;
}

function getYouTubeEmbedUrl(url) {
  const id = getYouTubeVideoId(url);
  return id ? `https://www.youtube.com/embed/${id}?modestbranding=1&rel=0&autoplay=1` : null;
}

function getYouTubeThumbnail(url) {
  const id = getYouTubeVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : null;
}

const LECTURE_PREVIEW_FALLBACK = 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1280&h=720&fit=crop';

export default function TopicDetailPage() {
  const { moduleId, subjectId, topicId } = useParams();
  const { user, refreshUser } = useAuth();
  const [topic, setTopic] = useState(null);
  const [mcqs, setMcqs] = useState([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [useFreeTrial, setUseFreeTrial] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const url = `/content/topics/${topicId}?includeMcqs=true${useFreeTrial ? '&useFreeTrial=true' : ''}`;
    api.get(url)
      .then(({ data }) => {
        if (cancelled) return;
        setTopic(data.topic);
        setMcqs(data.mcqs || []);
        setHasAccess(data.hasAccess);
        if (data.usedFreeTrial) refreshUser();
        if (data.topic) {
          recordRecentView({
            type: 'topic',
            id: data.topic._id,
            name: data.topic.name,
            url: `/student/modules/${moduleId}/subjects/${subjectId}/topics/${data.topic._id}`,
            meta: data.topic.subject?.name || 'Topic',
            icon: 'psychology',
            iconBg: 'bg-teal-50 dark:bg-teal-900/30',
            iconColor: 'text-primary',
          });
        }
      })
      .catch(() => {
        if (cancelled) return;
        setHasAccess(false);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [topicId, useFreeTrial, refreshUser]);

  const handleUseFreeTrial = () => {
    setUseFreeTrial(true);
    setLoading(true);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <p className="animate-pulse text-slate-500 font-medium">Loading...</p>
      </div>
    );
  }
  if (!topic) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-slate-600">
        <p className="mb-4">Topic not found.</p>
        <Link to="/modules" className="text-primary font-medium hover:underline">Back to Modules</Link>
      </div>
    );
  }
  if (!hasAccess) {
    return (
      <div className="py-12 max-w-md mx-auto px-4 text-center">
        <p className="text-gray-600 mb-4">You do not have access to this topic.</p>
        {!user?.freeTrialUsed && (
          <button onClick={handleUseFreeTrial} className="bg-primary text-white px-4 py-2 rounded-lg font-medium">
            Use free trial for this topic
          </button>
        )}
        <Link to={`/student/modules/${moduleId}/subjects/${subjectId}`} className="block mt-4 text-primary">
          Back to Subject
        </Link>
      </div>
    );
  }

  const total = mcqs.length;
  const oneShotEmbedUrl = topic?.videoUrl ? getYouTubeEmbedUrl(topic.videoUrl) : null;
  const thumbnailUrl = topic?.videoUrl ? getYouTubeThumbnail(topic.videoUrl) : LECTURE_PREVIEW_FALLBACK;
  const moduleName = topic.subject?.module?.name || 'Module';
  const subjectName = topic.subject?.name || 'Subject';
  const quizPageUrl = `/student/modules/${moduleId}/subjects/${subjectId}/topics/${topicId}/quiz`;

  return (
    <div className="min-h-screen bg-background-light text-slate-900">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link to="/modules" className="hover:text-primary">Modules</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <Link to={`/student/modules/${moduleId}`} className="hover:text-primary">{moduleName}</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-slate-900 font-medium">{subjectName}: One Shot</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Video & Content */}
          <div className="lg:col-span-8">
            {/* Video Player */}
            <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative group">
              {videoPlaying && oneShotEmbedUrl ? (
                <iframe
                  title="One Shot Lecture"
                  src={oneShotEmbedUrl}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    alt="Lecture Preview"
                    className="w-full h-full object-cover opacity-60"
                    src={thumbnailUrl}
                    onError={(e) => { e.target.src = LECTURE_PREVIEW_FALLBACK; }}
                  />
                  {oneShotEmbedUrl ? (
                    <button
                      type="button"
                      onClick={() => setVideoPlaying(true)}
                      className="absolute w-20 h-20 bg-primary/90 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 transition-transform cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-4xl">play_arrow</span>
                    </button>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
                      <p className="text-white/80 text-sm">No video available for this topic</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Title & Actions */}
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{topic.name}</h1>
                <p className="text-slate-500 text-sm mt-1">
                  {moduleName} • {subjectName}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                  onClick={() => navigator.share?.({ title: topic.name, url: window.location.href })}
                >
                  <span className="material-symbols-outlined text-sm">share</span>
                  <span className="text-sm font-medium">Share</span>
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">bookmark_border</span>
                  <span className="text-sm font-medium">Save</span>
                </button>
              </div>
            </div>

            <hr className="my-8 border-slate-200" />

            {/* About Section */}
            <div className="prose prose-slate max-w-none">
              <h3 className="text-lg font-bold mb-4">About this One-Shot Lecture</h3>
              {topic.content ? (
                <div dangerouslySetInnerHTML={{ __html: topic.content }} className="text-slate-600 text-sm leading-relaxed" />
              ) : (
                <p className="text-slate-600 text-sm leading-relaxed">
                  This comprehensive one-shot lecture covers {topic.name}. Master the key concepts through
                  the video and reinforce your learning with the related MCQs.
                </p>
              )}
              {total > 0 && (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mt-4 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                    {total} Practice MCQs
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                    High-yield exam preparation
                  </li>
                </ul>
              )}
            </div>

            {/* Student Queries - Placeholder */}
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Student Queries (0)</h3>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <span>Sort by:</span>
                  <select className="bg-transparent border-none focus:ring-0 text-slate-900 cursor-pointer">
                    <option>Top</option>
                    <option>Newest</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 mb-6">
                <div className="w-10 h-10 shrink-0 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                  {user?.name?.[0] || user?.email?.[0] || 'U'}
                </div>
                <div className="flex-1">
                  <textarea
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    placeholder="Add a query or comment..."
                    rows={3}
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                      Post Comment
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-500">No queries yet. Be the first to ask!</p>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Resources - Placeholder */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">description</span>
                Resources
              </h3>
              <p className="text-sm text-slate-500">No resources for this topic yet.</p>
            </div>

            {/* Related MCQs */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">quiz</span>
                  Related MCQs
                </h3>
                {total > 0 && (
                  <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    High Yield
                  </span>
                )}
              </div>
              <div className={`space-y-4 max-h-[400px] overflow-y-auto pr-2 ${total > 3 ? 'custom-scrollbar' : ''}`}>
                {total === 0 ? (
                  <p className="text-sm text-slate-500">No MCQs for this topic yet.</p>
                ) : (
                  mcqs.slice(0, 5).map((m) => (
                    <Link
                      key={m._id}
                      to={quizPageUrl}
                      className="block p-4 rounded-xl bg-slate-50 border border-transparent hover:border-primary/30 transition-all cursor-pointer"
                    >
                      <p className="text-sm font-medium mb-3 line-clamp-2">{m.question}</p>
                      <div className="grid gap-2">
                        {(m.options || []).slice(0, 2).map((opt, i) => (
                          <div
                            key={i}
                            className="text-xs p-2 rounded-lg bg-white border border-slate-200 truncate"
                          >
                            {String.fromCharCode(65 + i)}) {opt}
                          </div>
                        ))}
                        {(m.options?.length || 0) > 2 && (
                          <div className="text-xs text-slate-500">+ {(m.options?.length || 0) - 2} more options</div>
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </div>
              {total > 0 && (
                <Link
                  to={quizPageUrl}
                  className="block w-full mt-6 py-3 rounded-xl border-2 border-primary text-primary font-bold text-sm hover:bg-primary hover:text-white transition-all text-center"
                >
                  Take Full Topic Quiz ({total})
                </Link>
              )}
            </div>

            {/* Module Progress - Placeholder */}
            <div className="bg-primary text-white rounded-2xl p-6 shadow-lg shadow-primary/20">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs font-medium opacity-80 uppercase tracking-wider">Module Progress</p>
                  <p className="text-xl font-bold">{subjectName}: 0%</p>
                </div>
                <span className="material-symbols-outlined text-3xl">trending_up</span>
              </div>
              <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white w-0 rounded-full" />
              </div>
              <p className="text-xs mt-3 opacity-80">Complete topics to track progress</p>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
}
