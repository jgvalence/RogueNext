import * as Sentry from "@sentry/nextjs";
import { env } from "@/lib/env";

/**
 * Sentry Client Configuration
 *
 * This runs in the browser
 */
Sentry.init({
  dsn: env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust sample rate for production
  tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Debug mode (only in development)
  debug: env.NODE_ENV === "development",

  // Environment
  environment: env.NODE_ENV,

  // Release tracking (set during build)
  // release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

  // Filter out specific errors
  beforeSend(event, hint) {
    // Filter out specific errors you don't care about
    const error = hint.originalException;

    if (error && typeof error === "object" && "message" in error) {
      const message = String(error.message);

      // Ignore specific error messages
      if (
        message.includes("ResizeObserver loop") ||
        message.includes("Non-Error promise rejection")
      ) {
        return null;
      }
    }

    return event;
  },

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
