"use client";

import {
  TableActionButtonTemplate,
  TableActionsTemplate,
  TableActionTriggerTemplate,
  type TableActionButtonProps,
  type TableActionKind,
  type TableActionsProps,
  type TableActionTriggerProps,
} from "@/components/common/table-actions-template";

export type ProviderTableActionKind = TableActionKind;
export type ProviderTableActionsProps = TableActionsProps;
export type ProviderTableActionButtonProps = TableActionButtonProps;
export type ProviderTableActionTriggerProps = TableActionTriggerProps;

export function ProviderTableActions(props: ProviderTableActionsProps) {
  return <TableActionsTemplate {...props} />;
}

export function ProviderTableActionButton(props: ProviderTableActionButtonProps) {
  return <TableActionButtonTemplate {...props} />;
}

export function ProviderTableActionTrigger(props: ProviderTableActionTriggerProps) {
  return <TableActionTriggerTemplate {...props} />;
}
