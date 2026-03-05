"use client";

import { Select } from "antd";
import type { SelectProps } from "antd";
import { cn } from "@/lib/utils/cn";

export type RogueSelectProps = SelectProps;

export function RogueSelect({ className, ...props }: RogueSelectProps) {
  return <Select className={cn(className)} {...props} />;
}
