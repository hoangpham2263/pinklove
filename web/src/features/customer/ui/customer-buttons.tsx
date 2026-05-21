"use client";

import {
  RoleActionLinkTileTemplate,
  RoleCreateButtonTemplate,
  RoleCreateLinkButtonTemplate,
  RoleIconButtonTemplate,
  RoleInlineLinkButtonTemplate,
  RoleLinkButtonTemplate,
  RoleNavSubmitButtonTemplate,
  RoleOutlineButtonTemplate,
  RoleSubmitButtonTemplate,
  type RoleActionLinkTileProps,
  type RoleButtonProps,
  type RoleInlineLinkButtonProps,
  type RoleLinkButtonProps,
  type RoleNativeButtonProps,
} from "@/components/common/role-buttons-template";

export type CustomerButtonProps = RoleButtonProps;
export type CustomerNativeButtonProps = RoleNativeButtonProps;
export type CustomerInlineLinkButtonProps = RoleInlineLinkButtonProps;
export type CustomerLinkButtonProps = RoleLinkButtonProps;
export type CustomerActionLinkTileProps = RoleActionLinkTileProps;

export function CustomerCreateButton(props: CustomerButtonProps) {
  return <RoleCreateButtonTemplate {...props} />;
}

export function CustomerSubmitButton(props: CustomerButtonProps) {
  return <RoleSubmitButtonTemplate {...props} />;
}

export function CustomerOutlineButton(props: CustomerButtonProps) {
  return <RoleOutlineButtonTemplate {...props} />;
}

export function CustomerIconButton(props: CustomerButtonProps) {
  return <RoleIconButtonTemplate {...props} />;
}

export function CustomerLinkButton(props: CustomerLinkButtonProps) {
  return <RoleLinkButtonTemplate {...props} />;
}

export function CustomerCreateLinkButton(props: CustomerLinkButtonProps) {
  return <RoleCreateLinkButtonTemplate {...props} />;
}

export function CustomerInlineLinkButton(props: CustomerInlineLinkButtonProps) {
  return <RoleInlineLinkButtonTemplate {...props} />;
}

export function CustomerActionLinkTile(props: CustomerActionLinkTileProps) {
  return <RoleActionLinkTileTemplate {...props} />;
}

export function CustomerNavSubmitButton(props: CustomerNativeButtonProps) {
  return <RoleNavSubmitButtonTemplate {...props} />;
}
