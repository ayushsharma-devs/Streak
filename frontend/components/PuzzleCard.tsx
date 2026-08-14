"use client";

import React from "react";
import { SafePuzzle } from "@/lib/types";

interface PuzzleCardProps {
  puzzle: SafePuzzle;
  dateStr: string;
}

export const PuzzleCard: React.FC<PuzzleCardProps> = ({ puzzle, dateStr }) => {
  // Format game date nicely for display
  const formattedDate = (() => {
    try {
      const [year, month, day] = dateStr.split("-").map(Number);
      const d = new Date(Date.UTC(year, month - 1, day));
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      });
    } catch {
      return dateStr;
    }
  })();

  const totalLetters = puzzle.word_lengths.reduce((acc, len) => acc + len, 0);
  const wordCount = puzzle.word_lengths.length;

  return (
    <section aria-labelledby="riddle-heading" className="w-full">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800/80 pb-4 mb-6">
          <time dateTime={dateStr} className="text-xs font-semibold uppercase tracking-widest text-stone-600 dark:text-stone-300">
            {formattedDate}
          </time>
          <span className="text-xs font-mono bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded">
            Puzzle #{puzzle.id}
          </span>
        </div>

        <div className="space-y-4">
          <h2 id="riddle-heading" className="text-lg sm:text-xl font-medium text-stone-900 dark:text-stone-100 leading-relaxed font-serif">
            "{puzzle.clue}"
          </h2>

          <div className="pt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-stone-600 dark:text-stone-300">Hint:</span>
            {puzzle.word_lengths.map((len, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/60"
              >
                {len} {len === 1 ? "letter" : "letters"}
              </span>
            ))}
            <span className="text-xs text-stone-500 dark:text-stone-400">
              ({wordCount === 1 ? "Single word" : `${wordCount} words`}, {totalLetters} total letters)
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
