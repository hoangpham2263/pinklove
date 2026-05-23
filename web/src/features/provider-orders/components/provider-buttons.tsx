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

export type ProviderButtonProps = RoleButtonProps;
export type ProviderNativeButtonProps = RoleNativeButtonProps;
export type ProviderInlineLinkButtonProps = RoleInlineLinkButtonProps;
export type ProviderLinkButtonProps = RoleLinkButtonProps;
export type ProviderActionLinkTileProps = RoleActionLinkTileProps;

export function ProviderCreateButton(props: ProviderButtonProps) {
  return <RoleCreateButtonTemplate {...props} />;
}

export function ProviderSubmitButton(props: ProviderButtonProps) {
  return <RoleSubmitButtonTemplate {...props} />;
}

export function ProviderOutlineButton(props: ProviderButtonProps) {
  return <RoleOutlineButtonTemplate {...props} />;
}

export function ProviderIconButton(props: ProviderButtonProps) {
  return <RoleIconButtonTemplate {...props} />;
}

export function ProviderDeleteButton(props: ProviderButtonProps) {
  return <RoleDeleteButtonTemplate {...props} />;
}

export function ProviderSecondaryButton(props: ProviderButtonProps) {
  return <RoleSecondaryButtonTemplate {...props} />;
}

export function ProviderLinkButton(props: ProviderLinkButtonProps) {
  return <RoleLinkButtonTemplate {...props} />;
}

export function ProviderCreateLinkButton(props: ProviderLinkButtonProps) {
  return <RoleCreateLinkButtonTemplate {...props} />;
}

export function ProviderInlineLinkButton(props: ProviderInlineLinkButtonProps) {
  return <RoleInlineLinkButtonTemplate {...props} />;
}

export function ProviderActionLinkTile(props: ProviderActionLinkTileProps) {
  return <RoleActionLinkTileTemplate {...props} />;
}

export function ProviderNavSubmitButton(props: ProviderNativeButtonProps) {
  return <RoleNavSubmitButtonTemplate {...props} />;
}
