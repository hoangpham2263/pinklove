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
import { CustomerTableActionButton } from "@/features/customer/ui/customer-table-actions";

export type CustomerTableToolbarProps = TableToolbarTemplateProps;
export type CustomerTableSearchProps = TableSearchTemplateProps;
export type CustomerTableSelectProps = TableSelectTemplateProps;
export type CustomerTableClearButtonProps = Omit<TableClearButtonTemplateProps, "actionButton">;
export type CustomerTableSortButtonProps = TableSortButtonTemplateProps;

export function CustomerTableToolbar(props: CustomerTableToolbarProps) {
  return <TableToolbarTemplate {...props} />;
}

export function CustomerTableSearch(props: CustomerTableSearchProps) {
  return <TableSearchTemplate {...props} />;
}

export function CustomerTableSelect(props: CustomerTableSelectProps) {
  return <TableSelectTemplate {...props} />;
}

export function CustomerTableClearButton(props: CustomerTableClearButtonProps) {
  return <TableClearButtonTemplate {...props} actionButton={(buttonProps) => <CustomerTableActionButton {...buttonProps} />} />;
}

export function CustomerTableSortButton(props: CustomerTableSortButtonProps) {
  return <TableSortButtonTemplate {...props} />;
}
