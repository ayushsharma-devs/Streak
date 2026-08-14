"use client";

import React, { useEffect, useState } from "react";
import { secondsUntilUtcMidnight } from "@/lib/time";

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export const CountdownTimer: React.FC = () => {
  const [seconds, setSeconds] = useState<number | null>(null);

  useEffect(() => {
    // Initialise after mount (SSR safe)
    setSeconds(secondsUntilUtcMidnight());

    const id = setInterval(() => {
      setSeconds(secondsUntilUtcMidnight());
    }, 1000);

    return () => clearInterval(id);
  }, []);

  if (seconds === null) return null;

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-semibold uppercase tracking-widest text-muted">
        Next riddle in
      </span>
      <span
        className="text-2xl font-black tracking-tight font-mono tabular-nums text-accent"
        aria-live="polite"
        aria-label={`Next riddle in ${formatTime(seconds)}`}
      >
        {formatTime(seconds)}
      </span>
    </div>
  );
};
