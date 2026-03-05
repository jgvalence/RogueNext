"use client";

import { Card } from "antd";
import type { CardProps } from "antd";
import { cn } from "@/lib/utils/cn";

export type RogueCardProps = CardProps;
export const RogueCardMeta = Card.Meta;

export function RogueCard({ className, ...props }: RogueCardProps) {
  return <Card className={cn(className)} {...props} />;
}
