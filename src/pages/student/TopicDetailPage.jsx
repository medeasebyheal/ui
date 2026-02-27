import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, HelpCircle, PlayCircle, Play, Pause, Share2, CheckCircle, FileText, Link as LinkIcon, Download, Loader2, Maximize, Minimize } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { recordRecentView } from '../../utils/recentViews';
import { useProtectedContent } from '../../hooks/useProtectedContent';
import { getYouTubeVideoId, getYouTubeEmbedUrl, getYouTubeThumbnail } from '../../utils/youtube';

const LECTURE_PREVIEW_FALLBACK = 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1280&h=720&fit=crop';

export default function TopicDetailPage() {
  const { moduleId, subjectId, topicId } = useParams();
  const { user, refreshUser } = useAuth();
  const [topic, setTopic] = useState(null);
  const [mcqs, setMcqs] = useState([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [canUseFreeTrialForThisTopic, setCanUseFreeTrialForThisTopic] = useState(false);
  const [useFreeTrial, setUseFreeTrial] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoPaused, setVideoPaused] = useState(false);
  const [ytApiReady, setYtApiReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState([]);
  const [downloadingPdf, setDownloadingPdf] = useState(null);
  const videoContainerRef = useRef(null);
  const ytPlayerRef = useRef(null);

  const handleResourceClick = async (e, res) => {
    if (res.type !== 'pdf') return;
    e.preventDefault();
    e.stopPropagation();
    if (downloadingPdf === res._id) return;
    setDownloadingPdf(res._id);
    try {
      const response = await fetch(res.url, { mode: 'cors' });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(res.title || 'resource').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-') || 'download'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (_) {
      window.open(res.url, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloadingPdf(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const url = `/content/topics/${topicId}?includeMcqs=true${useFreeTrial ? '&useFreeTrial=true' : ''}`;
    api.get(url)
      .then(({ data }) => {
        if (cancelled) return;
        setTopic(data.topic);
        setMcqs(data.mcqs || []);
        setHasAccess(data.hasAccess);
        setCanUseFreeTrialForThisTopic(!!data.canUseFreeTrialForThisTopic);
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
        setCanUseFreeTrialForThisTopic(false);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [topicId, useFreeTrial, refreshUser]);

  useEffect(() => {
    if (!topicId) return;
    api.get(`/content/topics/${topicId}/resources`)
      .then(({ data }) => setResources(data || []))
      .catch(() => setResources([]));
  }, [topicId]);

  // Load YouTube IFrame API once
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setYtApiReady(true);
      return;
    }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScript = document.getElementsByTagName('script')[0];
    firstScript?.parentNode?.insertBefore(tag, firstScript);
    window.onYouTubeIframeAPIReady = () => setYtApiReady(true);
    return () => { window.onYouTubeIframeAPIReady = null; };
  }, []);

  const videoId = topic?.videoUrl ? getYouTubeVideoId(topic.videoUrl) : null;

  // Create/destroy YouTube player when video is shown/hidden
  useEffect(() => {
    if (!ytApiReady || !videoId || !videoPlaying || !videoContainerRef.current) return;
    const opts = {
      videoId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        iv_load_policy: 3,
      },
      events: {
        onReady: (e) => { e.target.playVideo(); setVideoPaused(false); },
      },
    };
    ytPlayerRef.current = new window.YT.Player(videoContainerRef.current, opts);
    return () => {
      if (ytPlayerRef.current && ytPlayerRef.current.destroy) {
        ytPlayerRef.current.destroy();
        ytPlayerRef.current = null;
      }
    };
  }, [ytApiReady, videoId, videoPlaying]);

  // Fullscreen change listener
  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useProtectedContent();

  const handleVideoPlay = () => {
    if (ytPlayerRef.current?.playVideo) ytPlayerRef.current.playVideo();
    setVideoPaused(false);
  };
  const handleVideoPause = () => {
    if (ytPlayerRef.current?.pauseVideo) ytPlayerRef.current.pauseVideo();
    setVideoPaused(true);
  };
  const handleFullscreen = () => {
    const el = videoContainerRef.current?.closest('.aspect-video');
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      el.requestFullscreen?.();
    }
  };

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
        {canUseFreeTrialForThisTopic && (
          <button onClick={handleUseFreeTrial} className="bg-primary text-white px-4 py-2 rounded-lg font-medium">
            Use free trial for this topic
          </button>
        )}
        {!canUseFreeTrialForThisTopic && !user?.freeTrialUsed && (
          <p className="text-sm text-slate-500 mb-4">Free trial is available only for the first topic of the first subject of the first module.</p>
        )}
        <Link to={`/student/modules/${moduleId}/subjects/${subjectId}`} className="block mt-4 text-primary">
          Back to Subject
        </Link>
      </div>
    );
  }

  const total = mcqs.length;
  const oneShotEmbedUrl = topic?.videoUrl ? getYouTubeEmbedUrl(topic.videoUrl) : null;
  const thumbnailUrl = topic?.imageUrl || (topic?.videoUrl ? getYouTubeThumbnail(topic.videoUrl) : null) || LECTURE_PREVIEW_FALLBACK;
  const moduleName = topic.subject?.module?.name || 'Module';
  const subjectName = topic.subject?.name || 'Subject';
  const quizPageUrl = `/student/modules/${moduleId}/subjects/${subjectId}/topics/${topicId}/quiz`;

  return (
    <div className="min-h-screen bg-primary/5 text-slate-900">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link to="/modules" className="hover:text-primary">Modules</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={`/student/modules/${moduleId}`} className="hover:text-primary">{moduleName}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">{subjectName}: Topic</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - MCQs first, then Video & Content */}
          <div className="lg:col-span-8">
            {/* Practice MCQs - First */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 shadow-sm mb-8">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
                <HelpCircle className="w-8 h-8 text-primary" />
                Practice MCQs
              </h3>
              {total === 0 ? (
                <p className="text-slate-500 py-4">No MCQs for this topic yet.</p>
              ) : (
                <Link
                  to={quizPageUrl}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
                >
                  <PlayCircle className="w-5 h-5" />
                  Take Topic Quiz — {total} question{total !== 1 ? 's' : ''}
                </Link>
              )}
            </div>

            {/* Video Player - Second */}
            <div
              className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative group select-none"
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              {videoPlaying && oneShotEmbedUrl ? (
                <>
                  <div
                    ref={videoContainerRef}
                    className="absolute inset-0 w-full h-full"
                    title="Topic Explanatory Video"
                  />
                  {/* Full overlay: captures all pointer events so right-click never reaches iframe (prevents Copy video URL / embed) */}
                  <div
                    className="absolute inset-0 z-10"
                    style={{ pointerEvents: 'auto' }}
                    onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    aria-hidden
                  />
                  {/* Custom controls: play, pause, fullscreen (above overlay so they stay clickable) */}
                  <div className="absolute left-0 right-0 bottom-0 h-14 z-20 flex items-center justify-center gap-2 bg-gradient-to-t from-black/80 to-transparent pointer-events-auto">
                    <button
                      type="button"
                      onClick={handleVideoPlay}
                      className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                      aria-label="Play"
                    >
                      <Play className="w-6 h-6" />
                    </button>
                    <button
                      type="button"
                      onClick={handleVideoPause}
                      className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                      aria-label="Pause"
                    >
                      <Pause className="w-6 h-6" />
                    </button>
                    <button
                      type="button"
                      onClick={handleFullscreen}
                      className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                      aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                    >
                      {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
                    </button>
                  </div>
                </>
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
                      <Play className="w-10 h-10" />
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
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Share</span>
                </button>
              </div>
            </div>

            <hr className="my-8 border-slate-200" />

            {/* About Section */}
            <div className="prose prose-slate max-w-none select-none">
              <h3 className="text-lg font-bold mb-4">About this topic</h3>
              {topic.content ? (
                <div dangerouslySetInnerHTML={{ __html: topic.content }} className="text-slate-600 text-sm leading-relaxed" />
              ) : (
                <p className="text-slate-600 text-sm leading-relaxed">
                  This explanatory video covers {topic.name}. Master the key concepts through
                  the video and reinforce your learning with the related MCQs.
                </p>
              )}
              {total > 0 && (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mt-4 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    {total} Practice MCQs
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    High-yield exam preparation
                  </li>
                </ul>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Resources */}
            <div className="bg-white border border-primary/20 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Resources
              </h3>
              {resources.length === 0 ? (
                <p className="text-sm text-slate-500">No resources for this topic yet.</p>
              ) : (
                <ul className="space-y-3">
                  {resources.map((res) => (
                    <li key={res._id}>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-transparent hover:border-primary/30 hover:bg-teal-50/50 transition-all group">
                        {res.type === 'pdf' ? (
                          <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                        ) : (
                          <LinkIcon className="w-5 h-5 text-primary flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium text-slate-900 truncate flex-1">
                          {res.title}
                        </span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {res.type === 'pdf' && (
                            <button
                              type="button"
                              onClick={(e) => handleResourceClick(e, res)}
                              disabled={downloadingPdf === res._id}
                              className="p-2 rounded-lg text-slate-500 hover:text-primary hover:bg-white transition-colors disabled:opacity-50"
                              title="Download PDF"
                            >
                              {downloadingPdf === res._id ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <Download className="w-5 h-5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
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
