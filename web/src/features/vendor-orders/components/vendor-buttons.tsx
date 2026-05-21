"use client";

import {
  RoleActionLinkTileTemplate,
  RoleCreateButtonTemplate,
  RoleCreateLinkButtonTemplate,
  RoleDeleteButtonTemplate,
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

export type VendorButtonProps = RoleButtonProps;
export type VendorNativeButtonProps = RoleNativeButtonProps;
export type VendorInlineLinkButtonProps = RoleInlineLinkButtonProps;
export type VendorLinkButtonProps = RoleLinkButtonProps;
export type VendorActionLinkTileProps = RoleActionLinkTileProps;

export function VendorCreateButton(props: VendorButtonProps) {
  return <RoleCreateButtonTemplate {...props} />;
}

export function VendorSubmitButton(props: VendorButtonProps) {
  return <RoleSubmitButtonTemplate {...props} />;
}

export function VendorOutlineButton(props: VendorButtonProps) {
  return <RoleOutlineButtonTemplate {...props} />;
}

export function VendorIconButton(props: VendorButtonProps) {
  return <RoleIconButtonTemplate {...props} />;
}

export function VendorDeleteButton(props: VendorButtonProps) {
  return <RoleDeleteButtonTemplate {...props} />;
}

export function VendorSecondaryButton(props: VendorButtonProps) {
  return <RoleSecondaryButtonTemplate {...props} />;
}

export function VendorLinkButton(props: VendorLinkButtonProps) {
  return <RoleLinkButtonTemplate {...props} />;
}

export function VendorCreateLinkButton(props: VendorLinkButtonProps) {
  return <RoleCreateLinkButtonTemplate {...props} />;
}

export function VendorInlineLinkButton(props: VendorInlineLinkButtonProps) {
  return <RoleInlineLinkButtonTemplate {...props} />;
}

export function VendorActionLinkTile(props: VendorActionLinkTileProps) {
  return <RoleActionLinkTileTemplate {...props} />;
}

export function VendorNavSubmitButton(props: VendorNativeButtonProps) {
  return <RoleNavSubmitButtonTemplate {...props} />;
}
