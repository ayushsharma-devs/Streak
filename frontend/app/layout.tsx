import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Streak — One Riddle Every Day",
  description: "A daily riddle guessing game. One riddle per day, exactly one guess, build your streak.",
  keywords: ["riddle", "daily game", "puzzle", "word game", "streak"],
  authors: [{ name: "Streak" }],
  openGraph: {
    title: "Streak — Daily Riddle Game",
    description: "One riddle per day, exactly one guess, build your streak.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#fcfbf9",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased selection:bg-amber-200 dark:selection:bg-amber-900">
        <header className="border-b border-stone-200/80 dark:border-stone-800/80 backdrop-blur-sm sticky top-0 z-10 bg-white/70 dark:bg-stone-950/70">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-black tracking-wider uppercase bg-gradient-to-r from-amber-600 to-amber-700 dark:from-amber-400 dark:to-amber-500 bg-clip-text text-transparent">
                STREAK
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                Daily
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">One riddle. One guess.</p>
          </div>
        </header>

        <main className="flex-1 flex flex-col justify-center py-8 px-4 sm:px-6">
          {children}
        </main>

        <footer className="border-t border-stone-200/60 dark:border-stone-800/60 py-6 text-center text-xs text-stone-500 dark:text-stone-400">
          <p>Shared daily riddle • State persisted server-side</p>
        </footer>
      </body>
    </html>
  );
}
