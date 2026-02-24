import { useState, useEffect } from 'react';

const PARSE_LOADING_MESSAGES = [
  '✨ Magic AI is reading your MCQs...',
  '🧠 Smart parsing in progress...',
  '🔮 Turning text into structured questions...',
  '✨ Almost there, one moment...',
  '📚 AI is organizing your questions...',
  '🌟 Parsing with a little magic...',
  '💡 Understanding your format...',
  '⚡ AI at work...',
];

const INTERVAL_MS = 2200;

/**
 * Returns a cycling message string while isLoading is true. Use for parse/preview loading UX.
 * @param {boolean} isLoading
 * @returns {string} Current message to show (or empty when not loading).
 */
export function useParseLoadingMessage(isLoading) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setIndex(0);
      return;
    }
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % PARSE_LOADING_MESSAGES.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [isLoading]);

  if (!isLoading) return '';
  return PARSE_LOADING_MESSAGES[index];
}

export { PARSE_LOADING_MESSAGES };
