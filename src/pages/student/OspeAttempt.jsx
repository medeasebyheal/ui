import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import api from '../../api/client';
import { recordRecentView } from '../../utils/recentViews';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  BookOpen,
  Timer,
  ZoomIn,
  X,
  Lightbulb,
  BarChart3,
} from 'lucide-react';

const MCQ_TYPES = ['text_mcq', 'picture_mcq', 'guess_until_correct'];

function getFlatQuestions(ospe) {
  const stations = ospe?.stations || [];
  if (stations.length === 0 && ospe?.questions?.length) {
    return ospe.questions.map((q) => ({ question: q }));
  }
  return stations.flatMap((s) => (s.questions || []).map((q) => ({ question: q })));
}

function getStations(ospe) {
  const stations = ospe?.stations || [];
  if (stations.length > 0) return stations;
  if (ospe?.questions?.length) {
    return ospe.questions.map((q) => ({
      imageUrl: q.imageUrl,
      questions: [{ ...q, imageUrl: undefined }],
    }));
  }
  return [];
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function StudentOspeAttempt() {
  const { ospeId } = useParams();
  const navigate = useNavigate();
  const [ospe, setOspe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(5 * 60);
  const [practiceMode, setPracticeMode] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [zoomImageUrl, setZoomImageUrl] = useState(null);
  const [revealedModel, setRevealedModel] = useState(new Set());
  const [expandedReview, setExpandedReview] = useState(null);

  const stations = useMemo(() => getStations(ospe), [ospe]);
  const flatList = useMemo(() => getFlatQuestions(ospe), [ospe]);
  const totalQuestions = flatList.length;

  useEffect(() => {
    api
      .get(`/ospes/${ospeId}`)
      .then(({ data }) => {
        setOspe(data);
        setTimerSeconds((data.timeLimit || 5) * 60);
        if (data) {
          recordRecentView({
            type: 'ospe',
            id: data._id,
            name: data.name,
            url: `/student/ospes/${data._id}`,
            meta: 'Practice Exam',
            icon: 'receipt_long',
            iconBg: 'bg-blue-50 dark:bg-blue-900/30',
            iconColor: 'text-blue-600',
          });
        }
      })
      .catch(() => setOspe(null))
      .finally(() => setLoading(false));
  }, [ospeId]);

  useEffect(() => {
    if (!ospe || submitted) return;
    const id = setInterval(() => {
      setTimerSeconds((s) => {
        if (s <= 1) return 0;
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [ospe, submitted]);

  const station = stations[currentStationIndex];
  const totalStations = stations.length;
  const progressPercent = totalStations > 0 ? ((currentStationIndex + 1) / totalStations) * 100 : 0;
  const isLastStation = currentStationIndex === totalStations - 1;

  const globalIndicesForStation = useMemo(() => {
    const out = [];
    let idx = 0;
    for (let si = 0; si < stations.length; si++) {
      const qs = stations[si].questions || [];
      if (si === currentStationIndex) {
        for (let qi = 0; qi < qs.length; qi++) {
          out.push(idx);
          idx++;
        }
      } else {
        idx += qs.length;
      }
    }
    return out;
  }, [stations, currentStationIndex]);

  const isCurrentStationValid = useMemo(() => {
    return globalIndicesForStation.every((i) => {
      const item = flatList[i];
      if (!item) return true;
      const q = item.question;
      const isMcq = MCQ_TYPES.includes(q?.type);
      if (isMcq) return answers[`q${i}_opt`] != null;
      return (answers[`q${i}_written`] || '').trim().length > 0;
    });
  }, [flatList, globalIndicesForStation, answers]);

  const handleSubmitAttempt = useCallback(async () => {
    const answerList = flatList.map((_, i) => ({
      questionIndex: i,
      selectedIndex: answers[`q${i}_opt`] != null ? Number(answers[`q${i}_opt`]) : undefined,
      writtenAnswer: answers[`q${i}_written`],
    }));
    setSubmitting(true);
    try {
      const { data } = await api.post('/ospes/attempts', { ospeId, answers: answerList });
      setResult(data);
      setSubmitted(true);
      const correct = (data.answers || []).filter((a) => a.correct).length;
      const pct = totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0;
      if (pct >= 80) {
        const duration = 2000;
        const end = Date.now() + duration;
        const frame = () => {
          confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0.3 }, colors: ['#10b981', '#069285', '#e0e7ff'] });
          confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 0.7 }, colors: ['#10b981', '#069285', '#e0e7ff'] });
          if (Date.now() < end) requestAnimationFrame(frame);
        };
        frame();
      }
    } catch (_) {}
    setSubmitting(false);
  }, [flatList, answers, ospeId, totalQuestions]);

  useEffect(() => {
    if (timerSeconds === 0 && !submitted && !submitting) {
      handleSubmitAttempt();
    }
  }, [timerSeconds, submitted, submitting, handleSubmitAttempt]);

  const toggleMarkForReview = () => {
    setMarkedForReview((s) => {
      const next = new Set(s);
      if (next.has(currentStationIndex)) next.delete(currentStationIndex);
      else next.add(currentStationIndex);
      return next;
    });
  };

  const handlePrev = () => {
    if (currentStationIndex > 0) setCurrentStationIndex((i) => i - 1);
  };

  const handleNext = () => {
    if (isLastStation) {
      setShowSubmitConfirm(true);
    } else {
      setCurrentStationIndex((i) => i + 1);
    }
  };

  const handleMcqSelect = (globalIndex, q, optIndex) => {
    if (result) return;
    const key = `q${globalIndex}_opt`;
    if (answers[key] != null) return;
    setAnswers((a) => ({ ...a, [key]: optIndex }));
  };

  const handleWrittenChange = (globalIndex, value) => {
    setAnswers((a) => ({ ...a, [`q${globalIndex}_written`]: value }));
  };

  const toggleRevealModel = (globalIndex) => {
    setRevealedModel((s) => {
      const next = new Set(s);
      if (next.has(globalIndex)) next.delete(globalIndex);
      else next.add(globalIndex);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="animate-pulse text-slate-500 font-medium">Loading...</div>
      </div>
    );
  }
  if (!ospe) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 text-slate-600">
        OSPE not found.
      </div>
    );
  }

  if (submitted && result) {
    const correctCount = (result.answers || []).filter((a) => a.correct).length;
    const pct = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const byStation = [];
    let idx = 0;
    stations.forEach((s, si) => {
      const qs = s.questions || [];
      let correct = 0;
      qs.forEach(() => {
        const a = result.answers[idx];
        if (a?.correct) correct++;
        idx++;
      });
      byStation.push({ stationIndex: si, correct, total: qs.length, station: s });
    });

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <header className="flex flex-col md:flex-row gap-6 mb-10">
            <div className="flex-1 bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-8">
              <div className="relative w-32 h-32 flex items-center justify-center rounded-full bg-slate-100">
                <span className="text-3xl font-bold text-slate-900">{pct}%</span>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  {pct >= 80 ? 'Excellent Performance!' : pct >= 60 ? 'Good Job!' : 'Keep Practicing'}
                </h1>
                <p className="text-slate-600 mb-6">
                  You scored {correctCount} out of {totalQuestions} correct.
                </p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <button
                    onClick={() => navigate(ospe.module ? `/student/modules/${ospe.module._id ?? ospe.module}/ospes` : '/student/resources')}
                    className="bg-primary text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2"
                  >
                    Back to OSPEs
                  </button>
                  <button
                    onClick={() => { setSubmitted(false); setResult(null); setCurrentStationIndex(0); setAnswers({}); setMarkedForReview(new Set()); setTimerSeconds(5 * 60); }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-lg font-medium flex items-center gap-2"
                  >
                    Retake Exam
                  </button>
                </div>
              </div>
            </div>
            <div className="w-full md:w-80 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-bold mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Section Summary
              </h3>
              <div className="space-y-5">
                {byStation.map(({ stationIndex, correct, total }) => {
                  const p = total > 0 ? Math.round((correct / total) * 100) : 0;
                  const barClass = p >= 80 ? 'bg-emerald-500' : p >= 60 ? 'bg-primary' : 'bg-amber-500';
                  const textClass = p >= 80 ? 'text-emerald-600' : p >= 60 ? 'text-primary' : 'text-amber-600';
                  return (
                    <div key={stationIndex}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">Station {stationIndex + 1}</span>
                        <span className={`font-semibold ${textClass}`}>{correct}/{total}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barClass}`}
                          style={{ width: `${p}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </header>

          <section>
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
              <BookOpen className="w-5 h-5 text-primary" />
              Station Review
            </h2>
            <div className="space-y-4">
              {stations.map((s, si) => {
                const isExpanded = expandedReview === si;
                let qIdx = 0;
                stations.slice(0, si).forEach((st) => { qIdx += (st.questions || []).length; });
                const startIdx = qIdx;
                const qs = s.questions || [];
                let correctHere = 0;
                qs.forEach((_, qi) => {
                  const a = result.answers[startIdx + qi];
                  if (a?.correct) correctHere++;
                });
                const hasError = correctHere < qs.length;
                return (
                  <div
                    key={si}
                    className={`border rounded-xl overflow-hidden cursor-pointer transition-all ${
                      isExpanded ? 'border-primary shadow-lg' : 'border-slate-200 hover:border-slate-300'
                    } bg-white`}
                  >
                    <div
                      className="p-5 flex items-center gap-4"
                      onClick={() => setExpandedReview(isExpanded ? null : si)}
                    >
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${
                          hasError ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                        }`}
                      >
                        {si + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">Station {si + 1}</h4>
                        <p className="text-xs text-slate-500">{correctHere}/{qs.length} correct</p>
                      </div>
                      {hasError ? (
                        <span className="text-rose-500">Review</span>
                      ) : (
                        <Check className="w-5 h-5 text-emerald-500" />
                      )}
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                    {isExpanded && (
                      <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                        <div className="grid md:grid-cols-2 gap-8">
                          {s.imageUrl && (
                            <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                              <img src={s.imageUrl} alt={`Station ${si + 1}`} className="w-full h-64 object-contain" />
                            </div>
                          )}
                          <div className="space-y-6">
                            {qs.map((q, qi) => {
                              const gi = startIdx + qi;
                              const ans = result.answers[gi];
                              const correct = ans?.correct;
                              const isMcq = MCQ_TYPES.includes(q.type);
                              const userAns = isMcq
                                ? (q.options || [])[ans?.selectedIndex]
                                : ans?.writtenAnswer || '—';
                              const correctAns = isMcq
                                ? (q.options || [])[q.correctIndex]
                                : q.expectedAnswer || '—';
                              return (
                                <div key={qi} className="space-y-3">
                                  <p className="font-medium text-slate-900">{q.questionText}</p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className={`p-4 rounded-xl border ${
                                      correct ? 'border-emerald-200 bg-emerald-50/50' : 'border-rose-200 bg-rose-50/50'
                                    }`}>
                                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-2">Your answer</label>
                                      <p className="text-sm font-medium">{userAns || '—'}</p>
                                    </div>
                                    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                                      <label className="text-[10px] uppercase font-bold text-emerald-700 block mb-2">Model answer</label>
                                      <p className="text-sm font-medium">{correctAns || '—'}</p>
                                    </div>
                                  </div>
                                  {q.expectedAnswer && !isMcq && (
                                    <div className="p-4 bg-slate-100 rounded-xl">
                                      <h5 className="font-bold flex items-center gap-2 mb-2 text-slate-700">
                                        <Lightbulb className="w-4 h-4 text-primary" />
                                        Explanation
                                      </h5>
                                      <p className="text-sm text-slate-600">{q.expectedAnswer}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (!station || totalStations === 0) {
    return (
      <div className="py-12 px-4 text-center text-slate-600">
        No stations in this OSPE.
        <button onClick={() => navigate('/student/resources')} className="block mt-4 text-primary">Back to Resources</button>
      </div>
    );
  }

  let globalIdx = 0;
  stations.slice(0, currentStationIndex).forEach((s) => { globalIdx += (s.questions || []).length; });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight text-slate-900">{ospe.name}</h1>
                <p className="text-sm text-slate-500">Station {currentStationIndex + 1} of {totalStations}</p>
              </div>
            </div>
            <div className="hidden md:block flex-1 max-w-md mx-8">
              <div className="flex justify-between text-xs mb-1 text-slate-500 font-medium">
                <span>Progress</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={false}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                  timerSeconds < 120 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <Timer className={`w-5 h-5 ${timerSeconds < 120 ? 'text-rose-500' : 'text-slate-500'}`} />
                <span className={`font-mono font-bold ${timerSeconds < 120 ? 'text-rose-600' : 'text-slate-700'}`}>
                  {formatTime(timerSeconds)}
                </span>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={practiceMode}
                  onChange={(e) => setPracticeMode(e.target.checked)}
                  className="rounded text-primary"
                />
                Practice mode
              </label>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStationIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span className="bg-slate-100 text-slate-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">
                    {currentStationIndex + 1}
                  </span>
                  Station {currentStationIndex + 1}
                </h2>
                {markedForReview.has(currentStationIndex) && (
                  <span className="px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-700 text-xs font-semibold">
                    Marked for Review
                  </span>
                )}
              </div>

              <div className="p-6 md:p-8 grid md:grid-cols-2 gap-8">
                {station.imageUrl && (
                  <div className="space-y-4">
                    <div
                      className="relative group cursor-zoom-in overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                      onClick={() => setZoomImageUrl(station.imageUrl)}
                    >
                      <img
                        src={station.imageUrl}
                        alt={`Station ${currentStationIndex + 1}`}
                        className="w-full aspect-square object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-3 rounded-full shadow-lg">
                          <ZoomIn className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] uppercase tracking-wider px-2 py-1 rounded font-bold">
                        Fig. {currentStationIndex + 1}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 italic text-center">Click image to zoom</p>
                  </div>
                )}

                <div className={`space-y-6 ${!station.imageUrl ? 'md:col-span-2' : ''} max-h-[600px] overflow-y-auto pr-2`}>
                  {(station.questions || []).map((q, qi) => {
                    const gi = globalIdx++;
                    const isMcq = MCQ_TYPES.includes(q.type);
                    const options = (q.options || []).filter(Boolean);
                    const selected = answers[`q${gi}_opt`];
                    const showFeedback = practiceMode && selected != null && isMcq;
                    const correct = selected === q.correctIndex;

                    if (isMcq && options.length > 0) {
                      return (
                        <div key={gi} className="space-y-2">
                          <label className="block text-sm font-semibold text-slate-700">
                            {q.questionText} <span className="text-rose-500">*</span>
                          </label>
                          <div className="grid grid-cols-1 gap-2">
                            {options.map((opt, j) => {
                              const isSelected = selected === j;
                              const isCorrectOpt = q.correctIndex === j;
                              const showCor = showFeedback && isCorrectOpt;
                              const showWrong = showFeedback && isSelected && !correct;
                              const disabled = selected != null && !practiceMode;
                              let btnClass = 'flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ';
                              if (showCor) btnClass += 'border-emerald-500 bg-emerald-50';
                              else if (showWrong) btnClass += 'border-rose-400 bg-rose-50';
                              else if (disabled) btnClass += 'border-slate-100 bg-slate-50 opacity-80';
                              else btnClass += 'border-slate-200 hover:border-primary/30 hover:bg-slate-50';
                              return (
                                <button
                                  key={j}
                                  type="button"
                                  disabled={disabled}
                                  onClick={() => handleMcqSelect(gi, q, j)}
                                  className={btnClass}
                                >
                                  <span className="w-8 h-8 rounded-full border-2 border-slate-200 flex items-center justify-center text-sm font-bold text-slate-500">
                                    {showCor ? <Check className="w-4 h-4 text-emerald-600" /> : String.fromCharCode(65 + j)}
                                  </span>
                                  <span className="font-medium text-slate-700">{opt}</span>
                                  {showCor && <span className="ml-auto text-[10px] font-bold text-emerald-600 uppercase">Correct</span>}
                                </button>
                              );
                            })}
                          </div>
                          {showFeedback && !correct && q.expectedAnswer && (
                            <p className="text-sm text-slate-600 mt-2 p-3 bg-slate-50 rounded-lg">{q.expectedAnswer}</p>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div key={gi} className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                          {q.questionText} <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          placeholder="Your answer..."
                          rows={4}
                          value={answers[`q${gi}_written`] || ''}
                          onChange={(e) => handleWrittenChange(gi, e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary text-slate-900 placeholder-slate-400"
                        />
                        {(practiceMode || revealedModel.has(gi)) && q.expectedAnswer && (
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={() => toggleRevealModel(gi)}
                              className="text-primary font-semibold text-sm flex items-center gap-1"
                            >
                              {revealedModel.has(gi) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              {revealedModel.has(gi) ? 'Hide' : 'Reveal'} Model Answer
                            </button>
                            {revealedModel.has(gi) && (
                              <div className="mt-2 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                                <p className="text-sm font-medium text-slate-700">{q.expectedAnswer}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 px-4 py-4 sticky bottom-0">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={markedForReview.has(currentStationIndex)}
              onChange={toggleMarkForReview}
              className="rounded text-amber-500"
            />
            <span className="text-sm font-medium text-slate-600">Mark for Review</span>
          </label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStationIndex === 0}
              className="flex items-center gap-2 px-6 py-2.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!isCurrentStationValid || submitting}
              className="flex items-center gap-2 px-8 py-2.5 font-bold text-white bg-primary rounded-xl shadow-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="animate-pulse">Submitting...</span>
              ) : isLastStation ? (
                <>
                  Submit
                  <ArrowRight className="w-5 h-5" />
                </>
              ) : (
                <>
                  Next Station
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </footer>

      {zoomImageUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70"
          onClick={() => setZoomImageUrl(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative max-w-4xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={zoomImageUrl}
              alt="Zoomed"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
            <button
              onClick={() => setZoomImageUrl(null)}
              className="absolute top-2 right-2 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white"
            >
              <X className="w-6 h-6 text-slate-700" />
            </button>
          </motion.div>
        </div>
      )}

      <ConfirmDialog
        open={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        title="Submit OSPE Attempt"
        message="Are you sure you want to submit? You cannot change your answers after submitting."
        confirmLabel="Submit"
        danger={false}
        onConfirm={() => {
          setShowSubmitConfirm(false);
          handleSubmitAttempt();
        }}
      />
    </div>
  );
}
