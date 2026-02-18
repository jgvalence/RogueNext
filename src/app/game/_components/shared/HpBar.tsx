"use client";

import { cn } from "@/lib/utils/cn";

interface HpBarProps {
  current: number;
  max: number;
  className?: string;
  showText?: boolean;
  color?: "red" | "green" | "blue";
}

export function HpBar({
  current,
  max,
  className,
  showText = true,
  color = "red",
}: HpBarProps) {
  const percent = Math.max(0, Math.min(100, (current / max) * 100));

  const colorClasses = {
    red: "bg-red-500",
    green: "bg-green-500",
    blue: "bg-blue-500",
  };

  return (
    <div className={cn("relative h-5 w-full rounded bg-gray-700", className)}>
      <div
        className={cn(
          "h-full rounded transition-all duration-300 ease-out",
          colorClasses[color]
        )}
        style={{ width: `${percent}%` }}
      />
      {showText && (
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow">
          {current}/{max}
        </span>
      )}
    </div>
  );
}
