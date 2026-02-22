import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Check, ChevronDown, ChevronRight, Info } from 'lucide-react';

function getYouTubeEmbedUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const match = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  const id = match?.[1];
  return id ? `https://www.youtube.com/embed/${id}?modestbranding=1&rel=0` : null;
}

export default function TopicQuizPage() {
  const { moduleId, subjectId, topicId } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [topic, setTopic] = useState(null);
  const [mcqs, setMcqs] = useState([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [useFreeTrial, setUseFreeTrial] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [explanationOpen, setExplanationOpen] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [answerResults, setAnswerResults] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [quizStartTime] = useState(() => Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsedSeconds(Math.floor((Date.now() - quizStartTime) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [quizStartTime]);

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
      })
      .catch(() => {
        if (cancelled) return;
        setHasAccess(false);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [topicId, useFreeTrial, refreshUser]);

  const triggerConfetti = useCallback(() => {
    const end = Date.now() + 2500;
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0.3 }, colors: ['#10b981', '#069285'] });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 0.7 }, colors: ['#10b981', '#069285'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  useEffect(() => {
    if (result?.correct) triggerConfetti();
  }, [result?.correct, triggerConfetti]);

  const handleUseFreeTrial = () => {
    setUseFreeTrial(true);
    setLoading(true);
  };

  const handleSelectOption = async (index) => {
    if (result != null || !mcqs[currentIndex] || submitting) return;
    setSelected(index);
    setSubmitting(true);
    setExplanationOpen(false);
    try {
      const { data } = await api.post('/mcqs/attempts', {
        mcqId: mcqs[currentIndex]._id,
        selectedIndex: index,
      });
      setResult(data);
      setAnswerResults((prev) => ({ ...prev, [currentIndex]: { ...data, selectedIndex: index } }));
    } catch (_) {}
    setSubmitting(false);
  };

  const handleNext = () => {
    if (result == null) return;
    setTransitioning(true);
    setTimeout(() => {
      if (currentIndex < mcqs.length - 1) {
        const next = currentIndex + 1;
        setCurrentIndex(next);
        setResult(answerResults[next] ?? null);
        setSelected(answerResults[next] != null ? answerResults[next].selectedIndex : null);
      }
      setExplanationOpen(false);
      setTransitioning(false);
    }, 200);
  };

  const handlePrevious = () => {
    if (currentIndex <= 0) return;
    setTransitioning(true);
    setTimeout(() => {
      const prev = currentIndex - 1;
      setCurrentIndex(prev);
      setResult(answerResults[prev] ?? null);
      setSelected(answerResults[prev] != null ? answerResults[prev].selectedIndex : null);
      setExplanationOpen(false);
      setTransitioning(false);
    }, 200);
  };

  const goToQuestion = (idx) => {
    setCurrentIndex(idx);
    const saved = answerResults[idx];
    setResult(saved ?? null);
    setSelected(saved != null && saved.selectedIndex !== undefined ? saved.selectedIndex : null);
    setExplanationOpen(false);
  };

  const toggleFlag = () => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(currentIndex)) next.delete(currentIndex);
      else next.add(currentIndex);
      return next;
    });
  };

  const backToSubject = () => navigate(`/student/modules/${moduleId}/subjects/${subjectId}`);
  const handleFinish = () => backToSubject();

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
  const mcq = mcqs[currentIndex];
  const embedUrl = result?.videoUrl ? getYouTubeEmbedUrl(result.videoUrl) : null;
  const isLast = currentIndex === total - 1;
  const moduleName = topic.subject?.module?.name || 'Module';
  const subjectName = topic.subject?.name || 'Subject';

  if (total === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <p className="text-slate-600 mb-4">No MCQs for this topic yet.</p>
        <Link to={`/student/modules/${moduleId}/subjects/${subjectId}`} className="text-primary font-medium hover:underline">
          Back to Subject
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light text-slate-900">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <nav className="flex text-sm text-slate-500 mb-2">
              <Link to="/modules" className="hover:text-primary">{moduleName}</Link>
              <span className="mx-2">/</span>
              <Link to={`/student/modules/${moduleId}/subjects/${subjectId}`} className="hover:text-primary">{subjectName}</Link>
              <span className="mx-2">/</span>
              <span className="text-slate-900 font-medium">{topic.name} Quiz</span>
            </nav>
            <h1 className="text-2xl font-display font-extrabold text-slate-900">{topic.name} Quiz</h1>
          </div>
          <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-200">
            <span className="material-symbols-outlined text-primary">timer</span>
            <span className="font-mono text-xl font-bold tracking-wider">
              {String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:{String(elapsedSeconds % 60).padStart(2, '0')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-3 order-2 lg:order-1">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold mb-4 flex items-center justify-between">
                Quiz Progress
                <span className="text-sm font-normal text-slate-500">
                  {Object.keys(answerResults).length} / {total}
                </span>
              </h2>
              <div className="grid grid-cols-5 gap-2">
                {mcqs.map((_, idx) => {
                  const answered = answerResults[idx] != null;
                  const isCurrent = idx === currentIndex;
                  const flagged = flaggedQuestions.has(idx);
                  let btnClass = 'w-10 h-10 flex items-center justify-center rounded-lg font-bold text-sm transition-colors ';
                  if (isCurrent) btnClass += 'border-2 border-primary bg-primary/5 text-primary ';
                  else if (answered) btnClass += 'bg-primary text-white ';
                  else if (flagged) btnClass += 'bg-amber-100 text-amber-600 ';
                  else btnClass += 'bg-slate-100 text-slate-500 ';
                  return (
                    <button key={idx} type="button" onClick={() => goToQuestion(idx)} className={btnClass}>
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
              <div className="mt-8 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-4 h-4 rounded bg-primary" />
                  <span className="text-slate-600">Answered</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-4 h-4 rounded border-2 border-primary bg-primary/10" />
                  <span className="text-slate-600">Current Question</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-4 h-4 rounded bg-amber-100" />
                  <span className="text-slate-600">Flagged</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-4 h-4 rounded bg-slate-100" />
                  <span className="text-slate-600">Unvisited</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleFinish}
                className="w-full mt-10 py-4 px-6 bg-primary hover:bg-teal-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
              >
                <span>Submit Quiz</span>
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </aside>

          <section className="lg:col-span-9 order-1 lg:order-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"
              >
                <div className="p-8 md:p-12">
                  <div className="flex items-center justify-between mb-6">
                    <span className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wider">
                      Question {currentIndex + 1} of {total}
                    </span>
                    <button
                      type="button"
                      onClick={toggleFlag}
                      className="flex items-center gap-1 font-semibold text-amber-500 hover:text-amber-600 transition-colors"
                    >
                      <span className="material-symbols-outlined">flag</span>
                      <span>Flag Question</span>
                    </button>
                  </div>
                  <div className="mb-10">
                    <h3 className="text-xl md:text-2xl font-display font-bold leading-relaxed text-slate-800">
                      {mcq?.question}
                    </h3>
                    {mcq?.imageUrl && (
                      <div className="mt-6 flex justify-center">
                        <img alt="" src={mcq.imageUrl} className="rounded-xl border border-slate-200 max-h-48 object-contain w-full" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    {(mcq?.options || []).map((opt, i) => {
                      const correctIndex = result?.correctIndex ?? -1;
                      const showCorrect = result != null && correctIndex === i;
                      const showWrong = result != null && selected === i && !result.correct;
                      const disabled = result != null;
                      const isSelected = selected === i;
                      let labelClass = 'flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ';
                      if (showCorrect) labelClass += 'border-success-green bg-success-green/10 ';
                      else if (showWrong) labelClass += 'border-red-300 bg-red-50 ';
                      else if (disabled) labelClass += 'border-slate-100 bg-slate-50/50 cursor-default ';
                      else labelClass += 'border-slate-100 bg-slate-50/50 hover:border-primary/30 ';
                      if (isSelected && !result) labelClass += 'border-primary bg-primary/5 ';
                      return (
                        <label
                          key={i}
                          className={`relative block ${disabled ? 'cursor-default pointer-events-none' : 'cursor-pointer'}`}
                        >
                          <input
                            type="radio"
                            name="mcq"
                            checked={isSelected}
                            onChange={() => handleSelectOption(i)}
                            disabled={disabled}
                            className="sr-only"
                          />
                          <div className={labelClass}>
                            <div
                              className={`w-6 h-6 rounded-full border-2 flex-shrink-0 transition-all flex items-center justify-center ${
                                showCorrect
                                  ? 'border-success-green bg-success-green'
                                  : showWrong
                                    ? 'border-red-400 bg-red-400'
                                    : isSelected
                                      ? 'border-primary border-[6px] bg-white'
                                      : 'border-slate-300'
                              }`}
                            >
                              {showCorrect && <Check className="w-4 h-4 text-white" />}
                            </div>
                            <span className="text-lg font-medium">{opt}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  {result != null && (
                    <div className="mt-8">
                      <button
                        type="button"
                        onClick={() => setExplanationOpen((o) => !o)}
                        className="flex items-center gap-2 text-primary font-semibold hover:underline"
                      >
                        {explanationOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        View Explanation
                      </button>
                      <AnimatePresence>
                        {explanationOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-5">
                              <div className="flex items-start gap-3">
                                <Info className="w-5 h-5 text-success-green flex-shrink-0 mt-0.5" />
                                <p className="text-slate-600">{result.explanation || 'No explanation available.'}</p>
                              </div>
                              {embedUrl && (
                                <div className="rounded-xl overflow-hidden aspect-video bg-slate-900">
                                  <iframe
                                    title="Explanation video"
                                    src={embedUrl}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                                    allowFullScreen
                                  />
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
                <div className="bg-slate-50 border-t border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={handlePrevious}
                    disabled={currentIndex === 0 || transitioning}
                    className="w-full sm:w-auto px-8 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined">arrow_back_ios</span>
                    <span>Previous Question</span>
                  </button>
                  {isLast ? (
                    <button
                      type="button"
                      onClick={handleFinish}
                      disabled={result == null || transitioning}
                      className="w-full sm:w-auto px-10 py-3 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Submit Quiz</span>
                      <span className="material-symbols-outlined">send</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={result == null || transitioning}
                      className="w-full sm:w-auto px-10 py-3 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Next Question</span>
                      <span className="material-symbols-outlined">arrow_forward_ios</span>
                    </button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="mt-6 flex items-center gap-2 text-slate-500 text-sm italic">
              <span className="material-symbols-outlined text-sm">info</span>
              <span>Pro-tip: Use your keyboard&apos;s arrow keys to navigate questions and 1-4 for options.</span>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
