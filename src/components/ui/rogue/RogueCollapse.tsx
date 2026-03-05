"use client";

import { Collapse } from "antd";
import type { CollapseProps } from "antd";
import { cn } from "@/lib/utils/cn";

export type RogueCollapseProps = CollapseProps;

export function RogueCollapse({ className, ...props }: RogueCollapseProps) {
  return <Collapse className={cn(className)} {...props} />;
}
