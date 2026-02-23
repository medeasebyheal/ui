export default function ConfirmDialog({
  open,
  onClose,
  title = 'Confirm',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  danger = true,
  children,
}) {
  if (!open) return null;
  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };
  const body = children != null ? children : (message != null && message !== '' ? <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{message}</p> : null);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/60" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-sm w-full p-4 border border-gray-200 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-heading font-bold text-gray-900 dark:text-slate-100 mb-2">{title}</h2>
        {body}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-3 py-2 text-sm font-medium rounded-lg ${danger ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-primary text-white hover:bg-primary/90'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
