"use client";

import { cn } from "@/lib/utils/cn";
import { Tooltip } from "./Tooltip";
import type { BuffInstance } from "@/game/schemas/entities";
import { buffMeta } from "./buff-meta";

interface BuffPillProps {
  buff: BuffInstance;
  size?: "sm" | "md";
}

export function BuffPill({ buff, size = "sm" }: BuffPillProps) {
  const meta = buffMeta[buff.type];
  const label = meta?.label ?? buff.type;
  const colorClass = meta?.color ?? "bg-gray-700 text-gray-300";
  const description = meta?.description(buff.stacks) ?? "";
  const durationNote =
    buff.duration !== undefined
      ? ` Lasts ${buff.duration} turn${buff.duration !== 1 ? "s" : ""}.`
      : "";

  const textSize = size === "sm" ? "text-[10px]" : "text-xs";

  return (
    <Tooltip
      content={
        <span>
          <span className="font-bold">
            {label} {buff.stacks}
          </span>
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
