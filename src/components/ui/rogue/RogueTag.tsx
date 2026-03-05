"use client";

import { Tag } from "antd";
import type { TagProps } from "antd";
import { cn } from "@/lib/utils/cn";

export type RogueTagProps = TagProps;

export function RogueTag({
  className,
  bordered = true,
  ...props
}: RogueTagProps) {
  return (
    <Tag bordered={bordered} className={cn("!m-0", className)} {...props} />
  );
}
