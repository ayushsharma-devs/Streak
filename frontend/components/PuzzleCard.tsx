"use client";

import React from "react";
import { SafePuzzle } from "@/lib/types";

interface PuzzleCardProps {
  puzzle: SafePuzzle;
  dateStr: string;
}

export const PuzzleCard: React.FC<PuzzleCardProps> = ({ puzzle, dateStr }) => {
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
    <section
      aria-labelledby="riddle-heading"
      className="w-full animate-fade-in-scale"
    >
      <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
        {/* Header row */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <time
            dateTime={dateStr}
            className="text-xs font-semibold uppercase tracking-widest text-muted"
          >
            {formattedDate}
          </time>
          <span className="text-xs font-mono bg-bg text-muted border border-border px-2 py-0.5 rounded-lg">
            #{puzzle.id}
          </span>
        </div>

        {/* Clue */}
        <h2
          id="riddle-heading"
          className="text-lg sm:text-xl font-medium text-ink leading-relaxed font-serif mb-5"
        >
          &ldquo;{puzzle.clue}&rdquo;
        </h2>

        {/* Word-length hint badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted">
            Hint:
          </span>
          {puzzle.word_lengths.map((len, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-accent/25 bg-accent/10 text-orange-700"
            >
              {len} {len === 1 ? "letter" : "letters"}
            </span>
          ))}
          <span className="text-xs text-muted">
            ({wordCount === 1 ? "1 word" : `${wordCount} words`},{" "}
            {totalLetters} total)
          </span>
        </div>
      </div>
    </section>
  );
};
