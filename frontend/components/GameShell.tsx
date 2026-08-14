"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  fetchTodayGame,
  registerPlayer,
  submitGuess,
  updateUsername,
  ApiError,
} from "@/lib/api";
import { getOrCreatePlayerId } from "@/lib/player";
import { GameStateResponse } from "@/lib/types";
import { ErrorState } from "./ErrorState";
import { GuessForm } from "./GuessForm";
import { LoadingState } from "./LoadingState";
import { PuzzleCard } from "./PuzzleCard";
import { ResultCard } from "./ResultCard";
import { StreakDisplay } from "./StreakDisplay";

export const GameShell: React.FC = () => {
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameStateResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadGame = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Step 1: Ensure client-side anonymous UUID is created and stored in localStorage
      const currentId = getOrCreatePlayerId();
      setPlayerId(currentId);

      // Step 2: Register/verify player with backend
      await registerPlayer(currentId);

      // Step 3: Fetch today's safe game state
      const state = await fetchTodayGame(currentId);
      setGameState(state);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Unable to load the game. Please check your internet connection.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGame();
  }, [loadGame]);

  const handleUpdateUsername = async (newUsername: string) => {
    if (!playerId) return;
    const res = await updateUsername(playerId, newUsername);
    setGameState((prev) => (prev ? { ...prev, username: res.username } : null));
  };

  const handleGuessSubmit = async (guess: string) => {
    if (!playerId) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await submitGuess(playerId, guess);
      setGameState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          has_played_today: true,
          current_streak: response.current_streak,
          highest_streak: response.highest_streak,
          result: {
            correct: response.correct,
          },
        };
      });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          // Player already played (e.g. from another tab). Refresh state to display result.
          try {
            const refreshed = await fetchTodayGame(playerId);
            setGameState(refreshed);
          } catch {
            setErrorMessage("You have already submitted a guess for today.");
          }
        } else {
          setErrorMessage(err.message);
        }
      } else {
        setErrorMessage("Failed to submit your guess. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Top Streak & Username Header */}
      {gameState && (
        <StreakDisplay
          currentStreak={gameState.current_streak}
          highestStreak={gameState.highest_streak}
          username={gameState.username}
          onUpdateUsername={handleUpdateUsername}
        />
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <LoadingState />
      ) : errorMessage && !gameState ? (
        <ErrorState message={errorMessage} onRetry={loadGame} />
      ) : gameState ? (
        <div className="space-y-6">
          {/* Daily Puzzle Card */}
          <PuzzleCard puzzle={gameState.puzzle} dateStr={gameState.date} />

          {/* Error notice if inline submission error occurred */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 text-center font-medium animate-fade-in">
              {errorMessage}
            </div>
          )}

          {/* Interactive or Completed Game Section */}
          {gameState.has_played_today ? (
            <ResultCard
              isCorrect={gameState.result?.correct ?? false}
              currentStreak={gameState.current_streak}
            />
          ) : (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 sm:p-8 shadow-sm">
              <GuessForm
                onSubmit={handleGuessSubmit}
                isLoading={isSubmitting}
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
