"use client";

import { Input } from "antd";
import type { ComponentProps } from "react";
import type { InputProps } from "antd";
import { cn } from "@/lib/utils/cn";

export type RogueInputProps = InputProps;
export type RogueTextAreaProps = ComponentProps<typeof Input.TextArea>;

export function RogueInput({ className, ...props }: RogueInputProps) {
  return <Input className={cn(className)} {...props} />;
}

export function RogueTextArea({ className, ...props }: RogueTextAreaProps) {
  return <Input.TextArea className={cn(className)} {...props} />;
}
