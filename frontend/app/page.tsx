"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UserProvider, useUser } from "@/lib/UserContext";
import { registerPlayer, updateUsername } from "@/lib/api";

function AuthForm() {
  const router = useRouter();
  const { playerId, username, setUsername } = useUser();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Wait for hydration so we can read localStorage via context
  useEffect(() => {
    setMounted(true);
  }, []);

  // If already authenticated, skip to game immediately
  useEffect(() => {
    if (mounted && username) {
      router.replace("/game");
    }
  }, [mounted, username, router]);

  const validate = (v: string) => {
    const t = v.trim();
    if (t.length < 2) return "Username must be at least 2 characters.";
    if (t.length > 30) return "Username cannot exceed 30 characters.";
    if (!/^[\w\s-]+$/.test(t))
      return "Only letters, numbers, spaces, hyphens, and underscores allowed.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const err = validate(input);
    if (err) {
      setError(err);
      inputRef.current?.focus();
      return;
    }

    if (!playerId) return;
    setIsLoading(true);

    try {
      // Ensure player record exists in backend
      await registerPlayer(playerId);
      // Set username on backend
      await updateUsername(playerId, input.trim());
      // Persist in context + localStorage
      setUsername(input.trim());
      // Navigate to game (router.push gives a fade-in feel)
      router.push("/game");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
      setIsLoading(false);
    }
  };

  // While checking stored identity, show nothing (avoids flash)
  if (!mounted || username) return null;

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 animate-page">
      {/* Branding */}
      <div className="mb-10 text-center animate-fade-up">
        <h1
          className="text-5xl font-black tracking-tight leading-none"
          style={{ color: "#FF6B00" }}
        >
          STREAK
        </h1>
        <p className="mt-2 text-sm font-medium text-muted tracking-widest uppercase">
          Daily Riddle
        </p>
        <p className="mt-3 text-xs text-muted">
          One riddle. One guess. Every day.
        </p>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm bg-surface border border-border rounded-2xl p-8 shadow-sm animate-fade-up delay-1"
      >
        <h2 className="text-lg font-bold text-ink mb-1">Enter your name</h2>
        <p className="text-xs text-muted mb-6">
          Choose a username to track your streak.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="auth-username"
              className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5"
            >
              Username
            </label>
            <input
              id="auth-username"
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. riddle_master"
              maxLength={30}
              autoComplete="off"
              autoFocus
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-xl border text-ink text-sm font-medium placeholder-muted/50 bg-bg focus:outline-none transition-all disabled:opacity-60"
              style={{
                borderColor: error ? "#D32F2F" : "var(--border)",
                boxShadow: error
                  ? "0 0 0 2px rgba(211,47,47,0.15)"
                  : undefined,
              }}
              onFocus={(e) =>
                (e.target.style.boxShadow = error
                  ? "0 0 0 2px rgba(211,47,47,0.15)"
                  : "0 0 0 2px rgba(255,107,0,0.18)")
              }
              onBlur={(e) => (e.target.style.boxShadow = "none")}
            />
            {error && (
              <p className="mt-1.5 text-xs font-medium animate-fade-in" style={{ color: "#D32F2F" }}>
                {error}
              </p>
            )}
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ background: "#FF6B00" }}
            onMouseEnter={(e) =>
              ((e.target as HTMLButtonElement).style.background = "#E55F00")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLButtonElement).style.background = "#FF6B00")
            }
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Starting…</span>
              </>
            ) : (
              "Start Playing →"
            )}
          </button>
        </form>
      </div>

    
    </div>
  );
}

export default function AuthPage() {
  return (
    <UserProvider>
      <AuthForm />
    </UserProvider>
  );
}
