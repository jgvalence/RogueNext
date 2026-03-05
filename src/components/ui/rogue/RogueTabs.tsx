"use client";

import { Tabs } from "antd";
import type { TabsProps } from "antd";
import { cn } from "@/lib/utils/cn";

export type RogueTabsProps = TabsProps;

export function RogueTabs({ className, ...props }: RogueTabsProps) {
  return <Tabs className={cn(className)} {...props} />;
}
