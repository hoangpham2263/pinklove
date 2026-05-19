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

export type AdminTableActionKind = TableActionKind;
export type AdminTableActionsProps = TableActionsProps;
export type AdminTableActionButtonProps = TableActionButtonProps;
export type AdminTableActionTriggerProps = TableActionTriggerProps;

export function AdminTableActions(props: AdminTableActionsProps) {
  return <TableActionsTemplate {...props} />;
}

export function AdminTableActionButton(props: AdminTableActionButtonProps) {
  return <TableActionButtonTemplate {...props} />;
}

export function AdminTableActionTrigger(props: AdminTableActionTriggerProps) {
  return <TableActionTriggerTemplate {...props} />;
}
