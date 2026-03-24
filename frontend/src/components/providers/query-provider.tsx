/**
 * query-provider.tsx — TanStack React Query Provider
 *
 * Configures the global QueryClient with sensible defaults:
 * - 60-second stale time to reduce unnecessary refetches
 * - Single retry on failure
 * - Window focus refetch disabled for stable UX during tab switching
 *
 * Includes React Query DevTools in development mode.
 *
 * @module components/providers/query-provider
 */

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  // useState ensures a single QueryClient per component lifecycle,
  // preventing shared state across server/client boundaries
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
