"use client";

import {
  TableClearButtonTemplate,
  TableSearchTemplate,
  TableSelectTemplate,
  TableSortButtonTemplate,
  TableToolbarTemplate,
  type TableClearButtonTemplateProps,
  type TableSearchTemplateProps,
  type TableSelectTemplateProps,
  type TableSortButtonTemplateProps,
  type TableToolbarTemplateProps,
} from "@/components/common/table-controls-template";
import { AdminTableActionButton } from "@/features/admin/components/admin-table-actions";

export type AdminTableToolbarProps = TableToolbarTemplateProps;
export type AdminTableSearchProps = TableSearchTemplateProps;
export type AdminTableSelectProps = TableSelectTemplateProps;
export type AdminTableClearButtonProps = Omit<TableClearButtonTemplateProps, "actionButton">;
export type AdminTableSortButtonProps = TableSortButtonTemplateProps;

export function AdminTableToolbar(props: AdminTableToolbarProps) {
  return <TableToolbarTemplate {...props} />;
}

export function AdminTableSearch(props: AdminTableSearchProps) {
  return <TableSearchTemplate {...props} />;
}

export function AdminTableSelect(props: AdminTableSelectProps) {
  return <TableSelectTemplate {...props} />;
}

export function AdminTableClearButton(props: AdminTableClearButtonProps) {
  return <TableClearButtonTemplate {...props} actionButton={(buttonProps) => <AdminTableActionButton {...buttonProps} />} />;
}

export function AdminTableSortButton(props: AdminTableSortButtonProps) {
  return <TableSortButtonTemplate {...props} />;
}
