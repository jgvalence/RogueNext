"use client";

import { useTranslation } from "react-i18next";

type LibraryLoadErrorProps = {
  message: string;
  scope: "library" | "collection";
};

export function LibraryLoadError({ message, scope }: LibraryLoadErrorProps) {
  const { t } = useTranslation();
  const titleKey =
    scope === "collection"
      ? "library.collectionLoadErrorTitle"
      : "library.loadErrorTitle";

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-2xl font-semibold text-red-600">{t(titleKey)}</h1>
      <p className="text-sm text-gray-600">{message}</p>
    </main>
  );
}
