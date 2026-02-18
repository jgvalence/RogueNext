"use client";

import { cn } from "@/lib/utils/cn";

interface EnergyOrbProps {
  current: number;
  max: number;
  className?: string;
}

export function EnergyOrb({ current, max, className }: EnergyOrbProps) {
  return (
    <div
      className={cn(
        "flex h-14 w-14 items-center justify-center rounded-full border-2 border-yellow-400 bg-yellow-900/80 text-xl font-bold text-yellow-300",
        className
      )}
    >
      {current}/{max}
    </div>
  );
}
