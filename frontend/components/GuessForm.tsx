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
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="daily-guess-input"
          className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-300"
        >
          Your Daily Guess
        </label>
        <div className="relative">
          <input
            id="daily-guess-input"
            type="text"
            value={guess}
            onChange={(e) => {
              setGuess(e.target.value);
              if (clientError) setClientError(null);
            }}
            disabled={disabled || isLoading}
            placeholder="Type your answer here..."
            maxLength={100}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck="false"
            className="w-full px-4 py-3.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all text-base shadow-sm font-medium"
          />
        </div>

        {clientError && (
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
            {clientError}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
        <p className="text-xs text-stone-600 dark:text-stone-300 italic text-center sm:text-left">
          ⚠️ You get exactly one guess per day. Make it count!
        </p>

        <button
          type="submit"
          id="submit-guess-button"
          disabled={disabled || isLoading || !guess.trim()}
          className="w-full sm:w-auto min-w-[140px] px-6 py-3 bg-stone-900 hover:bg-stone-800 active:bg-black dark:bg-stone-100 dark:hover:bg-white dark:active:bg-stone-200 text-white dark:text-stone-900 font-semibold rounded-xl transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Checking...</span>
            </>
          ) : (
            <span>Submit Guess</span>
          )}
        </button>
      </div>
    </form>
  );
};
