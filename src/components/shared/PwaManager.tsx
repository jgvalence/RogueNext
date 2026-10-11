"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { RogueButton } from "@/components/ui/rogue";

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaManager() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(
    null
  );
  const [updateReady, setUpdateReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const install = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPrompt);
    };
    const installed = () => setInstallPrompt(null);
    window.addEventListener("beforeinstallprompt", install);
    window.addEventListener("appinstalled", installed);

    const worker = navigator.serviceWorker;
    let alreadyControlled = Boolean(worker?.controller);
    const changed = () => {
      if (alreadyControlled) {
        setUpdateReady(true);
        setDismissed(false);
      }
      alreadyControlled = true;
    };
    const check = () => {
      if (navigator.onLine && document.visibilityState === "visible") {
        void worker
          ?.getRegistration()
          .then((registration) => registration?.update())
          .catch(() => {});
      }
    };
    worker?.addEventListener("controllerchange", changed);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("online", check);
    const timer = window.setInterval(check, 5 * 60 * 1000);
    check();
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("beforeinstallprompt", install);
      window.removeEventListener("appinstalled", installed);
      worker?.removeEventListener("controllerchange", changed);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("online", check);
    };
  }, []);

  // Applying an update never reloads an active expedition. The notice becomes
  // available after returning to the library, once the normal save flow ran.
  if (
    pathname === "/game" ||
    pathname.startsWith("/game/") ||
    (!installPrompt && !updateReady) ||
    dismissed
  )
    return null;

  return (
    <aside
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 z-[200] flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300/40 bg-slate-950/95 p-4 text-sm text-slate-100 shadow-xl sm:left-auto sm:max-w-md"
    >
      <p>{t(updateReady ? "pwa.updateReady" : "pwa.installHint")}</p>
      <RogueButton
        onClick={async () => {
          if (updateReady) {
            window.location.reload();
            return;
          }
          if (!installPrompt) return;
          try {
            await installPrompt.prompt();
            await installPrompt.userChoice;
          } finally {
            setInstallPrompt(null);
          }
        }}
      >
        {t(updateReady ? "pwa.update" : "pwa.install")}
      </RogueButton>
      <RogueButton onClick={() => setDismissed(true)}>
        {t("pwa.later")}
      </RogueButton>
    </aside>
  );
}
