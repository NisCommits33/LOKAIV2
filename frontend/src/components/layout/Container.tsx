/**
 * Container.tsx — Responsive Content Wrapper
 *
 * Centers content with a max-width of 7xl (80rem) and applies
 * responsive horizontal padding. Used as the primary layout
 * constraint throughout public-facing pages.
 *
 * @module components/layout/Container
 */

import { cn } from "@/lib/utils";

export function Container({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}
