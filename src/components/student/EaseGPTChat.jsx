import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send } from 'lucide-react';
import api from '../../api/client';
import { useProtectedContent } from '../../hooks/useProtectedContent';

const LOADING_PHRASES = [
  'EaseGPT is thinking... 🤔',
  'Crafting your explanation... ✨',
  'Connecting the concepts... 🧠',
  'Almost there... 📚',
  'Putting it in simple words... 💡',
  'One moment, polishing the answer... 🌟',
];

const MAX_INPUT_LENGTH = 500;

/** Escape HTML to prevent XSS. */
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Format chat message with simple markdown-like rules:
 * - Headings: lines starting with "### " → <h3>
 * - Unordered lists: lines starting with "- " → grouped into <ul><li>...</li></ul>
 * - Bold: **text** → <strong>
 * - Italic: *text* → <em>
 * - Paragraphs / newlines preserved
 *
 * Safe for dangerouslySetInnerHTML (input is escaped first).
 */
function formatMessageContent(text) {
  if (typeof text !== 'string') return '';
  const escaped = escapeHtml(text);
  const lines = escaped.split(/\r?\n/);
  let out = '';
  let inList = false;

  const applyInlineFormatting = (s) =>
    s
      .replace(/\*\*([^*]*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*\s][^*]*?)\*/g, '<em>$1</em>');

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    if (line.startsWith('### ')) {
      if (inList) {
        out += '</ul>';
        inList = false;
      }
      out += `<h3 class="text-sm font-semibold mb-2">${applyInlineFormatting(line.slice(4).trim())}</h3>`;
      continue;
    }

    if (line.startsWith('- ')) {
      if (!inList) {
        inList = true;
        out += '<ul class="ml-4 list-disc my-2">';
      }
      out += `<li>${applyInlineFormatting(line.slice(2).trim())}</li>`;
      continue;
    }

    // empty line -> paragraph break
    if (line === '') {
      if (inList) {
        out += '</ul>';
        inList = false;
      }
      out += '<br/>';
      continue;
    }

    // regular line
    if (inList) {
      out += '</ul>';
      inList = false;
    }
    out += `<div>${applyInlineFormatting(line)}</div>`;
  }

  if (inList) out += '</ul>';
  return out;
}

/** Build first message from MCQ context: question, correct answer, and explanation (truncated to maxLength). */
function buildFirstMessage(context, maxLength = 500) {
  const question = (context?.question || '').trim();
  const options = Array.isArray(context?.options) ? context.options : [];
  const correctIdx = context?.correctIndex ?? 0;
  const correctAnswerText = (options[correctIdx] || '').trim();
  const explanation = (context?.explanation || '').trim();
  const raw = `Question: ${question}\n\nCorrect answer: ${correctAnswerText}\n\nExplanation: ${explanation}\n\nPlease help me understand this.`;
  return raw.slice(0, maxLength).trim() || 'Please explain this question and the correct answer.';
}

async function sendEaseGPTMessage(apiClient, { mode = 'mcq', mcqId, ospeId, questionIndex, context, message, history }) {
  const payloadBase = {
    message,
    history,
  };
  if (mode === 'ospe') {
    // Always call the OSPE-specific backend endpoint with a normalized context.
    const payload = {
      ...payloadBase,
      ospeId,
      questionIndex,
      mode: 'ospe',
      context: {
        questionText: context.questionText || context.question,
        options: context.options,
        correctIndex: context.correctIndex,
        selectedIndex: context.selectedIndex,
        explanation: context.explanation || context.expectedAnswer,
        studentAnswer: context.studentAnswer,
        stationNote: context.stationNote,
        imageDescription: context.imageDescription,
      },
    };
    const { data } = await apiClient.post('/ospes/easegpt', payload, { skipLoader: true });
    return data;
  }
  // default mcq endpoint
  const payload = {
    ...payloadBase,
    mcqId,
    context: {
      question: context.question,
      options: context.options,
      correctIndex: context.correctIndex,
      selectedIndex: context.selectedIndex,
      explanation: context.explanation,
    },
  };
  const { data } = await apiClient.post('/mcqs/easegpt', payload, { skipLoader: true });
  return data;
}

/** Normalize key for messages by mode and identifier. */
function toKey({ mode = 'mcq', mcqId, ospeId, questionIndex }) {
  if (mode === 'ospe') return `ospe:${ospeId}:${questionIndex}`;
  return mcqId != null ? `mcq:${String(mcqId)}` : null;
}

const MAX_QUERIES = 5;

const EaseGPTChat = forwardRef(function EaseGPTChat({ enabled, mcqId, context, mode = 'mcq', ospeId, ospeQuestionIndex, onOpen }, ref) {
  const mcqKey = toKey({ mode, mcqId, ospeId, questionIndex: ospeQuestionIndex });
  const [open, setOpen] = useState(false);
  const [messagesByMcq, setMessagesByMcq] = useState({});
  const [queriesUsedByKey, setQueriesUsedByKey] = useState({});
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);
  const [typingState, setTypingState] = useState(null); // { mcqId, messageIndex, fullText, displayedLength }
  const [error, setError] = useState(null);
  const [pendingFirstMessage, setPendingFirstMessage] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const firstMessageRequestStartedRef = useRef(false);

  useProtectedContent();

  useEffect(() => {
    if (!loading) {
      setLoadingPhraseIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingPhraseIndex((i) => (i + 1) % LOADING_PHRASES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (!typingState) return;
    const interval = setInterval(() => {
      setTypingState((prev) => {
        if (!prev) return null;
        const step = 2;
        const next = Math.min(prev.displayedLength + step, prev.fullText.length);
        if (next >= prev.fullText.length) return null;
        return { ...prev, displayedLength: next };
      });
    }, 20);
    return () => clearInterval(interval);
  }, [typingState?.mcqId, typingState?.messageIndex]);

  useImperativeHandle(ref, () => ({
    open: () => handleOpen(),
    openAndSendFirstMessage: (opts = {}) => {
      // opts: { mode, ospeId, questionIndex, contextOverride }
      const { mode: oMode, ospeId: oOspeId, questionIndex: oQuestionIndex, contextOverride } = opts;
      if (!enabled || (!mcqId && !oMode && !oOspeId && oQuestionIndex == null && !contextOverride)) return;
      // set up context for send
      setOpen(true);
      setError(null);
      // store pending first message info in pendingFirstMessage ref state
      pendingFirstMessageRef.current = { mode: oMode || mode, ospeId: oOspeId || ospeId, questionIndex: oQuestionIndex ?? ospeQuestionIndex, contextOverride };
      setPendingFirstMessage(true);
      onOpen?.();
    },
  }), [enabled, mcqId, context, onOpen]);

  const pendingFirstMessageRef = useRef(null);

  const messages = messagesByMcq[mcqKey] || [];
  const canSend = enabled && !!mcqKey && input.trim().length > 0 && !loading;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, typingState?.displayedLength]);

  useEffect(() => {
    setTypingState(null);
    firstMessageRequestStartedRef.current = false;
  }, [mcqKey]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (!open) firstMessageRequestStartedRef.current = false;
  }, [open]);

  const handleOpen = () => {
    if (!enabled) return;
    setOpen(true);
    setError(null);
    onOpen?.();
  };

  useEffect(() => {
    if (!open || !pendingFirstMessage || !mcqKey || loading) return;
    if (firstMessageRequestStartedRef.current) return;
    firstMessageRequestStartedRef.current = true;
    setPendingFirstMessage(false);
    const pending = pendingFirstMessageRef.current || {};
    const useMode = pending.mode || mode;
    const useOspeId = pending.ospeId || ospeId;
    const useQuestionIndex = pending.questionIndex ?? ospeQuestionIndex;
    const ctx = pending.contextOverride || context || {};
    // normalize context keys so buildFirstMessage receives expected fields (question, options, correctIndex, explanation)
    let text = '';
    let contentForChat = '';
    if (useMode === 'ospe') {
      const qText = (ctx.questionText || ctx.question || '').trim();
      const opts = Array.isArray(ctx.options) ? ctx.options : [];
      const selectedIdx = typeof ctx.selectedIndex === 'number' ? ctx.selectedIndex : -1;
      const correctIdx = typeof ctx.correctIndex === 'number' ? ctx.correctIndex : 0;
      const hasWrittenAnswer = String(ctx.studentAnswer || '').trim().length > 0;
      const isOspeMcq = opts.length > 0 && selectedIdx >= 0 && !hasWrittenAnswer;

      if (isOspeMcq) {
        // OSPE MCQ: ask to explain selected vs correct (include image description for context).
        const parts = [];
        if (qText) parts.push(`Question: ${qText}`);
        if (ctx.imageDescription) parts.push(`Image: ${String(ctx.imageDescription).trim()}`);
        if (opts.length)
          parts.push(`Options: ${opts.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join(' | ')}`);
        const selectedOpt = selectedIdx >= 0 && selectedIdx < opts.length ? opts[selectedIdx] : '';
        const correctOpt = opts[correctIdx];
        parts.push(`My selection: ${selectedIdx} (${selectedOpt})`);
        parts.push(`Correct answer: ${correctIdx} (${correctOpt || ''})`);
        if (ctx.explanation || ctx.expectedAnswer)
          parts.push(`Explanation: ${String(ctx.explanation || ctx.expectedAnswer).trim()}`);
        const mcqInstruction = 'Please explain why my selected answer is correct or incorrect and the key concept.';
        text = [...parts, '', mcqInstruction].filter(Boolean).join('\n\n').slice(0, MAX_INPUT_LENGTH);
        contentForChat = parts.filter(Boolean).join('\n\n').slice(0, MAX_INPUT_LENGTH);
      } else {
        // OSPE viva (written answer): Question, Your Answer, Correct answer, classification instruction (API only).
        const parts = [];
        if (qText) parts.push(`Question: ${qText}`);
        if (ctx.studentAnswer) parts.push(`Your Answer: ${String(ctx.studentAnswer).trim()}`);
        if (ctx.explanation || ctx.expectedAnswer) parts.push(`Correct answer / explanation: ${String(ctx.explanation || ctx.expectedAnswer).trim()}`);
        const instruction =
          'Please: (1) classify the student answer as Correct / Partially correct / Incorrect / Misconception, (2) give the recommended answer (one short line), (3) explain the underlying concept in 2-3 short sentences. Keep the reply concise.';
        const partsForApi = [...parts, '', instruction];
        text = partsForApi.filter(Boolean).join('\n\n').slice(0, MAX_INPUT_LENGTH);
        contentForChat = parts.filter(Boolean).join('\n\n').slice(0, MAX_INPUT_LENGTH);
      }
    } else {
      const normCtx = {
        question: (ctx.question || ctx.questionText || '').trim(),
        options: Array.isArray(ctx.options) ? ctx.options : [],
        correctIndex: typeof ctx.correctIndex === 'number' ? ctx.correctIndex : (typeof ctx.correctIdx === 'number' ? ctx.correctIdx : undefined),
        explanation: (ctx.explanation || ctx.expectedAnswer || '').trim(),
      };
      text = buildFirstMessage(normCtx, MAX_INPUT_LENGTH);
      contentForChat = text;
    }
    const newUserMessage = { role: 'user', content: contentForChat || text };
    setMessagesByMcq((prev) => ({
      ...prev,
      [mcqKey]: [...(prev[mcqKey] || []), newUserMessage],
    }));
    setLoading(true);
    setError(null);

    const history = (messagesByMcq[mcqKey] || []).map((m) => ({ role: m.role, content: m.content }));
    console.log('history', history);
    console.log('text', text);
    console.log('useMode', useMode);
    console.log('mcqId', mcqId);
    console.log('useOspeId', useOspeId);
    console.log('useQuestionIndex', useQuestionIndex);
    console.log('context', ctx);
    sendEaseGPTMessage(api, { mode: useMode, mcqId: mcqId, ospeId: useOspeId, questionIndex: useQuestionIndex, context: ctx, message: text, history })
      .then((data) => {
        firstMessageRequestStartedRef.current = false;
        const fullText = data.reply || '';
        // increment queries used
        setQueriesUsedByKey((prev) => {
          const cur = prev[mcqKey] || 0;
          return { ...prev, [mcqKey]: cur + 1 };
        });
        setMessagesByMcq((prev) => {
          const list = prev[mcqKey] || [];
          const newIndex = list.length;
          queueMicrotask(() => setTypingState({ mcqId: mcqKey, messageIndex: newIndex, fullText, displayedLength: 0 }));
          return { ...prev, [mcqKey]: [...list, { role: 'model', content: fullText }] };
        });
      })
      .catch((err) => {
        firstMessageRequestStartedRef.current = false;
        const status = err.response?.status;
        const msg = err.response?.data?.message || 'Something went wrong. Try again.';
        if (status === 429) {
          setError('AI is temporarily at capacity. Please try again in a few minutes.');
        } else {
          setError(msg);
        }
        setMessagesByMcq((prev) => ({ ...prev, [mcqKey]: (prev[mcqKey] || []).slice(0, -1) }));
      })
      .finally(() => setLoading(false));
  }, [open, pendingFirstMessage, mcqKey, loading]);

  const handleSend = async () => {
    const text = input.trim().slice(0, MAX_INPUT_LENGTH);
    if (!text || !mcqKey || !context || !canSend) return;
    // check queries used
    const used = queriesUsedByKey[mcqKey] || 0;
    if (used >= MAX_QUERIES) {
      setError(`You have used the maximum ${MAX_QUERIES} queries for this question. Move to the next question to use EaseGPT again.`);
      return;
    }

    setInput('');
    setError(null);

    const newUserMessage = { role: 'user', content: text };
    setMessagesByMcq((prev) => ({
      ...prev,
      [mcqKey]: [...(prev[mcqKey] || []), newUserMessage],
    }));
    setLoading(true);

    try {
      const history = (messagesByMcq[mcqKey] || []).map((m) => ({ role: m.role, content: m.content }));
      const data = await sendEaseGPTMessage(api, { mode, mcqId, ospeId, questionIndex: ospeQuestionIndex, context, message: text, history });

      const fullText = data.reply || '';
      // increment queries used
      setQueriesUsedByKey((prev) => {
        const cur = prev[mcqKey] || 0;
        return { ...prev, [mcqKey]: cur + 1 };
      });
      setMessagesByMcq((prev) => {
        const list = prev[mcqKey] || [];
        const newIndex = list.length;
        queueMicrotask(() => setTypingState({ mcqId: mcqKey, messageIndex: newIndex, fullText, displayedLength: 0 }));
        return { ...prev, [mcqKey]: [...list, { role: 'model', content: fullText }] };
      });
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || 'Something went wrong. Try again.';
      if (status === 429) {
        setError('AI is temporarily at capacity. Please try again in a few minutes.');
      } else {
        setError(msg);
      }
      setMessagesByMcq((prev) => ({
        ...prev,
        [mcqKey]: (prev[mcqKey] || []).slice(0, -1),
      }));
    } finally {
      setLoading(false);
    }
  };

  if (!enabled) return null;

  return (
    <>
      {/* FAB */}
      <motion.button
        type="button"
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-white font-semibold shadow-lg shadow-primary/30 hover:bg-teal-700 transition-colors"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-label="Open EaseGPT"
      >
        <Sparkles className="w-5 h-5" />
        <span>EaseGPT</span>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <motion.div
              className="fixed bottom-6 right-6 z-50 w-[min(380px,95vw)] max-h-[70vh] flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">EaseGPT</span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px] max-h-[40vh] select-none">
                {messages.length === 0 && !loading && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
                    Ask about this question: why your answer was wrong, why the correct answer is right, or the underlying concept.
                  </p>
                )}
                {messages.map((m, i) => {
                  const isTyping = m.role === 'model' && typingState && typingState.mcqId === mcqKey && typingState.messageIndex === i;
                  const displayContent = isTyping
                    ? typingState.fullText.slice(0, typingState.displayedLength)
                    : m.content;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                          m.role === 'user'
                            ? 'bg-primary text-white rounded-br-md'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-md'
                        }`}
                      >
                        <p
                          className="break-words [&_strong]:font-bold [&_em]:italic inline"
                          dangerouslySetInnerHTML={{ __html: formatMessageContent(displayContent) }}
                        />
                        {isTyping && (
                          <span
                            className="inline-block w-0.5 h-4 align-middle bg-slate-500 dark:bg-slate-400 ml-0.5 animate-pulse"
                            aria-hidden
                          />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                {loading && (
                  <motion.div
                    key={loadingPhraseIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="rounded-2xl rounded-bl-md px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-sm">
                      {LOADING_PHRASES[loadingPhraseIndex]}
                    </div>
                  </motion.div>
                )}
                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT_LENGTH))}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Ask about this question..."
                    maxLength={MAX_INPUT_LENGTH}
                    disabled={loading}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!canSend}
                    className="p-3 rounded-xl bg-primary text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Send"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 text-right">
                  {input.length}/{MAX_INPUT_LENGTH}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
});

export default EaseGPTChat;
