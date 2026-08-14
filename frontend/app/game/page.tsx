"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserProvider, useUser } from "@/lib/UserContext";
import { GameShell } from "@/components/GameShell";

function GamePage() {
  const router = useRouter();
  const { username } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Guard: if no username in storage, send back to auth
  useEffect(() => {
    if (mounted && !username) {
      router.replace("/");
    }
  }, [mounted, username, router]);

  if (!mounted || !username) return null;

  return (
    <div className="min-h-screen bg-bg flex flex-col animate-page">
      {/* ── Branded Header ─────────────────────────────────────── */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span
              className="text-2xl font-black tracking-tight leading-none"
              style={{ color: "#FF6B00" }}
            >
              STREAK
            </span>
            
          </div>

          {/* Subtitle */}
          <p className="text-xs text-muted hidden sm:block">
            One riddle. One guess.
          </p>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col justify-center py-8 px-4 sm:px-6">
        <h1 className="sr-only">STREAK — Daily Riddle Guessing Game</h1>
        <GameShell />
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-border py-5 text-center text-xs text-muted">
        Shared daily riddle
      </footer>
    </div>
  );
}

export default function GameRoute() {
  return (
    <UserProvider>
      <GamePage />
    </UserProvider>
  );
}
