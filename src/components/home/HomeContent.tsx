"use client";

import Image from "next/image";
import Link from "next/link";
import { Cinzel } from "next/font/google";
import { useTranslation } from "react-i18next";
import { LogoutButton } from "@/components/auth/LogoutButton";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "600", "700"] });

interface HomeContentProps {
  isSignedIn: boolean;
}

export function HomeContent({ isSignedIn }: HomeContentProps) {
  const { t } = useTranslation();

  return (
    <main
      className="relative h-screen w-screen overflow-hidden bg-[#040608]"
      style={{ fontFamily: cinzel.style.fontFamily }}
    >
      {/* ── BACKGROUND ── */}
      <div className="pointer-events-none absolute inset-0">
        {/* Art plein écran */}
        <Image
          src="/images/backgrounds/map.svg"
          alt=""
          fill
          priority
          className="object-cover object-center opacity-50"
          aria-hidden
        />
        <Image
          src="/images/backgrounds/combat.svg"
          alt=""
          fill
          className="object-cover object-right opacity-25 mix-blend-screen"
          aria-hidden
        />
        {/* Voile sombre : fort à gauche pour la lisibilité du menu */}
        <div className="from-[#020406]/97 via-[#020406]/72 absolute inset-0 bg-gradient-to-r from-[30%] via-[55%] to-[#020406]/20" />
        {/* Vignette haut/bas */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#020406]/80 via-transparent to-[#020406]/95" />
        {/* Lueur ambrée basse-gauche */}
        <div className="absolute bottom-0 left-0 h-1/2 w-1/2 bg-[radial-gradient(ellipse_at_bottom_left,rgba(245,158,11,0.07),transparent_70%)]" />
        {/* Grain subtil */}
        <div className="absolute inset-0 bg-[url('/images/backgrounds/map.svg')] bg-[length:200px_200px] bg-repeat opacity-[0.015] mix-blend-overlay" />
      </div>

      {/* ── PERSONNAGE ATMOSPHÉRIQUE (droite) ── */}
      <div className="pointer-events-none absolute bottom-0 right-[4%] hidden h-[88vh] w-[28vw] lg:block">
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
      <div className="relative z-10 flex h-full flex-col justify-center pl-10 sm:pl-16 lg:pl-24 xl:pl-32">
        {/* Kicker */}
        <p className="mb-3 text-[0.6rem] font-semibold uppercase tracking-[0.55em] text-amber-400/50">
          {t("home.kicker")}
        </p>

        {/* Titre principal */}
        <h1
          className={` ${cinzel.className} mb-12 animate-title-glow text-[clamp(3rem,7.5vw,6.5rem)] font-bold uppercase leading-none tracking-[0.06em] text-amber-100`}
        >
          Panlibrarium
        </h1>

        {/* Séparateur */}
        <div className="mb-8 h-px w-24 bg-gradient-to-r from-amber-500/60 to-transparent" />

        {/* Items de menu */}
        <nav className="flex flex-col">
          {isSignedIn ? (
            <>
              <MenuItem
                href="/game"
                label={t("home.play")}
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
      className={` ${font} group flex cursor-pointer items-center py-[0.42rem] uppercase outline-none transition-all duration-150 ${
        primary
          ? "mb-1 text-[1.45rem] font-semibold tracking-[0.16em] text-amber-100 sm:text-[1.6rem]"
          : "text-[1.05rem] font-normal tracking-[0.14em] text-amber-100/45 hover:text-amber-100/85 sm:text-[1.15rem]"
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
      className={` ${font} mt-1 flex cursor-pointer items-center py-[0.42rem] text-[1rem] font-normal uppercase tracking-[0.14em] text-amber-100/30 transition-colors duration-150 hover:text-amber-100/70 sm:text-[1.05rem]`}
    />
  );
}
