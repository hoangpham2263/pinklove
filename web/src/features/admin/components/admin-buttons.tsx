"use client";

import {
  RoleActionLinkTileTemplate,
  RoleActionTileButtonTemplate,
  RoleBulkSubmitButtonTemplate,
  RoleCancelButtonTemplate,
  RoleCreateButtonTemplate,
  RoleCreateLinkButtonTemplate,
  RoleDeleteButtonTemplate,
  RoleDialogCreateTriggerTemplate,
  RoleDialogOutlineTriggerTemplate,
  RoleDialogPrimaryTriggerTemplate,
  RoleDragHandleButtonTemplate,
  RoleFilterLinkButtonTemplate,
  RoleIconButtonTemplate,
  RoleInlineLinkButtonTemplate,
  RoleLinkButtonTemplate,
  RoleNavSubmitButtonTemplate,
  RoleOutlineButtonTemplate,
  RoleSecondaryButtonTemplate,
  RoleSubmitButtonTemplate,
  type RoleActionLinkTileProps,
  type RoleButtonProps,
  type RoleInlineLinkButtonProps,
  type RoleLinkButtonProps,
  type RoleNativeButtonProps,
} from "@/components/common/role-buttons-template";

export type AdminButtonProps = RoleButtonProps;
export type AdminNativeButtonProps = RoleNativeButtonProps;
export type AdminInlineLinkButtonProps = RoleInlineLinkButtonProps;
export type AdminLinkButtonProps = RoleLinkButtonProps;
export type AdminActionLinkTileProps = RoleActionLinkTileProps;

export function AdminCreateButton(props: AdminButtonProps) {
  return <RoleCreateButtonTemplate {...props} />;
}

export function AdminSubmitButton(props: AdminButtonProps) {
  return <RoleSubmitButtonTemplate {...props} />;
}

export function AdminBulkSubmitButton(props: AdminButtonProps) {
  return <RoleBulkSubmitButtonTemplate {...props} />;
}

export function AdminCancelButton(props: AdminButtonProps) {
  return <RoleCancelButtonTemplate {...props} />;
}

export function AdminOutlineButton(props: AdminButtonProps) {
  return <RoleOutlineButtonTemplate {...props} />;
}

export function AdminIconButton(props: AdminButtonProps) {
  return <RoleIconButtonTemplate {...props} />;
}

export function AdminDeleteButton(props: AdminButtonProps) {
  return <RoleDeleteButtonTemplate {...props} />;
}

export function AdminSecondaryButton(props: AdminButtonProps) {
  return <RoleSecondaryButtonTemplate {...props} />;
}

export function AdminCreateLinkButton(props: AdminLinkButtonProps) {
  return <RoleCreateLinkButtonTemplate {...props} />;
}

export function AdminDialogCreateTrigger(props: { children: React.ReactNode }) {
  return <RoleDialogCreateTriggerTemplate {...props} />;
}

export function AdminDialogOutlineTrigger(props: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return <RoleDialogOutlineTriggerTemplate {...props} />;
}

export function AdminDialogPrimaryTrigger(props: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return <RoleDialogPrimaryTriggerTemplate {...props} />;
}

export function AdminLinkButton(props: AdminLinkButtonProps) {
  return <RoleLinkButtonTemplate {...props} />;
}

export function AdminFilterLinkButton(props: AdminLinkButtonProps & { active?: boolean }) {
  return <RoleFilterLinkButtonTemplate {...props} />;
}

export function AdminInlineLinkButton(props: AdminInlineLinkButtonProps) {
  return <RoleInlineLinkButtonTemplate {...props} />;
}

export function AdminActionLinkTile(props: AdminActionLinkTileProps) {
  return <RoleActionLinkTileTemplate {...props} />;
}

export function AdminNavSubmitButton(props: AdminNativeButtonProps) {
  return <RoleNavSubmitButtonTemplate {...props} />;
}

export function AdminActionTileButton(props: AdminNativeButtonProps) {
  return <RoleActionTileButtonTemplate {...props} />;
}

export function AdminDragHandleButton(props: AdminNativeButtonProps) {
  return <RoleDragHandleButtonTemplate {...props} />;
}
