'use client';

import { useOnline } from '@/hooks/useOnline';

export function OfflineBanner() {
  const isOnline = useOnline();
  if (isOnline) return null;

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2 text-center text-sm text-yellow-700 dark:text-yellow-400">
      You are offline. Some features may not work until your connection is restored.
    </div>
  );
}
