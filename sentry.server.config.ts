import * as Sentry from "@sentry/nextjs";
import { env } from "@/lib/env";

/**
 * Sentry Server Configuration
 *
 * This runs on the server (Node.js runtime)
 */
Sentry.init({
  dsn: env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust sample rate for production
  tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Debug mode (only in development)
  debug: env.NODE_ENV === "development",

  // Environment
  environment: env.NODE_ENV,

  // Release tracking (set during build)
  // release: process.env.VERCEL_GIT_COMMIT_SHA,

  // Filter out specific errors
  beforeSend(event, hint) {
    const error = hint.originalException;

    // Don't send operational errors to Sentry (they're expected)
    if (error && typeof error === "object" && "isOperational" in error) {
      if (error.isOperational === true) {
        return null;
      }
    }

    return event;
  },
});
