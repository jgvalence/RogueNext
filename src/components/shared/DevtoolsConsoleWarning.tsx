"use client";

import { useEffect } from "react";

const TITLE_STYLE = [
  "color: #f8fafc",
  "background: linear-gradient(90deg, #991b1b, #b45309)",
  "padding: 10px 16px",
  "border-radius: 8px",
  "font-size: 24px",
  "font-weight: 800",
  "letter-spacing: 0.08em",
  "text-transform: uppercase",
].join(";");

const BODY_STYLE = [
  "color: #fecaca",
  "font-size: 13px",
  "line-height: 1.6",
].join(";");

function logWarning(): void {
  console.log(
    "%cAttention: la console n'est pas un menu de triche",
    TITLE_STYLE
  );
  console.log(
    "%cModifier l'etat du jeu ici peut casser les combats, corrompre la sauvegarde et produire des bugs difficiles a diagnostiquer. Continuez a vos risques et perils.",
    BODY_STYLE
  );
}

export function DevtoolsConsoleWarning() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    logWarning();
    const timeoutId = window.setTimeout(logWarning, 1200);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return null;
}
