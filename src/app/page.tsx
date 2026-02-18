import Link from "next/link";
import { auth } from "@/lib/auth/config";

export default async function HomePage() {
  const session = await auth();
  const isSignedIn = !!session?.user;

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gray-950 text-white">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-900/20 blur-[128px]" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[400px] rounded-full bg-blue-900/15 blur-[96px]" />
        <div className="absolute right-0 top-0 h-[250px] w-[350px] rounded-full bg-amber-900/10 blur-[96px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-4 text-center">
        {/* Title */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-sm font-medium uppercase tracking-[0.3em] text-purple-400">
            Deck-builder Roguelike
          </span>
          <h1 className="bg-gradient-to-b from-white via-white to-gray-500 bg-clip-text text-6xl font-black tracking-tight text-transparent sm:text-8xl">
            Panlibrarium
          </h1>
          <p className="max-w-md text-lg text-gray-400">
            Parcourez les livres de la mythologie. Construisez votre deck.
            Survivez.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-4">
          {isSignedIn ? (
            <Link
              href="/game"
              className="group relative inline-flex items-center gap-2 rounded-lg bg-purple-600 px-10 py-4 text-lg font-bold transition-all hover:bg-purple-500 hover:shadow-[0_0_32px_rgba(147,51,234,0.4)]"
            >
              <span>Jouer</span>
              <svg
                className="h-5 w-5 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="group relative inline-flex items-center gap-2 rounded-lg bg-purple-600 px-10 py-4 text-lg font-bold transition-all hover:bg-purple-500 hover:shadow-[0_0_32px_rgba(147,51,234,0.4)]"
              >
                <span>Commencer l&apos;aventure</span>
                <svg
                  className="h-5 w-5 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
              <span className="text-sm text-gray-500">
                Connectez-vous pour sauvegarder votre progression
              </span>
            </>
          )}
        </div>

        {/* Feature tags */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {[
            "Combats tactiques",
            "Deck-building",
            "Mythologies du monde",
            "Roguelike",
          ].map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-gray-800 bg-gray-900/50 px-4 py-1.5 text-xs font-medium text-gray-400"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-950 to-transparent" />
    </main>
  );
}
