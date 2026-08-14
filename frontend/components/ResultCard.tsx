"use client";

import React from "react";
import { CountdownTimer } from "./CountdownTimer";

interface ResultCardProps {
  isCorrect: boolean;
  currentStreak: number;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  isCorrect,
  currentStreak,
}) => {
  return (
    <div
      role="region"
      aria-label="Today's result"
      className={`w-full rounded-2xl border animate-fade-in-scale text-center overflow-hidden ${isCorrect ? "border-accent/30 bg-accent/5" : "border-border bg-neutral-50"}`}
    >
      {/* Top accent strip */}
      {isCorrect && (
        <div className="h-1 w-full bg-accent" />
      )}

      <div className="p-6 sm:p-8 space-y-4">
        {/* Status */}
        <div className="space-y-1">
          <h3 className={`text-xl font-black tracking-tight ${isCorrect ? "text-accent" : "text-ink"}`}>
            {isCorrect ? "Correct!" : "Not today."}
          </h3>
          <p className="text-sm text-muted max-w-xs mx-auto">
            {isCorrect
              ? `Outstanding — your streak is now ${currentStreak} ${
                  currentStreak === 1 ? "day" : "days"
                }.`
              : "Your streak was reset, but tomorrow is another chance."}
          </p>
        </div>

        {/* Streak badge (if correct) */}
        {isCorrect && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-accent/30 bg-accent/10 font-bold text-sm text-accent">
            <span>🔥</span>
            <span>{currentStreak}-day streak</span>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-border pt-4">
          <CountdownTimer />
        </div>
      </div>
    </div>
  );
};
