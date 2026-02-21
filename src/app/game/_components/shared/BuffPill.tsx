"use client";

import { cn } from "@/lib/utils/cn";
import { Tooltip } from "./Tooltip";
import type { BuffInstance } from "@/game/schemas/entities";

interface BuffPillProps {
  buff: BuffInstance;
  size?: "sm" | "md";
}

const buffMeta: Record<
  string,
  { label: string; color: string; description: (stacks: number) => string }
> = {
  POISON: {
    label: "Poison",
    color: "bg-green-900 text-green-300",
    description: (s) =>
      `Deals ${s} damage at end of turn, then decreases by 1.`,
  },
  WEAK: {
    label: "Weak",
    color: "bg-yellow-900 text-yellow-300",
    description: () => "Reduces damage dealt by 25%.",
  },
  VULNERABLE: {
    label: "Vulnerable",
    color: "bg-orange-900 text-orange-300",
    description: () => "Increases damage taken by 50%.",
  },
  STRENGTH: {
    label: "Strength",
    color: "bg-red-900 text-red-300",
    description: (s) => `Increases all damage dealt by ${s}.`,
  },
  FOCUS: {
    label: "Focus",
    color: "bg-blue-900 text-blue-300",
    description: (s) => `Increases block gained by ${s}.`,
  },
  THORNS: {
    label: "Thorns",
    color: "bg-rose-900 text-rose-300",
    description: (s) => `Deals ${s} damage to attackers.`,
  },
};

export function BuffPill({ buff, size = "sm" }: BuffPillProps) {
  const meta = buffMeta[buff.type];
  const label = meta?.label ?? buff.type;
  const colorClass = meta?.color ?? "bg-gray-700 text-gray-300";
  const description = meta?.description(buff.stacks) ?? "";
  const durationNote =
    buff.duration !== undefined ? ` Lasts ${buff.duration} turn${buff.duration !== 1 ? "s" : ""}.` : "";

  const textSize = size === "sm" ? "text-[10px]" : "text-xs";

  return (
    <Tooltip
      content={
        <span>
          <span className="font-bold">{label} {buff.stacks}</span>
          {description && (
            <>
              <br />
              {description}
              {durationNote}
            </>
          )}
        </span>
      }
    >
      <span
        className={cn(
          "cursor-default rounded px-1.5 py-px font-medium",
          textSize,
          colorClass
        )}
      >
        {label} {buff.stacks}
      </span>
    </Tooltip>
  );
}
