"use client";

import React, { useState } from "react";

interface GuessFormProps {
  onSubmit: (guess: string) => Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
}

export const GuessForm: React.FC<GuessFormProps> = ({
  onSubmit,
  isLoading,
  disabled = false,
}) => {
  const [guess, setGuess] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);

    const trimmed = guess.trim();
    if (!trimmed) {
      setClientError("Please enter your guess before submitting.");
      return;
    }
    if (trimmed.length > 100) {
      setClientError("Guess cannot exceed 100 characters.");
      return;
    }

    await onSubmit(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4" noValidate>
      <div className="space-y-2">
        <label
          htmlFor="daily-guess-input"
          className="block text-xs font-semibold uppercase tracking-wider text-muted"
        >
          Your Guess
        </label>

        <input
          id="daily-guess-input"
          type="text"
          value={guess}
          onChange={(e) => {
            setGuess(e.target.value);
            if (clientError) setClientError(null);
          }}
          disabled={disabled || isLoading}
          placeholder="Type your answer…"
          maxLength={100}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          className="w-full px-4 py-3.5 rounded-xl border bg-bg text-ink text-base font-medium placeholder-muted/50 focus:outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          style={{
            borderColor: clientError ? "#D32F2F" : "var(--border)",
          }}
          onFocus={(e) =>
            (e.target.style.boxShadow = "0 0 0 2px rgba(255,107,0,0.18)")
          }
          onBlur={(e) => (e.target.style.boxShadow = "none")}
        />

        {clientError && (
          <p className="text-xs font-medium animate-fade-in" style={{ color: "#D32F2F" }}>
            {clientError}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
        <p className="text-xs text-muted italic text-center sm:text-left">
          One guess per day — make it count.
        </p>

        <button
          type="submit"
          id="submit-guess-button"
          disabled={disabled || isLoading || !guess.trim()}
          className="w-full sm:w-auto min-w-[140px] px-6 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none"
          style={{ background: "#FF6B00" }}
          onMouseEnter={(e) => {
            if (!(e.currentTarget as HTMLButtonElement).disabled)
              (e.currentTarget as HTMLButtonElement).style.background = "#E55F00";
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
