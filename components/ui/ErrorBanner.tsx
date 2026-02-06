'use client';

export function ErrorBanner({
  message,
  onRetry,
  onDismiss,
}: {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}) {
  return (
    <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400 flex items-center justify-between">
      <span>{message}</span>
      <div className="flex gap-2 ml-4 shrink-0">
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs font-medium underline hover:no-underline"
          >
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
