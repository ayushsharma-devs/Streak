import { GameShell } from "@/components/GameShell";

export default function HomePage() {
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      <h1 className="sr-only">Streak — Daily Riddle Guessing Game</h1>
      <GameShell />
    </div>
  );
}
