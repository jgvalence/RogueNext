"use client";

import { Table } from "antd";
import type { TableProps } from "antd";
import { cn } from "@/lib/utils/cn";
type GenericObject = object;

export type RogueTableProps<RecordType extends GenericObject> =
  TableProps<RecordType>;

export function RogueTable<RecordType extends GenericObject>({
  className,
  ...props
}: RogueTableProps<RecordType>) {
  return <Table<RecordType> className={cn(className)} {...props} />;
}
