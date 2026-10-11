"use client";

import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { RogueButton } from "@/components/ui/rogue";

type LibraryLoadErrorProps = {
  message: string;
  scope: "library" | "collection";
};

export function LibraryLoadError({ message, scope }: LibraryLoadErrorProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const titleKey =
    scope === "collection"
      ? "library.collectionLoadErrorTitle"
      : "library.loadErrorTitle";

  return (
    <main
      className="menu-page mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-3 px-6 text-center"
      role="alert"
    >
      <h1 className="text-2xl font-semibold text-red-600">{t(titleKey)}</h1>
      <p className="text-sm text-slate-300">{message}</p>
      <RogueButton onClick={() => router.refresh()}>
        {t("menu.retry")}
      </RogueButton>
    </main>
  );
}
