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
import { VendorTableActionButton } from "@/features/vendor-orders/components/vendor-table-actions";

export type VendorTableToolbarProps = TableToolbarTemplateProps;
export type VendorTableSearchProps = TableSearchTemplateProps;
export type VendorTableSelectProps = TableSelectTemplateProps;
export type VendorTableClearButtonProps = Omit<TableClearButtonTemplateProps, "actionButton">;
export type VendorTableSortButtonProps = TableSortButtonTemplateProps;

export function VendorTableToolbar(props: VendorTableToolbarProps) {
  return <TableToolbarTemplate {...props} />;
}

export function VendorTableSearch(props: VendorTableSearchProps) {
  return <TableSearchTemplate {...props} />;
}

export function VendorTableSelect(props: VendorTableSelectProps) {
  return <TableSelectTemplate {...props} />;
}

export function VendorTableClearButton(props: VendorTableClearButtonProps) {
  return <TableClearButtonTemplate {...props} actionButton={(buttonProps) => <VendorTableActionButton {...buttonProps} />} />;
}

export function VendorTableSortButton(props: VendorTableSortButtonProps) {
  return <TableSortButtonTemplate {...props} />;
}
