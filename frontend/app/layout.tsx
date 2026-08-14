import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "STREAK — Daily Riddle",
  description:
    "One riddle per day, exactly one guess. Build your streak and prove your wit.",
  keywords: ["riddle", "daily game", "puzzle", "word game", "streak"],
  authors: [{ name: "Streak" }],
  openGraph: {
    title: "STREAK — Daily Riddle Game",
    description: "One riddle per day, exactly one guess, build your streak.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FDFCF5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-bg text-ink antialiased selection:bg-orange-100 selection:text-accent">
        {children}
      </body>
    </html>
  );
}
