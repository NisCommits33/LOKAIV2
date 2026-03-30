/**
 * loading.tsx — Reusable Loading State Components
 *
 * Provides skeleton placeholders and spinner components for use during
 * data fetching or async operations across the application.
 *
 * Components:
 * - PageSkeleton   — Full page loading placeholder
 * - CardSkeleton   — Individual card placeholder
 * - TableSkeleton  — Data table placeholder with configurable rows
 * - FormSkeleton   — Form fields placeholder
 * - Spinner        — Inline animated spinner
 * - FullPageSpinner — Centered viewport spinner
 *
 * @module components/loading
 */

import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border p-6 space-y-3">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-full" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

const LOKAI_LETTERS = ["L", "O", "K", "A", "I"] as const;

export function LokaiLoader({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "text-lg gap-0.5",
    md: "text-3xl gap-1",
    lg: "text-5xl gap-1.5",
  };

  return (
    <div
      className={`flex items-center justify-center ${sizeClasses[size]}`}
      role="status"
      aria-label="Loading"
    >
      {LOKAI_LETTERS.map((letter, i) => (
        <span
          key={letter}
          className="lokai-letter font-bold text-muted-foreground/30"
          style={{ animationDelay: `${i * 0.15}s` }}
        >
          {letter}
        </span>
      ))}
    </div>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <Loader2 className="h-full w-full animate-spin" />
    </div>
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <LokaiLoader size="lg" />
      <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
    </div>
  );
}
