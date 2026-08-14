"use client";

import { GameShell } from "@/components/GameShell";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-bg px-4 py-8 sm:px-6">
      <h1 className="sr-only">STREAK — Daily Riddle Guessing Game</h1>
      <GameShell />
    </main>
  );
}
