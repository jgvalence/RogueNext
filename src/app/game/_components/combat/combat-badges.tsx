import { cn } from "@/lib/utils/cn";

/**
 * Small badge showing incoming damage for the next enemy turn.
 * Red   = net damage after current block (block < damage).
 * Green = current block fully absorbs the hit.
 */
export function IncomingDamageBadge({
  damage,
  block,
  highlight = false,
}: {
  damage: number;
  block: number;
  highlight?: boolean;
}) {
  const covered = block >= damage;
  return (
    <div
      className={cn(
        "absolute -top-3 right-1 z-20 rounded border px-1 py-0.5 text-[10px] font-bold",
        highlight &&
          "ring-2 ring-rose-200/80 ring-offset-2 ring-offset-slate-950",
        covered
          ? "border-green-700/80 bg-green-950/90 text-green-300"
          : "border-red-700/80 bg-red-950/90 text-red-300"
      )}
    >
      {covered ? "\uD83D\uDEE1" : "\u2694"} {damage}
    </div>
  );
}

export function ArmorBadge({
  block,
  compact = false,
  highlight = false,
}: {
  block: number;
  compact?: boolean;
  highlight?: boolean;
}) {
  const value = Math.max(0, block);
  const hasArmor = value > 0;

  return (
    <div
      className={cn(
        "pointer-events-none absolute bottom-1 right-1 z-20 inline-flex items-center rounded border font-black leading-none shadow-sm",
        compact
          ? "gap-0.5 px-1 py-0.5 text-[9px]"
          : "gap-1 px-1.5 py-0.5 text-[10px]",
        highlight &&
          "ring-2 ring-cyan-200/80 ring-offset-2 ring-offset-slate-950",
        hasArmor
          ? "border-cyan-700/80 bg-cyan-950/90 text-cyan-200"
          : "border-slate-700/80 bg-slate-900/90 text-slate-400"
      )}
    >
      <span className={compact ? "text-[9px]" : "text-[10px]"}>
        {"\uD83D\uDEE1"}
      </span>
      <span>{value}</span>
    </div>
  );
}
