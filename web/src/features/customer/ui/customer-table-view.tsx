"use client";

import {
  TableViewTemplate,
  type TableViewTemplateProps,
} from "@/components/common/table-view-template";

export type CustomerTableViewProps<TData> = TableViewTemplateProps<TData>;

export function CustomerTableView<TData>(props: CustomerTableViewProps<TData>) {
  return <TableViewTemplate {...props} />;
}
