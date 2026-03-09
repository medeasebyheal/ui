import { useEffect } from 'react';

/**
 * Registers document-level listeners to deter casual copy/right-click/dev-tools on protected content.
 * Call once per protected page (quiz, topic detail, etc.). Cleans up on unmount.
 */
export function useProtectedContent() {
  useEffect(() => {
    const preventContextMenu = (e) => e.preventDefault();
    const preventCopy = (e) => e.preventDefault();
    const preventSelect = (e) => e.preventDefault();

    const isProduction = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.NODE_ENV === 'production';

    const preventDevToolsShortcuts = (e) => {
      // Only block devtools shortcuts in production builds.
      if (!isProduction) return;

      // if (e.key === 'F12') {
      //   e.preventDefault();
      //   return;
      // }
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
    document.addEventListener('copy', preventCopy);
    document.addEventListener('selectstart', preventSelect);
    document.addEventListener('select', preventSelect);
    document.addEventListener('keydown', preventDevToolsShortcuts);

    return () => {
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('selectstart', preventSelect);
      document.removeEventListener('select', preventSelect);
      document.removeEventListener('keydown', preventDevToolsShortcuts);
    };
  }, []);
}
