
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/Toast";
import { QueryProvider } from "@/providers/QueryProvider";
import { NuqsAdapter } from "nuqs/adapters/next/app";


const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Qt.run | Your AI-Powered Running Coach",
  description: "Qt.run delivers cinematic statistics, AI-powered insights, and personalized coaching for runners. Track performance, analyze workouts, and achieve your running goals.",
  keywords: ["Qt.run", "running", "AI coaching", "training", "fitness", "workout analysis", "running coach", "performance tracking"],
  authors: [{ name: "Qt.run" }],
  openGraph: {
    title: "Qt.run | Your AI-Powered Running Coach",
    description: "Qt.run delivers cinematic statistics, AI-powered insights, and personalized coaching for runners.",
    type: "website",
    siteName: "Qt.run",
    url: "https://qt.run",
  },
  twitter: {
    card: "summary_large_image",
    title: "Qt.run | Your AI-Powered Running Coach",
    description: "Qt.run delivers cinematic statistics, AI-powered insights, and personalized coaching for runners.",
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
          <NuqsAdapter>
            <QueryProvider>
              <ToastProvider>
                {children}

              </ToastProvider>
            </QueryProvider>
          </NuqsAdapter>
        </ErrorBoundary>
      </body>
    </html>
  );
}
