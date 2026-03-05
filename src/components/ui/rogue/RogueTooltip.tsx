"use client";

import { Tooltip } from "antd";
import type { TooltipProps } from "antd";
import { cn } from "@/lib/utils/cn";

export interface RogueTooltipProps extends Omit<TooltipProps, "title"> {
  title?: TooltipProps["title"];
  content?: TooltipProps["title"];
}

export function RogueTooltip({
  className,
  title,
  content,
  ...props
}: RogueTooltipProps) {
  return (
    <Tooltip className={cn(className)} title={content ?? title} {...props} />
  );
}
