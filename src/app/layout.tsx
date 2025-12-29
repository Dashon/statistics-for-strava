
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/Toast";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "QT | Statistics for Strava",
  description: "Cinematic statistics and AI-powered insights for your Strava activities. Track performance, analyze workouts, and get personalized coaching advice.",
  keywords: ["Strava", "statistics", "running", "cycling", "fitness", "AI coaching", "workout analysis"],
  authors: [{ name: "QT Statistics" }],
  openGraph: {
    title: "QT | Statistics for Strava",
    description: "Cinematic statistics and AI-powered insights for your Strava activities.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={outfit.className}>
        <ErrorBoundary>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
