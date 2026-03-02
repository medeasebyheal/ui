import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useProtectedContent } from '../../hooks/useProtectedContent';
import { Check, ChevronDown, ChevronRight, ArrowRight, BookOpen, Info } from 'lucide-react';

export default function StudentTopic() {
  const { topicId } = useParams();
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
  const [answerResults, setAnswerResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [explanationOpen, setExplanationOpen] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  useProtectedContent();

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
      .catch((err) => {
        if (cancelled) return;
        if (err.response?.status === 403) setHasAccess(false);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [topicId, useFreeTrial, refreshUser]);

  const triggerConfetti = useCallback(() => {
    const duration = 2500;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0.3 },
        colors: ['#10b981', '#069285', '#e0e7ff', '#fae8ff'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 0.7 },
        colors: ['#10b981', '#069285', '#e0e7ff', '#fae8ff'],
      });
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
      const mcq = mcqs[currentIndex];
      const localResult = {
        correct: Number(index) === Number(mcq.correctIndex),
        correctIndex: mcq.correctIndex,
        explanation: mcq.explanation || undefined,
        selectedIndex: index,
        mcqId: mcq._id,
      };
      setResult(localResult);
      setAnswerResults((prev) => ({ ...prev, [currentIndex]: localResult }));
    } catch (_) {
      // ignore
    }
    setSubmitting(false);
  };

  const handleNext = () => {
    if (result == null) return;
    setTransitioning(true);
    setResult(null);
    setSelected(null);
    setExplanationOpen(false);
    setTimeout(() => {
      if (currentIndex < mcqs.length - 1) {
        setCurrentIndex((i) => i + 1);
      }
      setTransitioning(false);
    }, 280);
  };

  const handleFinish = () => {
    // submit attempts in background (do not block navigation)
    submitAllAttempts().catch(() => {});
    navigate('/student/resources');
  };

  // Send collected attempts to server in parallel.
  const submitAllAttempts = async () => {
    const attempts = Object.values(answerResults || {}).map((r) => ({
      mcqId: r.mcqId,
      selectedIndex: r.selectedIndex,
    }));
    if (!attempts.length) return;
    try {
      await Promise.all(
        attempts.map((a) => api.post('/mcqs/attempts', { mcqId: a.mcqId, selectedIndex: a.selectedIndex }))
      );
    } catch (_) {
      // swallow errors so UX isn't blocked
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="animate-pulse text-slate-500 font-medium">Loading...</div>
      </div>
    );
  }
  if (!topic) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 text-slate-600">
        Topic not found.
      </div>
    );
  }
  if (!hasAccess) {
    return (
      <div className="py-12 container max-w-md mx-auto px-4 text-center">
        <p className="text-gray-600 mb-4">You do not have access to this topic.</p>
        {canUseFreeTrialForThisTopic && (
          <button
            onClick={handleUseFreeTrial}
            className="bg-primary text-white px-4 py-2 rounded-lg font-medium"
          >
            Use free trial for this topic
          </button>
        )}
        {!canUseFreeTrialForThisTopic && !user?.freeTrialUsed && (
          <p className="text-sm text-slate-500 mb-4">Free trial is available only for the first topic of the first subject of the first module.</p>
        )}
        <button onClick={() => navigate('/student/resources')} className="block mt-4 text-primary">Back to Resources</button>
      </div>
    );
  }

  const mcq = mcqs[currentIndex];
  const total = mcqs.length;
  const progressPercent = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;
  const isLast = currentIndex === total - 1;

  return (
    <div className="font-quiz min-h-screen bg-pastel-quiz/40">
      <div className="fixed inset-0 bg-pastel-quiz/30 -z-10" aria-hidden />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                {topic.name}
              </h1>
              <p className="text-sm font-medium text-slate-500 mt-0.5">
                {topic.subject?.name || 'Practice MCQs'}
              </p>
            </div>
          </div>
          {total > 0 && (
            <div className="flex flex-col items-end gap-1">
              <div className="flex justify-between w-full sm:w-48 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Progress</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className="w-full sm:w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={false}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}
        </header>

        {total === 0 ? (
          <div className="bg-white/80 backdrop-blur rounded-xl border border-slate-100 shadow-sm p-8 text-center">
            <p className="text-slate-500">No MCQs in this topic yet.</p>
            <button
              onClick={() => navigate('/student/resources')}
              className="mt-4 text-primary font-medium hover:underline"
            >
              Back to Resources
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden select-none"
            >
              {/* Question indicator */}
              <div className="px-6 pt-6 pb-2 flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
                  <span className="text-primary font-bold">Question {currentIndex + 1}</span>
                  <span className="text-slate-400">of {total}</span>
                </div>
              </div>

              {/* Question content */}
              <div className="p-6 sm:p-8 md:p-10">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-6 sm:mb-8 leading-snug">
                  {mcq?.question}
                </h2>
                {mcq?.imageUrl && (
                  <img
                    src={mcq.imageUrl}
                    alt=""
                    className="mb-6 rounded-xl max-w-full border border-slate-100"
                  />
                )}

                {/* Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {(mcq?.options || []).map((opt, i) => {
                    const isSelected = selected === i;
                    const correctIndex = result?.correctIndex ?? -1;
                    const isCorrectOption = correctIndex === i;
                    const showCorrect = result != null && isCorrectOption;
                    const showWrong = result != null && isSelected && !result.correct;
                    const disabled = result != null;

                    let optionStyle =
                      'border-2 border-slate-100 hover:border-primary/30 hover:bg-slate-50 transition-all duration-200 ';
                    if (showCorrect) {
                      optionStyle =
                        'border-2 border-success-green bg-success-green/10 transition-all duration-300 ';
                    } else if (showWrong) {
                      optionStyle =
                        'border-2 border-red-300 bg-red-50 transition-all duration-300 ';
                    } else if (disabled) {
                      optionStyle = 'border-2 border-slate-100 bg-slate-50/50 opacity-80 cursor-default ';
                    }

                    return (
                      <motion.button
                        key={i}
                        type="button"
                        disabled={disabled}
                        whileHover={!disabled ? { scale: 1.02 } : {}}
                        whileTap={!disabled ? { scale: 0.98 } : {}}
                        onClick={() => handleSelectOption(i)}
                        className={`flex items-center gap-4 p-4 sm:p-5 rounded-xl text-left w-full ${optionStyle}`}
                      >
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                            showCorrect
                              ? 'bg-success-green text-white'
                              : showWrong
                                ? 'bg-red-400 text-white'
                                : 'border-2 border-slate-200 text-slate-500'
                          }`}
                        >
                          {showCorrect ? <Check className="w-5 h-5" /> : String.fromCharCode(65 + i)}
                        </div>
                        <span
                          className={`text-base sm:text-lg font-medium ${
                            showCorrect ? 'text-slate-900' : showWrong ? 'text-slate-700' : 'text-slate-700'
                          }`}
                        >
                          {opt}
                        </span>
                        {showCorrect && (
                          <span className="ml-auto px-2 py-0.5 bg-success-green text-[10px] text-white font-bold rounded uppercase tracking-tight">
                            Correct
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Explanation collapsible */}
                {result != null && (
                  <div className="mt-8">
                    <button
                      type="button"
                      onClick={() => setExplanationOpen((o) => !o)}
                      className="flex items-center gap-2 text-primary font-semibold hover:underline"
                    >
                      {explanationOpen ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                      View Explanation
                    </button>
                    <AnimatePresence>
                      {explanationOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 p-5 sm:p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-5">
                            <div className="flex items-start gap-3">
                              <Info className="w-5 h-5 text-success-green flex-shrink-0 mt-0.5" />
                              <div>
                                <h4 className="font-bold text-slate-900 mb-1">Explanation</h4>
                                <p className="text-slate-600 leading-relaxed">
                                  {result.explanation || 'No explanation available.'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Footer navigation */}
              <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-4 bg-slate-50/50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex-1 min-w-0" />
                <div className="flex items-center gap-3">
                  {isLast ? (
                    <button
                      type="button"
                      onClick={handleFinish}
                      disabled={result == null || transitioning}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                      {transitioning ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        <>
                          Finish
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={result == null || transitioning}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                      {transitioning ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        <>
                          Next Question
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
