"use client";

import dynamic from "next/dynamic";
import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { getQueryClient } from "./client";

const ReactQueryDevtools = dynamic(
  () =>
    import("@tanstack/react-query-devtools").then(
      (module) => module.ReactQueryDevtools
    ),
  { ssr: false }
);

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
      {process.env.NODE_ENV === "development" ? (
        <ReactQueryDevtools initialIsOpen={false} />
      ) : null}
    </QueryClientProvider>
  );
}
