import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

/**
 * Test Setup
 *
 * Global test configuration and setup for Vitest
 */

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables for tests
// NODE_ENV is automatically set to "test" by Vitest
process.env.NEXTAUTH_SECRET = "test-secret-key-32-characters-long";
process.env.NEXTAUTH_URL = "http://localhost:3000";
process.env.DATABASE_URL =
  "postgresql://test:test@localhost:5432/test?schema=public";
process.env.NEXT_PUBLIC_APP_NAME = "Base Next.js";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js server actions
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
