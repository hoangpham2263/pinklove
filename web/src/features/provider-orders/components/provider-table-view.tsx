"use client";

import {
  TableViewTemplate,
  type TableViewTemplateProps,
} from "@/components/common/table-view-template";

export type ProviderTableViewProps<TData> = TableViewTemplateProps<TData>;

export function ProviderTableView<TData>(props: ProviderTableViewProps<TData>) {
  return <TableViewTemplate {...props} />;
}
