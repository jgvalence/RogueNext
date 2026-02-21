import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible NextAuth config — no Prisma, no bcryptjs.
 * Used exclusively by the middleware (Edge Runtime).
 * The full config with providers and DB access is in config.ts.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/signin" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "USER" | "ADMIN" | "MODERATOR";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
