"use client";

import { Segmented } from "antd";
import type { SegmentedProps } from "antd";
import { cn } from "@/lib/utils/cn";

export type RogueSegmentedProps = SegmentedProps;

export function RogueSegmented({ className, ...props }: RogueSegmentedProps) {
  return <Segmented className={cn(className)} {...props} />;
}
