"use client";

import React, { useState } from "react";

interface GuessFormProps {
  onSubmit: (guess: string) => Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
  wordLengths: number[];
}

export const GuessForm: React.FC<GuessFormProps> = ({ onSubmit, isLoading, disabled = false, wordLengths }) => {
  const [guess, setGuess] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);
  const hint = wordLengths.map((length) => `${length} letters`).join(", ");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedGuess = guess.trim();
    if (!trimmedGuess) {
      setClientError("Enter a guess before submitting.");
      return;
    }
    setClientError(null);
    await onSubmit(trimmedGuess);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5" noValidate>
      <div>
        <label htmlFor="guess" className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted">
          Your answer ({hint})
        </label>
        <input
          id="guess"
          type="text"
          value={guess}
          onChange={(event) => {
            setGuess(event.target.value);
            setClientError(null);
          }}
          disabled={disabled || isLoading}
          maxLength={100}
          autoComplete="off"
          className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm font-medium text-ink placeholder:text-muted/50 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Type your answer"
        />
        {clientError && <p className="mt-3 text-xs font-medium text-danger animate-fade-in">{clientError}</p>}
      </div>
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-center text-xs italic text-muted sm:text-left">One guess per day — make it count.</p>
        <button
          type="submit"
          id="submit-guess-button"
          disabled={disabled || isLoading || !guess.trim()}
          className="flex w-full min-w-[140px] items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          {isLoading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /><span>Checking…</span></> : "Submit Guess"}
        </button>
      </div>
    </form>
  );
};
