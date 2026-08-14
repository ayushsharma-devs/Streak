"use client";

import React from "react";

interface StreakDisplayProps {
  currentStreak: number;
  highestStreak: number;
  username?: string | null;
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({
  currentStreak,
  highestStreak,
  username,
}) => {
  return (
    <div className="w-full flex flex-col items-center gap-3 animate-fade-up">
      {/* Player badge */}
      <div
        className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium text-muted"
        style={{ background: "rgba(0,0,0,0.04)", borderColor: "var(--border)" }}
      >
        <span aria-hidden="true">👤</span>
        <span>{username ? `@${username}` : "Anonymous"}</span>
      </div>

      {/* Streak counters */}
      <div className="flex items-center justify-center gap-3">
        {/* Current streak */}
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all"
          style={
            currentStreak > 0
              ? {
                  background: "rgba(255,107,0,0.08)",
                  borderColor: "rgba(255,107,0,0.30)",
                  color: "#FF6B00",
                }
              : {
                  background: "#F5F5F5",
                  borderColor: "var(--border)",
                  color: "var(--muted)",
                }
          }
        >
          <span className="text-lg" aria-hidden="true">🔥</span>
          <div className="text-left">
            <div className="text-[10px] uppercase tracking-wider font-semibold opacity-75">
              Current
            </div>
            <div className="text-xl font-black leading-none">{currentStreak}</div>
          </div>
        </div>

        {/* Best streak */}
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border"
          style={{
            background: "#F5F5F5",
            borderColor: "var(--border)",
            color: "var(--ink)",
          }}
        >
          <span className="text-lg" aria-hidden="true">🏆</span>
          <div className="text-left">
            <div className="text-[10px] uppercase tracking-wider font-semibold opacity-60">
              Best
            </div>
            <div className="text-xl font-black leading-none">{highestStreak}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
