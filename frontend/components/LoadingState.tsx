"use client";

import React, { useEffect, useState } from "react";

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading today's riddle...",
}) => {
  const [showColdStartNotice, setShowColdStartNotice] = useState(false);

  useEffect(() => {
    // Cold start UX timer (2.5 seconds) for hosted environments like Render
    const timer = setTimeout(() => {
      setShowColdStartNotice(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-md mx-auto"
    >
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-stone-200 dark:border-stone-800 animate-spin border-t-amber-600 dark:border-t-amber-500" />
      </div>

      <p className="text-stone-600 dark:text-stone-300 font-medium text-sm">
        {message}
      </p>

      {showColdStartNotice && (
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-lg text-xs text-amber-800 dark:text-amber-300 transition-opacity duration-300 animate-fade-in max-w-xs">
          <p className="font-semibold mb-0.5">Cold start notice</p>
          <p>Taking a little longer than usual — the server may be waking up.</p>
        </div>
      )}
    </div>
  );
};
