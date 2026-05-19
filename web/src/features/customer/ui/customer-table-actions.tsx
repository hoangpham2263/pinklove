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

export type CustomerTableActionKind = TableActionKind;
export type CustomerTableActionsProps = TableActionsProps;
export type CustomerTableActionButtonProps = TableActionButtonProps;
export type CustomerTableActionTriggerProps = TableActionTriggerProps;

export function CustomerTableActions(props: CustomerTableActionsProps) {
  return <TableActionsTemplate {...props} />;
}

export function CustomerTableActionButton(props: CustomerTableActionButtonProps) {
  return <TableActionButtonTemplate {...props} />;
}

export function CustomerTableActionTrigger(props: CustomerTableActionTriggerProps) {
  return <TableActionTriggerTemplate {...props} />;
}
