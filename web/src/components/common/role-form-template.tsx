"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type RoleFieldProps = React.HTMLAttributes<HTMLDivElement> & {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
};

export type RoleInputProps = React.ComponentProps<typeof Input>;
export type RoleTextareaProps = React.ComponentProps<typeof Textarea>;
export type RoleSelectProps = React.ComponentProps<typeof Select>;
export type RoleCheckboxProps = Omit<React.ComponentProps<"input">, "type"> & {
  label?: React.ReactNode;
  description?: React.ReactNode;
};

export function RoleFieldTemplate({
  label,
  description,
  error,
  required,
  className,
  children,
  ...props
}: RoleFieldProps) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {label ? (
        <label className="block text-sm font-medium">
          {label}
          {required ? <span className="ml-1 text-destructive">*</span> : null}
        </label>
      ) : null}
      {children}
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

export function RoleInputTemplate({ className, ...props }: RoleInputProps) {
  return <Input className={cn("rounded-md", className)} {...props} />;
}

export function RoleTextareaTemplate({ className, ...props }: RoleTextareaProps) {
  return <Textarea className={cn("rounded-md", className)} {...props} />;
}

export function RoleSelectTemplate({ className, ...props }: RoleSelectProps) {
  return <Select className={cn("rounded-md", className)} {...props} />;
}

export function RoleCheckboxTemplate({
  label,
  description,
  className,
  children,
  ...props
}: RoleCheckboxProps) {
  if (!label && !description && !children) {
    return <input type="checkbox" className={cn("rounded border-input", className)} {...props} />;
  }

  return (
    <label className={cn("flex items-start gap-3 rounded-md border bg-card p-3", className)}>
      <input type="checkbox" className="mt-1 rounded border-input" {...props} />
      <span className="space-y-1">
        {label ? <span className="block font-medium">{label}</span> : null}
        {description ? <span className="block text-sm text-muted-foreground">{description}</span> : null}
        {children}
      </span>
    </label>
  );
}

export function RoleReadonlyFieldTemplate({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex min-h-10 items-center rounded-md border bg-muted/40 px-3 py-2 text-sm", className)}>
      {children}
    </div>
  );
}
