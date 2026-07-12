import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronRight,
  ChevronLeft,
  Play,
  Stethoscope,
  Clock,
  Lightbulb,
  FileText,
  Trophy,
  Star,
  MessageSquare,
  Shuffle,
  Bookmark,
  Smartphone,
  HelpCircle,
  PlayCircle,
  Share2,
  Download,
  Loader2,
  FileQuestion,
  Eye,
  Film,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTopicDetail, useTopicResources } from '../../hooks/useContent';
import { useBookmarks } from '../../hooks/useBookmarks';
import { recordRecentView } from '../../utils/recentViews';
import { useProtectedContent } from '../../hooks/useProtectedContent';
import ControlledYouTubePlayer from '../../components/student/ControlledYouTubePlayer';
import { getYouTubeEmbedUrl, getYouTubeThumbnail } from '../../utils/youtube';
import { fetchSubjectTopics } from '../../api/content';
import api from '../../api/client';

const LECTURE_PREVIEW_FALLBACK = 'https://static.vecteezy.com/system/resources/previews/022/215/234/non_2x/doctor-gives-a-training-lecture-about-anatomy-for-students-doctor-presenting-human-brain-infographics-online-medical-seminar-lecture-healthcare-meeting-concept-illustration-vector.jpg';
const TOPIC_PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=200&h=200&fit=crop';
const PASSING_SCORE = 50;

const FEATURES = [
  { icon: MessageSquare, title: 'Instant Explanations', description: 'Detailed explanations for every answer' },
  { icon: Shuffle, title: 'Randomized Questions', description: 'New order every time you attempt' },
  { icon: Bookmark, title: 'Bookmark & Review', description: 'Mark questions & review later easily' },
  { icon: Smartphone, title: 'Study Anytime', description: 'Access on any device, anytime' },
];

function getEstimatedTime(questionCount) {
  const n = Math.max(1, questionCount || 1);
  const minMinutes = Math.max(1, n - 5);
  const maxMinutes = n;
  return {
    rangeLabel: `${minMinutes}–${maxMinutes} min`,
    statLabel: `${maxMinutes} Minutes`,
  };
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function RelatedTopicsCarousel({ topics, moduleId, subjectId, subjectTopicsUrl }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return undefined;
    el.addEventListener('scroll', updateScrollState);
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [topics]);

  const scroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector('[data-topic-card]')?.offsetWidth || 280;
    el.scrollBy({ left: direction * (cardWidth + 16), behavior: 'smooth' });
  };

  if (!topics.length) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900">Explore Related Topics</h2>
        <Link to={subjectTopicsUrl} className="text-sm font-medium text-primary hover:text-teal-700 flex items-center gap-0.5">
          View all
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="relative group/carousel">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll(-1)}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-9 h-9 items-center justify-center rounded-full bg-white border border-slate-200 shadow-md text-slate-600 hover:text-primary hover:border-primary/30 transition-colors"
            aria-label="Previous topics"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll(1)}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-9 h-9 items-center justify-center rounded-full bg-white border border-slate-200 shadow-md text-slate-600 hover:text-primary hover:border-primary/30 transition-colors"
            aria-label="Next topics"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide scroll-smooth"
        >
          {topics.map((t) => (
            <Link
              key={t._id}
              data-topic-card
              to={`/student/modules/${moduleId}/subjects/${subjectId}/topics/${t._id}`}
              className="snap-start flex-shrink-0 w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.7rem)] lg:w-[calc(25%-0.75rem)] min-w-[220px] flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/20 transition-all group"
            >
              <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-slate-100 ring-2 ring-slate-50">
                <img
                  src={t.imageUrl || TOPIC_PLACEHOLDER_IMAGE}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = TOPIC_PLACEHOLDER_IMAGE; }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 truncate group-hover:text-primary transition-colors">{t.name}</p>
                <p className="text-sm text-slate-500">
                  {t.mcqCount ?? 0} Question{(t.mcqCount ?? 0) !== 1 ? 's' : ''}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary flex-shrink-0 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function TopicDetailPage() {
  const { moduleId, subjectId, topicId } = useParams();
  const { user, refreshUser } = useAuth();
  const [useFreeTrial, setUseFreeTrial] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [downloadingPdf, setDownloadingPdf] = useState(null);
  const hasTrackedVisit = useRef(null);
  const videoSectionRef = useRef(null);

  const { data: topicData, isLoading: topicLoading } = useTopicDetail(topicId, useFreeTrial);
  const { data: resources = [] } = useTopicResources(topicId);
  const { data: bookmarkedMcqs = [] } = useBookmarks(topicId);

  const topic = topicData?.topic;
  const mcqs = topicData?.mcqs || [];
  const mcqSets = topicData?.mcqSets || [];
  const hasAccess = topicData?.hasAccess || false;
  const canUseFreeTrialForThisTopic = !!topicData?.canUseFreeTrialForThisTopic;

  const { data: subjectTopicsData } = useQuery({
    queryKey: ['subject-topics-related', subjectId],
    queryFn: () => fetchSubjectTopics(subjectId, 1),
    enabled: !!subjectId && hasAccess,
  });

  useProtectedContent();

  useEffect(() => {
    if (topicData && !topicLoading && topicData.topic) {
      if (topicData.usedFreeTrial) refreshUser();
      recordRecentView({
        type: 'topic',
        id: topicData.topic._id,
        name: topicData.topic.name,
        url: `/student/modules/${moduleId}/subjects/${subjectId}/topics/${topicData.topic._id}`,
        meta: topicData.topic.subject?.name || 'Topic',
        icon: 'psychology',
        iconBg: 'bg-teal-50 dark:bg-teal-900/30',
        iconColor: 'text-primary',
      });
      if (hasTrackedVisit.current !== topicData.topic._id) {
        hasTrackedVisit.current = topicData.topic._id;
        api.post('/analytics/track-visit', { contentType: 'topic', contentId: topicData.topic._id }).catch(() => { });
      }
    }
  }, [topicData, topicLoading, moduleId, subjectId, refreshUser]);

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

  const relatedTopics = useMemo(() => {
    const list = subjectTopicsData?.topics || [];
    return list.filter((t) => String(t._id) !== String(topicId));
  }, [subjectTopicsData, topicId]);

  if (topicLoading) {
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
        <Link to="/student/resources" className="text-primary font-medium hover:underline">Back to Modules</Link>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="py-12 max-w-md mx-auto px-4 text-center">
        <p className="text-gray-600 mb-4">You do not have access to this topic.</p>
        {canUseFreeTrialForThisTopic && (
          <button onClick={() => setUseFreeTrial(true)} className="bg-primary text-white px-4 py-2 rounded-lg font-medium">
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
  const { rangeLabel, statLabel } = getEstimatedTime(total);
  const moduleName = topic.subject?.module?.name || 'Module';
  const subjectName = topic.subject?.name || 'Subject';
  const quizPageUrl = `/student/modules/${moduleId}/subjects/${subjectId}/topics/${topicId}/quiz`;
  const subjectTopicsUrl = `/student/modules/${moduleId}/subjects/${subjectId}`;
  const defaultSet = mcqSets.find((s) => s.name === 'Default') || mcqSets[0];
  const startQuizUrl = defaultSet
    ? `${quizPageUrl}?set=${encodeURIComponent(defaultSet.name)}`
    : quizPageUrl;

  const allVideoUrls = [topic?.videoUrl, ...(topic?.videoUrls || [])].filter(Boolean);
  const currentVideoUrl = allVideoUrls[selectedVideoIndex];
  const hasVideos = allVideoUrls.length > 0;
  const currentEmbedUrl = currentVideoUrl ? getYouTubeEmbedUrl(currentVideoUrl) : null;
  const heroImageUrl = topic?.imageUrl || (currentVideoUrl ? getYouTubeThumbnail(currentVideoUrl) : null) || LECTURE_PREVIEW_FALLBACK;
  const topicDescription = stripHtml(topic.content) ||
    `Master ${topic.name.toLowerCase()} diagnosis, pathophysiology, and management with ${total} high-yield exam-style MCQs.`;

  const scrollToVideo = () => {
    videoSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (currentEmbedUrl) setVideoPlaying(true);
  };

  const hasExtraContent = resources.length > 0 || bookmarkedMcqs.length > 0 || mcqSets.length > 1;

  return (
    <div className="min-h-screen text-slate-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6 flex-wrap">
          <Link to="/student/resources" className="hover:text-primary transition-colors">Modules</Link>
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
          <Link to={`/student/modules/${moduleId}`} className="hover:text-primary transition-colors uppercase tracking-wide">
            {moduleName}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-slate-900 font-medium">{subjectName}: Topic</span>
        </nav>

        {/* Hero */}
        <section className="bg-gradient-to-br from-teal-50/80 via-white to-emerald-50/40 border border-teal-100/60 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-sm mb-6 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100/80 text-teal-800 text-xs font-bold uppercase tracking-wider mb-4">
                <Stethoscope className="w-3.5 h-3.5" />
                {subjectName}
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-slate-900 leading-tight mb-3">
                {topic.name}
              </h1>
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-5 max-w-xl">
                {topicDescription}
              </p>

              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 border border-slate-100 text-sm text-slate-600 shadow-sm">
                  <Clock className="w-4 h-4 text-teal-600" />
                  Estimated Time: {rangeLabel}
                </span>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  to={startQuizUrl}
                  className="inline-flex items-center justify-center gap-2.5 flex-1 sm:flex-none min-w-[160px] px-8 py-3.5 bg-[#008767] hover:bg-[#006b54] text-white font-semibold rounded-xl shadow-lg shadow-teal-900/15 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Start Quiz
                </Link>
                {hasVideos && (
                  <button
                    type="button"
                    onClick={scrollToVideo}
                    className="inline-flex items-center justify-center gap-2.5 flex-1 sm:flex-none min-w-[160px] px-8 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-xl border-2 border-slate-200 hover:border-teal-300 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Film className="w-5 h-5 text-teal-700" />
                    Watch Video
                  </button>
                )}
              </div>

              <p className="mt-5 flex items-start gap-2 text-sm text-slate-500 max-w-lg">
                <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>
                  Ready to test your knowledge? Complete all {total} question{total !== 1 ? 's' : ''} and receive detailed explanations for every answer.
                </span>
              </p>
            </div>

            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md lg:max-w-none">

                {/* Nebula */}


                {/* Image Card */}
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                  <img
                    src={heroImageUrl}
                    alt={topic.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.src = LECTURE_PREVIEW_FALLBACK;
                    }}
                  />

                  {/* Nebula color tint over image */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 via-transparent to-fuchsia-500/20 mix-blend-screen" />
                </div>

                {/* Avatar */}
                <div className="absolute -bottom-4 -left-2 sm:left-4 w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-white shadow-xl ring-2 ring-teal-100">
                  <img
                    src={topic?.imageUrl || heroImageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = TOPIC_PLACEHOLDER_IMAGE;
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        <div className=" gap-6 mb-3">
          {(resources.length > 0 || bookmarkedMcqs.length > 0) && (
            <div className="space-y-6">
              {resources.length > 0 && (
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Resources
                  </h3>
                  <ul className="space-y-2">
                    {resources.map((res) => (
                      <li key={res._id}>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            if (res.type === 'pdf') handleResourceClick(e, res);
                            else if (res.url) window.open(res.url, '_blank', 'noopener,noreferrer');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              if (res.type === 'pdf') handleResourceClick(e, res);
                              else if (res.url) window.open(res.url, '_blank', 'noopener,noreferrer');
                            }
                          }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-teal-50/50 transition-colors cursor-pointer"
                        >
                          <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                          <span className="text-sm font-medium text-slate-900 truncate flex-1">{res.title}</span>
                          {res.type === 'pdf' && (
                            downloadingPdf === res._id
                              ? <Loader2 className="w-4 h-4 animate-spin text-primary" />
                              : <Download className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {bookmarkedMcqs.length > 0 && (
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Bookmark className="w-5 h-5 text-primary" />
                    Bookmarked MCQs
                  </h3>
                  <ul className="space-y-2">
                    {bookmarkedMcqs.map((b) => {
                      const mcq = b.mcq || {};
                      const qIndex = mcqs.findIndex((m) => String(m._id) === String(mcq._id));
                      return (
                        <li key={b._id || mcq._id}>
                          <Link
                            to={`${quizPageUrl}?scrollTo=${encodeURIComponent(mcq._id)}`}
                            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-teal-50/50 transition-colors"
                          >
                            <FileQuestion className="w-5 h-5 text-primary flex-shrink-0" />
                            <span className="text-sm font-medium text-slate-900 truncate flex-1">
                              {qIndex >= 0 ? `${qIndex + 1}. ` : ''}{mcq.question || 'Bookmarked question'}
                            </span>
                            <Eye className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats bar */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-sm flex items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 text-sm sm:text-base">{total} Questions</p>
              <p className="text-xs sm:text-sm text-slate-500 truncate">Exam-style MCQs</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-sm flex items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-violet-600" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 text-sm sm:text-base">{statLabel}</p>
              <p className="text-xs sm:text-sm text-slate-500 truncate">Estimated time</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-sm flex items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 text-sm sm:text-base">{PASSING_SCORE}% Passing Score</p>
              <p className="text-xs sm:text-sm text-slate-500 truncate">To pass this quiz</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-sm flex items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Star className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 text-sm sm:text-base">High Yield</p>
              <p className="text-xs sm:text-sm text-slate-500 truncate">Exam focused</p>
            </div>
          </div>
        </section>

        {/* High-Yield Content */}
        <section className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-teal-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-slate-900 mb-2">High-Yield Content</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                This quiz features content curated from past papers — handpicked questions that reflect the style, difficulty, and topics frequently tested in professional medical examinations.
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  Past paper–inspired question patterns
                </li>
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  Exam-focused clinical scenarios
                </li>
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  High-yield facts tested repeatedly
                </li>
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  Detailed explanations for every answer
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Theatre-mode video */}
        {hasVideos && (
          <section
            id="topic-video"
            ref={videoSectionRef}
            className="mb-8 scroll-mt-24"
          >
            <div className="flex items-center gap-2 mb-4">
              <Film className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-slate-900">Lecture Video</h2>
            </div>
            <div className="bg-slate-950 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-2xl">
              <div
                className="relative mx-auto w-full max-w-6xl aspect-video rounded-xl overflow-hidden bg-black select-none"
                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
              >
                {videoPlaying && currentEmbedUrl ? (
                  <ControlledYouTubePlayer
                    youtubeUrl={currentVideoUrl}
                    title={`${topic.name} - Part ${selectedVideoIndex + 1}`}
                    className="absolute inset-0 w-full h-full"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img
                      alt="Lecture Preview"
                      className="w-full h-full object-cover opacity-50"
                      src={heroImageUrl}
                      onError={(e) => { e.target.src = LECTURE_PREVIEW_FALLBACK; }}
                    />
                    {currentEmbedUrl && (
                      <button
                        type="button"
                        onClick={() => setVideoPlaying(true)}
                        className="absolute w-16 h-16 sm:w-20 sm:h-20 bg-primary/90 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 transition-transform"
                        aria-label="Play video"
                      >
                        <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              {allVideoUrls.length > 1 && (
                <div className="mt-4 max-w-6xl mx-auto">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Playlist</p>
                  <div className="flex flex-wrap gap-2">
                    {allVideoUrls.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => { setSelectedVideoIndex(idx); setVideoPlaying(false); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedVideoIndex === idx ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                      >
                        {idx === 0 ? 'Main Lecture' : `Video ${idx + 1}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Feature highlights */}
        <section className="bg-white border-teal-100/50 rounded-2xl p-5 sm:p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-600/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-teal-700" />
                </div>
                <div>
                  <p className="font-bold text-black text-sm">{title}</p>
                  <p className="text-xs sm:text-sm text-teal-800/70 mt-0.5 leading-snug">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Additional content: MCQ sets, videos, resources */}
        {hasExtraContent && (
          <section className="space-y-6 pt-2 border-t border-slate-200/80">
            {mcqSets.length > 1 && (
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                  <HelpCircle className="w-6 h-6 text-primary" />
                  Practice Sets
                </h3>
                <div className="space-y-3">
                  {mcqSets.map((set) => (
                    <Link
                      key={set.name}
                      to={`${quizPageUrl}?set=${encodeURIComponent(set.name)}`}
                      className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-primary/30 hover:bg-teal-50/30 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <PlayCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">
                            {set.name === 'Default' ? 'General Practice' : `${set.name} Quiz`}
                          </h4>
                          <p className="text-sm text-slate-500">
                            {set.mcqs.length} question{set.mcqs.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>
            )}


            <div className="flex justify-end">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-medium transition-colors"
                onClick={() => navigator.share?.({ title: topic.name, url: window.location.href })}
              >
                <Share2 className="w-4 h-4" />
                Share topic
              </button>
            </div>
          </section>
        )}

        {/* Related topics carousel — end of page */}
        <RelatedTopicsCarousel
          topics={relatedTopics}
          moduleId={moduleId}
          subjectId={subjectId}
          subjectTopicsUrl={subjectTopicsUrl}
        />
      </main>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
