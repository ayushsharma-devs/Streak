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
          className="text-lg sm:text-xl font-medium text-ink leading-relaxed font-serif mb-6"
        >
          &ldquo;{puzzle.clue}&rdquo;
        </h2>

        {/* Letter-box placeholders */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            Answer&nbsp;—&nbsp;
            {wordCount === 1
              ? `${totalLetters} letters`
              : `${wordCount} words, ${totalLetters} letters total`}
          </p>

          {/* One row of boxes per word */}
          <div className="flex flex-wrap gap-3">
            {puzzle.word_lengths.map((len, wi) => (
              <div key={wi} className="flex items-center gap-1">
                {Array.from({ length: len }).map((_, li) => (
                  <div
                    key={li}
                    className="w-8 h-9 flex items-end justify-center pb-1 border-b-2 border-ink/30"
                    aria-hidden="true"
                  >
                    <span className="text-[10px] text-muted/40 leading-none select-none">
                      _
                    </span>
                  </div>
                ))}
                {wi < puzzle.word_lengths.length - 1 && (
                  <span className="mx-1 text-xs text-muted/50 select-none">
                    /
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Word-length badges */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {puzzle.word_lengths.map((len, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border"
                style={{
                  background: "rgba(255,107,0,0.08)",
                  borderColor: "rgba(255,107,0,0.25)",
                  color: "#E55F00",
                }}
              >
                {len} {len === 1 ? "letter" : "letters"}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
