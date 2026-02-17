import * as Sentry from "@sentry/nextjs";
import { env } from "@/lib/env";

/**
 * Sentry Edge Configuration
 *
 * This runs on the Edge runtime (middleware, edge functions)
 */
Sentry.init({
  dsn: env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust sample rate for production
  tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Debug mode (only in development)
  debug: env.NODE_ENV === "development",

  // Environment
  environment: env.NODE_ENV,
});
