"use client";

import React from "react";

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading today's riddle…",
}) => {
  const [showColdStart, setShowColdStart] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setShowColdStart(true), 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center p-10 text-center space-y-4 max-w-md mx-auto"
    >
      <div className="relative">
        <div
          className="w-10 h-10 rounded-full border-2 border-border animate-spin"
          style={{ borderTopColor: "#FF6B00" }}
        />
      </div>

      <p className="text-sm font-medium text-muted">{message}</p>

      {showColdStart && (
        <div
          className="mt-2 p-3 rounded-xl border text-xs animate-fade-in max-w-xs"
          style={{
            background: "rgba(255,107,0,0.07)",
            borderColor: "rgba(255,107,0,0.25)",
            color: "#E55F00",
          }}
        >
          <p className="font-semibold mb-0.5">Waking up the server…</p>
          <p className="text-muted">This might take a few seconds. Hang tight!</p>
        </div>
      )}
    </div>
  );
};
