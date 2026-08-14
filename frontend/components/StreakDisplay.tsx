"use client";

import React, { useState } from "react";

interface StreakDisplayProps {
  currentStreak: number;
  highestStreak: number;
  username?: string | null;
  onUpdateUsername?: (newUsername: string) => Promise<void>;
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({
  currentStreak,
  highestStreak,
  username,
  onUpdateUsername,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputName, setInputName] = useState(username || "");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const trimmed = inputName.trim();
    if (trimmed.length < 2 || trimmed.length > 30) {
      setErrorMsg("Username must be between 2 and 30 characters.");
      return;
    }

    if (onUpdateUsername) {
      setIsSaving(true);
      try {
        await onUpdateUsername(trimmed);
        setIsEditing(false);
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : "Failed to save username");
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-center space-y-3">
      {/* Player Display Name */}
      <div className="flex items-center gap-2 text-xs">
        {isEditing ? (
          <form onSubmit={handleSave} className="flex items-center gap-1.5 animate-fade-in">
            <input
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              placeholder="Your username"
              maxLength={30}
              className="px-2.5 py-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
              autoFocus
            />
            <button
              type="submit"
              disabled={isSaving || !inputName.trim()}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs transition-colors disabled:opacity-50"
            >
              {isSaving ? "..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setInputName(username || "");
                setErrorMsg(null);
              }}
              className="px-2 py-1 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 text-xs"
            >
              Cancel
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-800/70 border border-stone-200/80 dark:border-stone-700/60 text-stone-700 dark:text-stone-300 font-medium">
            <span className="text-stone-400 dark:text-stone-500">👤</span>
            <span>{username ? `@${username}` : "Anonymous Player"}</span>
            {onUpdateUsername && (
              <button
                type="button"
                onClick={() => {
                  setInputName(username || "");
                  setIsEditing(true);
                }}
                className="ml-1 text-[10px] text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-semibold underline underline-offset-2"
              >
                {username ? "edit" : "set name"}
              </button>
            )}
          </div>
        )}
      </div>

      {errorMsg && (
        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
          {errorMsg}
        </p>
      )}

      {/* Streak Counters */}
      <div className="flex items-center justify-center gap-4 py-1">
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
            currentStreak > 0
              ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 shadow-sm"
              : "bg-stone-50 dark:bg-stone-900/60 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400"
          }`}
        >
          <span className="text-lg" aria-hidden="true">
            🔥
          </span>
          <div className="text-left">
            <div className="text-xs uppercase tracking-wider font-semibold opacity-75">
              Current
            </div>
            <div className="text-lg font-bold leading-none">{currentStreak}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-xl border bg-stone-50 dark:bg-stone-900/60 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300">
          <span className="text-lg" aria-hidden="true">
            🏆
          </span>
          <div className="text-left">
            <div className="text-xs uppercase tracking-wider font-semibold opacity-75">
              Best
            </div>
            <div className="text-lg font-bold leading-none">{highestStreak}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
