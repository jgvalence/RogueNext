"use client";

import { Button } from "antd";
import type { ButtonProps } from "antd";
import { cn } from "@/lib/utils/cn";

export type RogueButtonProps = ButtonProps;

export function RogueButton({ className, ...props }: RogueButtonProps) {
  return <Button className={cn(className)} {...props} />;
}
