"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { RogueCard } from "./RogueCard";
import { RogueTag } from "./RogueTag";

export interface RoguePageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  kicker?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: ReactNode;
  className?: string;
}

export function RoguePageHeader({
  title,
  subtitle,
  kicker,
  actions,
  backHref,
  backLabel,
  className,
}: RoguePageHeaderProps) {
  return (
    <RogueCard
      className={cn(
        "rounded-2xl border border-amber-100/15 bg-[#0A1118]/85 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-sm",
        className
      )}
      styles={{ body: { padding: 20 } }}
    >
      {(backHref || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {backHref && backLabel ? (
            <Link
              href={backHref}
              className="rounded-lg border border-amber-100/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/75 transition hover:border-amber-300/45 hover:text-amber-100"
            >
              {backLabel}
            </Link>
          ) : (
            <span />
          )}
          {actions ?? null}
        </div>
      )}

      {kicker ? (
        <RogueTag className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-amber-100/60">
          {kicker}
        </RogueTag>
      ) : null}
      <h1 className="mt-2 text-2xl font-black uppercase tracking-[0.08em] text-amber-100 sm:text-4xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-2 max-w-3xl text-sm text-amber-100/70 sm:text-base">
          {subtitle}
        </p>
      ) : null}
    </RogueCard>
  );
}
