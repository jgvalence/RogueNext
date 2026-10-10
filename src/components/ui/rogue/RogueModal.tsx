"use client";

import { Modal } from "antd";
import type { ModalProps } from "antd";
import { cn } from "@/lib/utils/cn";

export type RogueModalProps = ModalProps;

export function RogueModal({ className, ...props }: RogueModalProps) {
  return <Modal className={cn("rogue-modal", className)} {...props} />;
}
