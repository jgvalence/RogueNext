"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function GameError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    console.error("Game error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-950 text-white">
      <h2 className="text-2xl font-bold text-red-400">
        {t("gameError.title")}
      </h2>
      <p className="max-w-md text-center text-gray-400">
        {t("gameError.description")}
      </p>
      {error.message && (
        <pre className="max-w-lg rounded bg-gray-900 p-3 text-xs text-gray-500">
          {error.message}
        </pre>
      )}
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-purple-600 px-6 py-2 font-medium text-white hover:bg-purple-500"
        >
          {t("gameError.tryAgain")}
        </button>
        <Link
          href="/game"
          className="rounded-lg bg-gray-700 px-6 py-2 font-medium text-white hover:bg-gray-600"
        >
          {t("gameError.backToMenu")}
        </Link>
      </div>
    </div>
  );
}
