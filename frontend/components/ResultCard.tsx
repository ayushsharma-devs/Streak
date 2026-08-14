"use client";

import React from "react";

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
      className={`w-full p-6 sm:p-8 rounded-2xl border transition-all animate-fade-in text-center space-y-4 ${
        isCorrect
          ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100 shadow-sm"
          : "bg-stone-100 dark:bg-stone-900 border-stone-300 dark:border-stone-800 text-stone-900 dark:text-stone-100 shadow-sm"
      }`}
    >
      <div className="text-4xl" aria-hidden="true">
        {isCorrect ? "🎉" : "💡"}
      </div>

      <div className="space-y-1">
        <h3 className="text-xl font-bold">
          {isCorrect ? "Correct! Well Done." : "Not quite today!"}
        </h3>
        <p className="text-sm opacity-90 max-w-sm mx-auto">
          {isCorrect
            ? `You solved today's riddle and your streak is now ${currentStreak} ${
                currentStreak === 1 ? "day" : "days"
              }!`
            : "Your streak was reset, but tomorrow is another chance to start anew."}
        </p>
      </div>

      <div className="pt-4 border-t border-current/10 max-w-xs mx-auto">
        <div className="text-xs uppercase tracking-wider font-semibold opacity-75 mb-1">
          Next Puzzle
        </div>
        <p className="text-xs text-stone-600 dark:text-stone-400">
          A new riddle arrives at midnight UTC. Return tomorrow to keep playing!
        </p>
      </div>
    </div>
  );
};
