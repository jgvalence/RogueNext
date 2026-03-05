"use client";

import { Form } from "antd";
import type { FormProps } from "antd";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type RogueFormProps = Omit<FormProps, "children"> & {
  children?: ReactNode;
};
export const RogueFormItem = Form.Item;

export function RogueForm({ className, children, ...props }: RogueFormProps) {
  return (
    <Form className={cn(className)} {...props}>
      {children}
    </Form>
  );
}
