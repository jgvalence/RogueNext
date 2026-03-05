"use client";

import { Empty } from "antd";
import type { EmptyProps } from "antd";
import { cn } from "@/lib/utils/cn";

export type RogueEmptyProps = EmptyProps;

export function RogueEmpty({ className, ...props }: RogueEmptyProps) {
  return <Empty className={cn(className)} {...props} />;
}
