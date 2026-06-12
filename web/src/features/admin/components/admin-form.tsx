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

export type AdminFieldProps = RoleFieldProps;
export type AdminInputProps = RoleInputProps;
export type AdminTextareaProps = RoleTextareaProps;
export type AdminSelectProps = RoleSelectProps;
export type AdminCheckboxProps = RoleCheckboxProps;

export function AdminField(props: AdminFieldProps) {
  return <RoleFieldTemplate {...props} />;
}

export function AdminInput(props: AdminInputProps) {
  return <RoleInputTemplate {...props} />;
}

export function AdminTextarea(props: AdminTextareaProps) {
  return <RoleTextareaTemplate {...props} />;
}

export function AdminSelect(props: AdminSelectProps) {
  return <RoleSelectTemplate {...props} />;
}

export function AdminCheckbox(props: AdminCheckboxProps) {
  return <RoleCheckboxTemplate {...props} />;
}

export function AdminReadonlyField(props: React.HTMLAttributes<HTMLDivElement>) {
  return <RoleReadonlyFieldTemplate {...props} />;
}
