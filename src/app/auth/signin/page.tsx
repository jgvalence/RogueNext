"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/game";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Email ou mot de passe incorrect");
    } else {
      router.push(callbackUrl);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gray-950 px-4">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-900/20 blur-[128px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Back link */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1 text-sm text-gray-500 transition hover:text-gray-300"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Retour
        </Link>

        {/* Title */}
        <div className="mb-8 text-center">
          <h1 className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-3xl font-black tracking-tight text-transparent">
            Panlibrarium
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Connectez-vous pour continuer
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-gray-400"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-800 bg-gray-900 px-4 py-2.5 text-white placeholder-gray-600 outline-none transition focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-gray-400"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-800 bg-gray-900 px-4 py-2.5 text-white placeholder-gray-600 outline-none transition focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-900/30 px-4 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-purple-600 py-3 font-bold text-white transition hover:bg-purple-500 disabled:opacity-50"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Pas encore de compte ?{" "}
          <Link
            href="/auth/signup"
            className="text-purple-400 hover:text-purple-300"
          >
            S&apos;inscrire
          </Link>
          {/* test deploy */}
        </p>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
          Chargement...
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
