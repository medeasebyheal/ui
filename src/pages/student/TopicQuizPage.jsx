import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import { Check, ChevronDown, ChevronRight, ChevronLeft, Info, Timer, TrendingUp, ClipboardCheck, CheckCircle, XCircle, Lightbulb, ArrowLeft, RefreshCw, ArrowRight, Send, Flag } from 'lucide-react';

export default function TopicQuizPage() {
  const { moduleId, subjectId, topicId } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [topic, setTopic] = useState(null);
  const [mcqs, setMcqs] = useState([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [canUseFreeTrialForThisTopic, setCanUseFreeTrialForThisTopic] = useState(false);
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
  const [quizStartTime, setQuizStartTime] = useState(() => Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [submittedAtSeconds, setSubmittedAtSeconds] = useState(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Deter dev tools access: disable context menu and dev-tools shortcuts on quiz
  useEffect(() => {
    const preventContextMenu = (e) => e.preventDefault();
    const preventDevToolsShortcuts = (e) => {
      if (e.key === 'F12') {
        e.preventDefault();
        return;
      }
      if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C', 'U'].includes(e.key)) {
        e.preventDefault();
        return;
      }
      if (e.metaKey && e.altKey && ['i', 'j', 'I', 'J', 'c', 'C'].includes(e.key)) {
        e.preventDefault();
        return;
      }
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return;
      }
    };
    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('keydown', preventDevToolsShortcuts);
    return () => {
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('keydown', preventDevToolsShortcuts);
    };
  }, []);

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
        setCanUseFreeTrialForThisTopic(!!data.canUseFreeTrialForThisTopic);
        if (data.usedFreeTrial) refreshUser();
      })
      .catch(() => {
        if (cancelled) return;
        setHasAccess(false);
        setCanUseFreeTrialForThisTopic(false);
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
      }, { skipLoader: true });
      setResult(data);
      setAnswerResults((prev) => ({ ...prev, [currentIndex]: { ...data, selectedIndex: index } }));
    } catch (_) {}
    setSubmitting(false);
  };

  const handleNext = () => {
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
  const handleFinish = () => {
    setSubmittedAtSeconds(elapsedSeconds);
    setShowResults(true);
  };
  const answeredCount = Object.keys(answerResults).length;
  const unansweredCount = mcqs.length - answeredCount;
  const handleSubmitClick = () => {
    if (unansweredCount > 0) setShowSubmitConfirm(true);
    else handleFinish();
  };
  const handleRetake = () => {
    setAnswerResults({});
    setCurrentIndex(0);
    setResult(null);
    setSelected(null);
    setShowResults(false);
    setSubmittedAtSeconds(null);
    setQuizStartTime(Date.now());
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
  const mcq = mcqs[currentIndex];
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

  if (showResults) {
    const correctCount = Object.values(answerResults).filter((r) => r?.correct).length;
    const scorePct = total ? ((correctCount / total) * 100).toFixed(1) : '0';
    const circumference = 2 * Math.PI * 28;
    const strokeDashoffset = circumference * (1 - (total ? correctCount / total : 0));
    const frozenSeconds = submittedAtSeconds ?? elapsedSeconds;
    const timeStr = `${String(Math.floor(frozenSeconds / 60)).padStart(2, '0')}:${String(frozenSeconds % 60).padStart(2, '0')}`;

    return (
      <div className="min-h-screen bg-primary/5 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        <main className="max-w-5xl mx-auto px-4 py-8 lg:py-10">
          <nav className="flex text-sm text-slate-500 dark:text-slate-400 mb-2">
            <ol className="flex items-center flex-wrap gap-x-2 gap-y-1">
              <li>
                <Link to={`/student/modules/${moduleId}/subjects/${subjectId}`} className="hover:text-primary">
                  {moduleName}
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4" />
                <Link to={`/student/modules/${moduleId}/subjects/${subjectId}`} className="hover:text-primary">
                  {subjectName}
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4" />
                <span className="font-medium text-slate-900 dark:text-slate-200">Quiz Results</span>
              </li>
            </ol>
          </nav>
          <h1 className="text-2xl font-bold mb-8 text-slate-900 dark:text-white">Quiz Results: {topic.name}</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-primary/20 dark:border-slate-700 flex items-center gap-5">
              <div className="w-16 h-16 rounded-full border-4 border-primary/20 flex items-center justify-center relative flex-shrink-0">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
                  <circle
                    className="text-primary"
                    cx="32"
                    cy="32"
                    fill="transparent"
                    r="28"
                    stroke="currentColor"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeWidth="4"
                  />
                </svg>
                <span className="text-xl font-bold text-slate-900 dark:text-white relative z-10">
                  {correctCount}/{total}
                </span>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Overall Score</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{scorePct}%</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-primary/20 dark:border-slate-700 flex items-center gap-5">
              <div className="w-14 h-14 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0">
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Time Taken</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{timeStr}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-primary/20 dark:border-slate-700 flex items-center gap-5">
              <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Percentile</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">—</p>
              </div>
            </div>
          </div>

          <div className="space-y-6 mb-12">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <ClipboardCheck className="w-5 h-5 text-primary" />
              Question Review
            </h2>
            {mcqs.map((mcq, idx) => {
              const res = answerResults[idx];
              const correct = res?.correct ?? false;
              const answered = res != null;
              const selectedIndex = res?.selectedIndex ?? -1;
              const correctIndex = res?.correctIndex ?? mcq.correctIndex ?? 0;
              const options = mcq.options || [];
              const badgeClass = correct
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : answered
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400';
              const badgeLabel = correct ? 'Correct' : answered ? 'Incorrect' : 'Skipped';
              return (
                <div
                  key={mcq._id || idx}
                  className="bg-white dark:bg-slate-800 border border-primary/20 dark:border-slate-700 rounded-2xl overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${badgeClass}`}>
                        {badgeLabel}
                      </span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        Question {idx + 1} of {total}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-6 text-slate-900 dark:text-white">{mcq.question}</h3>
                    <div className="space-y-3">
                      {options.map((opt, i) => {
                        const isCorrect = i === correctIndex;
                        const isUserWrong = !correct && selectedIndex === i;
                        return (
                          <div
                            key={i}
                            className={`flex items-center gap-3 p-4 rounded-xl border ${
                              isCorrect
                                ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/50'
                                : isUserWrong
                                  ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50'
                                  : 'border-slate-100 dark:border-slate-700 opacity-60'
                            }`}
                          >
                            {isCorrect ? (
                              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                            ) : isUserWrong ? (
                              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                            ) : (
                              <span className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 flex-shrink-0" />
                            )}
                            <span className={`font-medium ${isCorrect || isUserWrong ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                              {opt}
                            </span>
                            {isUserWrong && <span className="ml-auto text-xs text-red-600 dark:text-red-400 font-bold uppercase">Your Answer</span>}
                            {isCorrect && !correct && <span className="ml-auto text-xs text-green-600 dark:text-green-400 font-bold uppercase">Correct Answer</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <details className="group border-t border-slate-100 dark:border-slate-700">
                    <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors list-none">
                      <span className="text-sm font-semibold text-primary flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        View Explanation
                      </span>
                      <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform text-slate-400" />
                    </summary>
                    <div className="p-6 pt-0 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                      {res?.explanation || 'No explanation available.'}
                    </div>
                  </details>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={backToSubject}
              className="w-full sm:w-auto px-8 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 text-slate-700 dark:text-slate-200"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Subject
            </button>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleRetake}
                className="w-full sm:w-auto px-8 py-3 rounded-xl border border-primary text-primary font-semibold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Retake Quiz
              </button>
              <button
                type="button"
                onClick={backToSubject}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-teal-700 transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                Next Topic
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary/5 text-slate-900">
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
          <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl shadow-sm border border-primary/20">
            <Timer className="w-5 h-5 text-primary" />
            <span className="font-mono text-xl font-bold tracking-wider">
              {String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:{String(elapsedSeconds % 60).padStart(2, '0')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-3 order-2 lg:order-1">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-primary/20">
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
                onClick={handleSubmitClick}
                className="w-full mt-10 py-4 px-6 bg-primary hover:bg-teal-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
              >
                <span>Submit Quiz</span>
                <Send className="w-5 h-5" />
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
                className="bg-white rounded-3xl shadow-sm border border-primary/10 shadow-primary/5 overflow-hidden"
              >
                <div className="p-8 md:p-12">
                  <div className="flex items-center justify-between mb-6">
                    <span
                      className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        flaggedQuestions.has(currentIndex)
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Question {currentIndex + 1} of {total}
                    </span>
                    <button
                      type="button"
                      onClick={toggleFlag}
                      className={`flex items-center gap-1 font-semibold transition-colors rounded-lg px-2 py-1 ${
                        flaggedQuestions.has(currentIndex)
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50'
                          : 'text-amber-500 hover:text-amber-600'
                      }`}
                    >
                      <Flag className="w-5 h-5" />
                      <span>{flaggedQuestions.has(currentIndex) ? 'Unflag Question' : 'Flag Question'}</span>
                    </button>
                  </div>
                  <div className="mb-10">
                    <h3
                      className={`text-xl md:text-2xl font-display font-bold leading-relaxed ${
                        flaggedQuestions.has(currentIndex) ? 'text-amber-600 dark:text-amber-500' : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
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
                    <ChevronLeft className="w-5 h-5" />
                    <span>Previous Question</span>
                  </button>
                  {isLast ? (
                    <button
                      type="button"
                      onClick={handleSubmitClick}
                      disabled={transitioning}
                      className="w-full sm:w-auto px-10 py-3 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Submit Quiz</span>
                      <Send className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={transitioning}
                      className="w-full sm:w-auto px-10 py-3 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Next Question</span>
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </section>
        </div>
        <ConfirmDialog
          open={showSubmitConfirm}
          onClose={() => setShowSubmitConfirm(false)}
          title="Unanswered questions"
          message={`You have ${unansweredCount} unanswered question(s). Are you sure you want to submit?`}
          confirmLabel="Submit anyway"
          cancelLabel="Cancel"
          danger={false}
          onConfirm={() => {
            setShowSubmitConfirm(false);
            handleFinish();
          }}
        />
      </main>
    </div>
  );
}
