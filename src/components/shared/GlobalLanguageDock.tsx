"use client";

import { usePathname } from "next/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function GlobalLanguageDock() {
  const pathname = usePathname();
  const isGameRoute = pathname?.startsWith("/game");
  const routeVisibilityClass = isGameRoute ? "hidden" : "";

  return (
    <div
      className={`pointer-events-none fixed right-3 z-[10000] sm:right-4 ${routeVisibilityClass} ${
        isGameRoute ? "bottom-3 sm:bottom-4" : "top-3 sm:top-4"
      }`}
    >
      <div className="pointer-events-auto">
        <LanguageSwitcher />
      </div>
    </div>
  );
}
