/**
 * layout.tsx — Root Application Layout
 *
 * The top-level layout wrapping every page in the application.
 * Establishes the provider hierarchy and global UI shell:
 *
 *   ErrorBoundary → QueryProvider → AuthProvider → TooltipProvider
 *     → Header + Main Content + Footer
 *
 * Also configures:
 * - Google Fonts (Inter for body, JetBrains Mono for code)
 * - Sonner toast notification system
 * - HTML lang attribute and antialiasing
 *
 * @module app/layout
 */

import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

/** Primary sans-serif font for body text */
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

/** Monospace font for code blocks and technical content */
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

/** Global SEO metadata for the platform */
export const metadata: Metadata = {
  title: "LokAI - AI-Powered Exam Preparation",
  description:
    "AI-powered exam preparation platform for Nepal government employees",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              <TooltipProvider>
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
              </TooltipProvider>
            </AuthProvider>
          </QueryProvider>
        </ErrorBoundary>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
