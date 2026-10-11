"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function isMenuRoute(path: string) {
  return [
    "/library",
    "/runs",
    "/leaderboard",
    "/rules",
    "/auth/signin",
    "/auth/signup",
  ].some((route) => path === route || path.startsWith(route + "/"));
}

export function MenuShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  if (!isMenuRoute(pathname)) return children;
  const links = [
    ["/library", "library"],
    ["/library/collection", "collection"],
    ["/library/bestiary", "bestiary"],
    ["/runs", "history"],
    ["/leaderboard", "leaderboard"],
    ["/rules", "rules"],
  ];
  return (
    <div className="menu-shell">
      <a className="menu-skip" href="#menu-content">
        {t("menu.skip")}
      </a>
      <header className="menu-masthead">
        <Link href="/" className="menu-brand" aria-label={t("menu.home")}>
          <span aria-hidden="true" className="menu-seal">
            P
          </span>
          <span>
            Panlibrarium<small>{t("menu.subtitle")}</small>
          </span>
        </Link>
        <div className="menu-tools">
          <LanguageSwitcher />
          <Link href="/game" className="menu-expedition">
            {t("menu.expedition")} <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </header>
      <nav className="menu-navigation" aria-label={t("menu.navigation")}>
        <Link href="/">{t("menu.home")}</Link>
        {links.map(([href, label]) => (
          <Link
            key={href}
            href={href!}
            aria-current={pathname === href ? "page" : undefined}
          >
            {t(`menu.${label}`)}
          </Link>
        ))}
      </nav>
      <div id="menu-content" tabIndex={-1} className="menu-content">
        {children}
      </div>
      <footer className="menu-footer">
        <span>Panlibrarium</span>
        <span>{t("menu.footer")}</span>
      </footer>
    </div>
  );
}
