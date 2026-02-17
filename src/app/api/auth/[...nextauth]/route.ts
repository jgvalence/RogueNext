import { handlers } from "@/lib/auth/config";

/**
 * NextAuth Route Handler
 *
 * This file exports the GET and POST handlers for NextAuth
 * Handles all auth routes: /api/auth/signin, /api/auth/signout, etc.
 */
export const { GET, POST } = handlers;
