"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { getQueryClient } from "./client";
import { useState } from "react";

/**
 * React Query Provider
 *
 * Wraps the app with QueryClientProvider
 * Include this in your root layout
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create a new QueryClient instance for this component tree
  // Using useState ensures it's only created once per request
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Dev tools (only in development) */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
