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

export type CustomerFieldProps = RoleFieldProps;
export type CustomerInputProps = RoleInputProps;
export type CustomerTextareaProps = RoleTextareaProps;
export type CustomerSelectProps = RoleSelectProps;
export type CustomerCheckboxProps = RoleCheckboxProps;

export function CustomerField(props: CustomerFieldProps) {
  return <RoleFieldTemplate {...props} />;
}

export function CustomerInput(props: CustomerInputProps) {
  return <RoleInputTemplate {...props} />;
}

export function CustomerTextarea(props: CustomerTextareaProps) {
  return <RoleTextareaTemplate {...props} />;
}

export function CustomerSelect(props: CustomerSelectProps) {
  return <RoleSelectTemplate {...props} />;
}

export function CustomerCheckbox(props: CustomerCheckboxProps) {
  return <RoleCheckboxTemplate {...props} />;
}

export function CustomerReadonlyField(props: React.HTMLAttributes<HTMLDivElement>) {
  return <RoleReadonlyFieldTemplate {...props} />;
}
