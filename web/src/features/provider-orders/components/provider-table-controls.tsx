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
import { ProviderTableActionButton } from "@/features/provider-orders/components/provider-table-actions";

export type ProviderTableToolbarProps = TableToolbarTemplateProps;
export type ProviderTableSearchProps = TableSearchTemplateProps;
export type ProviderTableSelectProps = TableSelectTemplateProps;
export type ProviderTableClearButtonProps = Omit<TableClearButtonTemplateProps, "actionButton">;
export type ProviderTableSortButtonProps = TableSortButtonTemplateProps;

export function ProviderTableToolbar(props: ProviderTableToolbarProps) {
  return <TableToolbarTemplate {...props} />;
}

export function ProviderTableSearch(props: ProviderTableSearchProps) {
  return <TableSearchTemplate {...props} />;
}

export function ProviderTableSelect(props: ProviderTableSelectProps) {
  return <TableSelectTemplate {...props} />;
}

export function ProviderTableClearButton(props: ProviderTableClearButtonProps) {
  return <TableClearButtonTemplate {...props} actionButton={(buttonProps) => <ProviderTableActionButton {...buttonProps} />} />;
}

export function ProviderTableSortButton(props: ProviderTableSortButtonProps) {
  return <TableSortButtonTemplate {...props} />;
}
