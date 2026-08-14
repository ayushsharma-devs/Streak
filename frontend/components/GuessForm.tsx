"use client";

import React, { useEffect, useRef, useState } from "react";

interface GuessFormProps {
  onSubmit: (guess: string) => Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
  wordLengths: number[];
}

export const GuessForm: React.FC<GuessFormProps> = ({
  onSubmit,
  isLoading,
  disabled = false,
  wordLengths,
}) => {
  // Flatten: track each letter as a separate slot
  // We store [wordIndex][letterIndex] → char
  const [letters, setLetters] = useState<string[][]>(
    () => wordLengths.map((len) => Array(len).fill(""))
  );
  const [clientError, setClientError] = useState<string | null>(null);

  // Flat ref array: refs[wordIndex][letterIndex]
  const inputRefs = useRef<(HTMLInputElement | null)[][]>(
    wordLengths.map((len) => Array(len).fill(null))
  );

  // Reset boxes if wordLengths change (new puzzle)
  useEffect(() => {
    setLetters(wordLengths.map((len) => Array(len).fill("")));
    inputRefs.current = wordLengths.map((len) => Array(len).fill(null));
  }, [wordLengths]);

  // Auto-focus first box on mount
  useEffect(() => {
    inputRefs.current[0]?.[0]?.focus();
  }, []);

  const focusAt = (wi: number, li: number) => {
    inputRefs.current[wi]?.[li]?.focus();
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    wi: number,
    li: number
  ) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      // If current box is empty, move back
      if (!letters[wi][li]) {
        if (li > 0) {
          setLetters((prev) => {
            const next = prev.map((w) => [...w]);
            next[wi][li - 1] = "";
            return next;
          });
          focusAt(wi, li - 1);
        } else if (wi > 0) {
          const prevLen = wordLengths[wi - 1];
          setLetters((prev) => {
            const next = prev.map((w) => [...w]);
            next[wi - 1][prevLen - 1] = "";
            return next;
          });
          focusAt(wi - 1, prevLen - 1);
        }
      } else {
        // Clear current
        setLetters((prev) => {
          const next = prev.map((w) => [...w]);
          next[wi][li] = "";
          return next;
        });
      }
      return;
    }

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (li > 0) focusAt(wi, li - 1);
      else if (wi > 0) focusAt(wi - 1, wordLengths[wi - 1] - 1);
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (li < wordLengths[wi] - 1) focusAt(wi, li + 1);
      else if (wi < wordLengths.length - 1) focusAt(wi + 1, 0);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    wi: number,
    li: number
  ) => {
    setClientError(null);
    const raw = e.target.value;
    // Take the last typed character (handles paste of single char too)
    const char = raw.replace(/[^a-zA-Z\s]/g, "").slice(-1).toLowerCase();
    if (!char) return;

    setLetters((prev) => {
      const next = prev.map((w) => [...w]);
      next[wi][li] = char;
      return next;
    });

    // Advance focus
    if (li < wordLengths[wi] - 1) {
      focusAt(wi, li + 1);
    } else if (wi < wordLengths.length - 1) {
      focusAt(wi + 1, 0);
    }
  };

  const isFilled = letters.every((word) => word.every((ch) => ch !== ""));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);

    if (!isFilled) {
      setClientError("Fill in all the letter boxes before submitting.");
      return;
    }

    const guess = letters.map((word) => word.join("")).join(" ");
    await onSubmit(guess);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5" noValidate>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-4">
          Type your answer
        </p>

        {/* Letter boxes — one row per word */}
        <div className="flex flex-wrap gap-4">
          {wordLengths.map((len, wi) => (
            <div key={wi} className="flex items-center gap-1.5">
              {Array.from({ length: len }).map((_, li) => (
                <input
                  key={li}
                  ref={(el) => {
                    if (!inputRefs.current[wi]) inputRefs.current[wi] = [];
                    inputRefs.current[wi][li] = el;
                  }}
                  type="text"
                  inputMode="text"
                  maxLength={2}
                  value={letters[wi]?.[li] ?? ""}
                  disabled={disabled || isLoading}
                  onChange={(e) => handleChange(e, wi, li)}
                  onKeyDown={(e) => handleKeyDown(e, wi, li)}
                  onFocus={(e) => e.target.select()}
                  aria-label={`Word ${wi + 1}, letter ${li + 1}`}
                  className="w-10 h-12 text-center text-base font-bold uppercase rounded-xl border-2 bg-bg text-ink focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed caret-transparent"
                  style={{
                    borderColor: letters[wi]?.[li]
                      ? "#FF6B00"
                      : "var(--border)",
                    boxShadow: letters[wi]?.[li]
                      ? "0 0 0 2px rgba(255,107,0,0.15)"
                      : undefined,
                    color: "#111111",
                  }}
                  onFocusCapture={(e) => {
                    e.target.style.borderColor = "#FF6B00";
                    e.target.style.boxShadow = "0 0 0 2px rgba(255,107,0,0.20)";
                  }}
                  onBlurCapture={(e) => {
                    e.target.style.borderColor = letters[wi]?.[li]
                      ? "#FF6B00"
                      : "var(--border)";
                    e.target.style.boxShadow = letters[wi]?.[li]
                      ? "0 0 0 2px rgba(255,107,0,0.15)"
                      : "none";
                  }}
                />
              ))}

              {/* Word separator */}
              {wi < wordLengths.length - 1 && (
                <span className="text-lg text-muted/40 font-light select-none px-1">
                  ·
                </span>
              )}
            </div>
          ))}
        </div>

        {clientError && (
          <p
            className="mt-3 text-xs font-medium animate-fade-in"
            style={{ color: "#D32F2F" }}
          >
            {clientError}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-muted italic text-center sm:text-left">
          One guess per day — make it count.
        </p>

        <button
          type="submit"
          id="submit-guess-button"
          disabled={disabled || isLoading || !isFilled}
          className="w-full sm:w-auto min-w-[140px] px-6 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none"
          style={{ background: "#FF6B00" }}
          onMouseEnter={(e) => {
            if (!(e.currentTarget as HTMLButtonElement).disabled)
              (e.currentTarget as HTMLButtonElement).style.background =
                "#E55F00";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#FF6B00";
          }}
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Checking…</span>
            </>
          ) : (
            "Submit Guess"
          )}
        </button>
      </div>
    </form>
  );
};
