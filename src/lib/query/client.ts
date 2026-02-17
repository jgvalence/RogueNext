import { QueryClient, DefaultOptions } from "@tanstack/react-query";

/**
 * Default options for React Query
 */
const defaultOptions: DefaultOptions = {
  queries: {
    // Stale time: how long data is considered fresh
    staleTime: 60 * 1000, // 1 minute

    // Cache time: how long unused data stays in cache
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)

    // Retry configuration
    retry: 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

    // Refetch configuration
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true,
  },
  mutations: {
    // Retry mutations once by default
    retry: 1,
  },
};

/**
 * Create a new QueryClient instance
 * This should be called once per request in Server Components
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions,
  });
}

/**
 * Browser QueryClient (singleton)
 * This persists across component re-renders in the browser
 */
let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
  }
}
