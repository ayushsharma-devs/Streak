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
      className="w-full rounded-2xl border animate-fade-in-scale text-center overflow-hidden"
      style={{
        background: isCorrect ? "rgba(255,107,0,0.06)" : "#F9F9F9",
        borderColor: isCorrect ? "rgba(255,107,0,0.30)" : "var(--border)",
      }}
    >
      {/* Top accent strip */}
      {isCorrect && (
        <div className="h-1 w-full" style={{ background: "#FF6B00" }} />
      )}

      <div className="p-6 sm:p-8 space-y-4">
        {/* Status */}
        <div className="space-y-1">
          <h3
            className="text-xl font-black tracking-tight"
            style={{ color: isCorrect ? "#FF6B00" : "#111111" }}
          >
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-sm"
            style={{
              background: "rgba(255,107,0,0.1)",
              borderColor: "rgba(255,107,0,0.3)",
              color: "#FF6B00",
            }}
          >
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
