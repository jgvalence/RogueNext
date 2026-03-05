"use client";

import { Alert } from "antd";
import type { AlertProps } from "antd";
import { cn } from "@/lib/utils/cn";

export type RogueAlertProps = AlertProps;

export function RogueAlert({ className, ...props }: RogueAlertProps) {
  return <Alert className={cn(className)} {...props} />;
}
