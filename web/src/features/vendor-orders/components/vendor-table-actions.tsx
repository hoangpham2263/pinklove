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

export type VendorTableActionKind = TableActionKind;
export type VendorTableActionsProps = TableActionsProps;
export type VendorTableActionButtonProps = TableActionButtonProps;
export type VendorTableActionTriggerProps = TableActionTriggerProps;

export function VendorTableActions(props: VendorTableActionsProps) {
  return <TableActionsTemplate {...props} />;
}

export function VendorTableActionButton(props: VendorTableActionButtonProps) {
  return <TableActionButtonTemplate {...props} />;
}

export function VendorTableActionTrigger(props: VendorTableActionTriggerProps) {
  return <TableActionTriggerTemplate {...props} />;
}
