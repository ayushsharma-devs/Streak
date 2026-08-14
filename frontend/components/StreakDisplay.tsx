"use client";

import React from "react";

interface StreakDisplayProps {
  currentStreak: number;
  highestStreak: number;
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({
  currentStreak,
  highestStreak,
}) => (
  <div className="w-full flex justify-center animate-fade-up">
    <div className="flex items-center justify-center gap-3">
      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${currentStreak > 0 ? "border-accent/30 bg-accent/10 text-accent" : "border-border bg-neutral-100 text-muted"}`}>
        <span className="text-lg" aria-hidden="true">🔥</span>
        <div className="text-left">
          <div className="text-[10px] uppercase tracking-wider font-semibold opacity-75">Current</div>
          <div className="text-xl font-black leading-none">{currentStreak}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-neutral-100 text-ink">
        <span className="text-lg" aria-hidden="true">🏆</span>
        <div className="text-left">
          <div className="text-[10px] uppercase tracking-wider font-semibold opacity-60">Best</div>
          <div className="text-xl font-black leading-none">{highestStreak}</div>
        </div>
      </div>
    </div>
  </div>
);
