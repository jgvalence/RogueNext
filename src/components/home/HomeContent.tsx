"use client";

import Image from "next/image";
import Link from "next/link";

import { useTranslation } from "react-i18next";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { IOSInstallBanner } from "@/components/shared/IOSInstallBanner";

const cinzel = { className: "font-serif" };

interface HomeContentProps {
  isSignedIn: boolean;
  hasActiveRun?: boolean;
}

export function HomeContent({
  isSignedIn,
  hasActiveRun = false,
}: HomeContentProps) {
  const { t } = useTranslation();

  return (
    <main
      className="panlibrarium-home relative min-h-dvh w-full overflow-x-hidden bg-[#040608]"
      style={{ fontFamily: "Georgia, Times New Roman, serif" }}
    >
      <IOSInstallBanner />

      {/* ── BACKGROUND ── */}
      <div className="pointer-events-none absolute inset-0">
        {/* Art plein écran */}
        <Image
          src="/images/scenes/panlibrarium-v2.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
          aria-hidden
        />
        {/* Voile sombre : fort à gauche pour la lisibilité du menu */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#020406]/80 via-[#020406]/40 to-transparent" />
        {/* Vignette haut/bas */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#020406]/80 via-transparent to-[#020406]/95" />
        {/* Lueur ambrée basse-gauche */}
        <div className="absolute bottom-0 left-0 h-1/2 w-1/2 bg-[radial-gradient(ellipse_at_bottom_left,rgba(245,158,11,0.07),transparent_70%)]" />
        {/* Grain subtil */}
        <div className="absolute inset-0 bg-[url('/images/backgrounds/map.svg')] bg-[length:200px_200px] bg-repeat opacity-[0.015] mix-blend-overlay" />
      </div>

      {/* ── PERSONNAGE ATMOSPHÉRIQUE (droite) ── */}
      <div className="pointer-events-none absolute bottom-0 right-[4%] hidden h-[88vh] w-[28vw]">
        <Image
          src="/images/enemies/the_archivist.svg"
          alt=""
          fill
          className="animate-ambient-float object-contain object-bottom opacity-30 brightness-50 saturate-50"
          aria-hidden
        />
        {/* Halo au pied du personnage */}
        <div className="absolute bottom-0 left-1/2 h-24 w-64 -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.09),transparent_70%)]" />
      </div>

      {/* Lignes décoratives verticales – effet vieux terminal */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg,rgba(251,191,36,0.6) 0px,rgba(251,191,36,0.6) 1px,transparent 1px,transparent 80px)",
        }}
      />

      {/* ── MENU ── */}
      <div className="home-menu relative z-10 flex min-h-dvh flex-col justify-center px-6 py-16 sm:pl-16 lg:pl-24 xl:pl-32">
        {/* Kicker */}
        <p className="mb-3 text-[0.6rem] font-semibold uppercase tracking-[0.55em] text-amber-400/50">
          {t("home.kicker")}
        </p>

        {/* Titre principal */}
        <h1
          className={` ${cinzel.className} mb-5 text-[clamp(1.9rem,7.2vw,6.5rem)] font-bold uppercase leading-none tracking-[0.015em] text-amber-100`}
        >
          Panlibrarium
        </h1>
        <p className="mb-8 max-w-md text-sm leading-relaxed text-amber-50/75 sm:text-base">
          {t("home.subtitle")}
        </p>

        {/* Séparateur */}
        <div className="mb-8 h-px w-24 bg-gradient-to-r from-amber-500/60 to-transparent" />

        {/* Items de menu */}
        <nav
          className="home-navigation flex flex-col"
          aria-label={t("menu.navigation")}
        >
          {isSignedIn ? (
            <>
              <MenuItem
                href="/game"
                label={t(hasActiveRun ? "menu.resume" : "home.play")}
                primary
                font={cinzel.className}
              />
              <MenuItem
                href="/library"
                label={t("home.library")}
                font={cinzel.className}
              />
              <MenuItem
                href="/leaderboard"
                label={t("home.leaderboard")}
                font={cinzel.className}
              />
              <MenuItem
                href="/runs"
                label={t("home.runs")}
                font={cinzel.className}
              />
              <MenuItem
                href="/rules"
                label={t("home.rules")}
                font={cinzel.className}
              />
              <MenuItemLogout
                label={t("home.logout")}
                font={cinzel.className}
              />
            </>
          ) : (
            <>
              <MenuItem
                href="/auth/signup"
                label={t("home.signup")}
                primary
                font={cinzel.className}
              />
              <MenuItem
                href="/auth/signin"
                label={t("home.signin")}
                font={cinzel.className}
              />
              <MenuItem
                href="/leaderboard"
                label={t("home.leaderboard")}
                font={cinzel.className}
              />
              <MenuItem
                href="/rules"
                label={t("home.rules")}
                font={cinzel.className}
              />
            </>
          )}
        </nav>

        {/* Version */}
        <p className="absolute bottom-6 left-10 font-mono text-[0.52rem] uppercase tracking-[0.4em] text-amber-100/20 sm:left-16 lg:left-24 xl:left-32">
          Panlibrarium — Alpha v0.1
        </p>
      </div>

      {/* Scintillement de l'écran – bord supérieur */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/25 to-transparent" />
    </main>
  );
}

/* ── Composants de menu ── */

function MenuItem({
  href,
  label,
  primary = false,
  font,
}: {
  href: string;
  label: string;
  primary?: boolean;
  font: string;
}) {
  return (
    <Link
      href={href}
      className={` ${font} home-menu-link group flex min-h-11 w-fit cursor-pointer items-center rounded-sm py-[0.42rem] uppercase transition-all duration-150 ${
        primary
          ? "mb-1 text-[1.45rem] font-semibold tracking-[0.16em] text-amber-100 sm:text-[1.6rem]"
          : "text-[1.05rem] font-normal tracking-[0.14em] text-amber-100/75 hover:text-amber-100 sm:text-[1.15rem]"
      } `}
    >
      {/* Barre dorée animée */}
      <span
        className={`mr-0 inline-block h-[1.5px] shrink-0 self-center rounded-full bg-gradient-to-r from-amber-400 to-amber-300/0 transition-all duration-200 ease-out ${
          primary
            ? "mr-5 w-8 opacity-90"
            : "w-0 opacity-0 group-hover:mr-4 group-hover:w-5 group-hover:opacity-60"
        } `}
      />
      {label}
    </Link>
  );
}

function MenuItemLogout({ label, font }: { label: string; font: string }) {
  return (
    <LogoutButton
      label={label}
      className={` ${font} mt-1 flex cursor-pointer items-center !border-0 py-[0.42rem] text-[1rem] font-normal uppercase tracking-[0.14em] !outline-none !ring-0 transition-colors duration-150 hover:text-amber-100/70 focus:!border-0 focus:!outline-none focus:!ring-0 focus-visible:!border-0 focus-visible:!outline-none focus-visible:!ring-0 sm:text-[1.05rem]`}
    />
  );
}
