"use client";

import {
  TableViewTemplate,
  type TableViewTemplateProps,
} from "@/components/common/table-view-template";

export type AdminTableViewProps<TData> = TableViewTemplateProps<TData>;

export function AdminTableView<TData>(props: AdminTableViewProps<TData>) {
  return <TableViewTemplate {...props} />;
}
