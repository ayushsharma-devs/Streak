"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  fetchTodayGame,
  registerPlayer,
  submitGuess,
  ApiError,
} from "@/lib/api";
import { useUser } from "@/lib/UserContext";
import { GameStateResponse } from "@/lib/types";
import { ErrorState } from "./ErrorState";
import { GuessForm } from "./GuessForm";
import { LoadingState } from "./LoadingState";
import { PuzzleCard } from "./PuzzleCard";
import { ResultCard } from "./ResultCard";
import { StreakDisplay } from "./StreakDisplay";

export const GameShell: React.FC = () => {
  const { playerId, username } = useUser();

  const [gameState, setGameState] = useState<GameStateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadGame = useCallback(async () => {
    if (!playerId) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await registerPlayer(playerId);
      const state = await fetchTodayGame(playerId);
      setGameState(state);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof ApiError
          ? err.message
          : "Unable to load the game. Please check your internet connection."
      );
    } finally {
      setIsLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    if (playerId) loadGame();
  }, [playerId, loadGame]);

  const handleGuessSubmit = async (guess: string) => {
    if (!playerId) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await submitGuess(playerId, guess);
      setGameState((prev) =>
        prev
          ? {
              ...prev,
              has_played_today: true,
              current_streak: response.current_streak,
              highest_streak: response.highest_streak,
              result: { correct: response.correct },
            }
          : null
      );
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409) {
        try {
          const refreshed = await fetchTodayGame(playerId);
          setGameState(refreshed);
        } catch {
          setErrorMessage("You have already submitted a guess for today.");
        }
      } else {
        setErrorMessage(
          err instanceof ApiError
            ? err.message
            : "Failed to submit your guess. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 animate-page">
      {/* Stats & username header */}
      {gameState && (
        <StreakDisplay
          currentStreak={gameState.current_streak}
          highestStreak={gameState.highest_streak}
          username={username ?? gameState.username}
        />
      )}

      {/* Main content */}
      {isLoading ? (
        <LoadingState />
      ) : errorMessage && !gameState ? (
        <ErrorState message={errorMessage} onRetry={loadGame} />
      ) : gameState ? (
        <div className="space-y-5">
          <PuzzleCard puzzle={gameState.puzzle} dateStr={gameState.date} />

          {errorMessage && (
            <div
              className="p-3 rounded-xl border text-xs text-center font-medium animate-fade-in"
              style={{
                background: "rgba(211,47,47,0.06)",
                borderColor: "rgba(211,47,47,0.25)",
                color: "#D32F2F",
              }}
            >
              {errorMessage}
            </div>
          )}

          {gameState.has_played_today ? (
            <ResultCard
              isCorrect={gameState.result?.correct ?? false}
              currentStreak={gameState.current_streak}
            />
          ) : (
            <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
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
