"use client";

import { Modal } from "antd";
import type { ModalProps } from "antd";

export type RogueModalProps = ModalProps;

export function RogueModal(props: RogueModalProps) {
  return <Modal {...props} />;
}
