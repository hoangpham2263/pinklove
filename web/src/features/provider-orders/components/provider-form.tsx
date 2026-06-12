"use client";

import type React from "react";
import {
  RoleCheckboxTemplate,
  RoleFieldTemplate,
  RoleInputTemplate,
  RoleReadonlyFieldTemplate,
  RoleSelectTemplate,
  RoleTextareaTemplate,
  type RoleCheckboxProps,
  type RoleFieldProps,
  type RoleInputProps,
  type RoleSelectProps,
  type RoleTextareaProps,
} from "@/components/common/role-form-template";

export type ProviderFieldProps = RoleFieldProps;
export type ProviderInputProps = RoleInputProps;
export type ProviderTextareaProps = RoleTextareaProps;
export type ProviderSelectProps = RoleSelectProps;
export type ProviderCheckboxProps = RoleCheckboxProps;

export function ProviderField(props: ProviderFieldProps) {
  return <RoleFieldTemplate {...props} />;
}

export function ProviderInput(props: ProviderInputProps) {
  return <RoleInputTemplate {...props} />;
}

export function ProviderTextarea(props: ProviderTextareaProps) {
  return <RoleTextareaTemplate {...props} />;
}

export function ProviderSelect(props: ProviderSelectProps) {
  return <RoleSelectTemplate {...props} />;
}

export function ProviderCheckbox(props: ProviderCheckboxProps) {
  return <RoleCheckboxTemplate {...props} />;
}

export function ProviderReadonlyField(props: React.HTMLAttributes<HTMLDivElement>) {
  return <RoleReadonlyFieldTemplate {...props} />;
}
