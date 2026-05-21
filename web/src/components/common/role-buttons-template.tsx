"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import { ArrowRight, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";

export type RoleInlineLinkButtonProps = {
  href: string;
  target?: string;
  children: ReactNode;
};

export type RoleLinkButtonProps = RoleInlineLinkButtonProps & {
  className?: string;
};

export type RoleActionLinkTileProps = {
  href: string;
  target?: string;
  label: ReactNode;
  description?: ReactNode;
  showArrow?: boolean;
  variant?: "card" | "plain";
};

export type RoleButtonProps = ComponentProps<typeof Button>;
export type RoleNativeButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

function joinClassNames(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function RoleCreateButtonTemplate({ children, className, ...props }: RoleButtonProps) {
  return (
    <Button size="lg" className={className} {...props}>
      <Plus className="h-4 w-4" />
      {children}
    </Button>
  );
}

export function RoleSubmitButtonTemplate({ children, className, type = "submit", ...props }: RoleButtonProps) {
  return (
    <Button type={type} className={className} {...props}>
      {children}
    </Button>
  );
}

export function RoleBulkSubmitButtonTemplate({ children, className, type = "submit", ...props }: RoleButtonProps) {
  return (
    <Button type={type} size="lg" className={className} {...props}>
      {children}
    </Button>
  );
}

export function RoleCancelButtonTemplate({ children, className, type = "button", ...props }: RoleButtonProps) {
  return (
    <Button type={type} variant="outline" className={className} {...props}>
      {children}
    </Button>
  );
}

export function RoleOutlineButtonTemplate({ children, className, type = "button", ...props }: RoleButtonProps) {
  return (
    <Button type={type} variant="outline" className={className} {...props}>
      {children}
    </Button>
  );
}

export function RoleIconButtonTemplate({ children, className, type = "button", ...props }: RoleButtonProps) {
  return (
    <Button type={type} variant="outline" size="icon-sm" className={className} {...props}>
      {children}
    </Button>
  );
}

export function RoleDeleteButtonTemplate({ children, className, type = "button", ...props }: RoleButtonProps) {
  return (
    <Button type={type} variant="destructive" className={className} {...props}>
      {children}
    </Button>
  );
}

export function RoleSecondaryButtonTemplate({ children, className, type = "button", ...props }: RoleButtonProps) {
  return (
    <Button type={type} variant="secondary" className={className} {...props}>
      {children}
    </Button>
  );
}

export function RoleCreateLinkButtonTemplate({ href, target, children, className }: RoleLinkButtonProps) {
  return (
    <Button
      size="lg"
      className={className}
      render={
        <Link href={href} target={target} rel={target === "_blank" ? "noopener noreferrer" : undefined}>
          <Plus className="h-4 w-4" />
          {children}
        </Link>
      }
    />
  );
}

export function RoleDialogCreateTriggerTemplate({ children }: { children: ReactNode }) {
  return (
    <DialogTrigger render={<Button size="lg" />}>
      <Plus className="h-4 w-4" />
      {children}
    </DialogTrigger>
  );
}

export function RoleDialogOutlineTriggerTemplate({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <DialogTrigger render={<Button type="button" variant="outline" className={className} title={title} />}>
      {children}
    </DialogTrigger>
  );
}

export function RoleDialogPrimaryTriggerTemplate({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <DialogTrigger render={<Button type="button" className={className} title={title} />}>
      {children}
    </DialogTrigger>
  );
}

export function RoleLinkButtonTemplate({ href, target, children, className }: RoleLinkButtonProps) {
  return (
    <Button
      variant="outline"
      className={className}
      render={
        <Link href={href} target={target} rel={target === "_blank" ? "noopener noreferrer" : undefined}>
          {children}
        </Link>
      }
    />
  );
}

export function RoleFilterLinkButtonTemplate({
  href,
  target,
  children,
  className,
  active = false,
}: RoleLinkButtonProps & { active?: boolean }) {
  return (
    <Button
      variant={active ? "default" : "outline"}
      size="lg"
      className={className}
      render={
        <Link href={href} target={target} rel={target === "_blank" ? "noopener noreferrer" : undefined}>
          {children}
        </Link>
      }
    />
  );
}

export function RoleInlineLinkButtonTemplate({ href, target, children }: RoleInlineLinkButtonProps) {
  return (
    <Link
      href={href}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      className="inline-flex h-8 cursor-pointer items-center justify-center rounded-lg border bg-white px-3 font-medium outline-none transition-colors hover:bg-muted"
    >
      {children}
    </Link>
  );
}

export function RoleActionLinkTileTemplate({
  href,
  target,
  label,
  description,
  showArrow = false,
  variant = "card",
}: RoleActionLinkTileProps) {
  return (
    <Link
      href={href}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      className={joinClassNames(
        "block rounded-lg px-3 py-2.5 text-sm outline-none transition-colors hover:bg-muted",
        variant === "card" ? "border bg-white" : undefined
      )}
    >
      <span className="flex min-w-0 items-center justify-between gap-3">
        <span className="min-w-0">
          <span className="block truncate font-medium text-foreground">{label}</span>
          {description ? <span className="mt-1 block leading-5 text-muted-foreground">{description}</span> : null}
        </span>
        {showArrow ? <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" /> : null}
      </span>
    </Link>
  );
}

export function RoleNavSubmitButtonTemplate({
  children,
  className,
  type = "submit",
  ...props
}: RoleNativeButtonProps) {
  return (
    <button
      type={type}
      className={joinClassNames(
        "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left outline-none transition-colors hover:bg-muted",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function RoleActionTileButtonTemplate({
  children,
  className,
  type = "button",
  ...props
}: RoleNativeButtonProps) {
  return (
    <button
      type={type}
      className={joinClassNames(
        "flex min-w-0 cursor-pointer items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 text-left outline-none transition-colors hover:bg-muted",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function RoleDragHandleButtonTemplate({
  children,
  className,
  type = "button",
  ...props
}: RoleNativeButtonProps) {
  return (
    <button
      type={type}
      className={joinClassNames(
        "cursor-grab shrink-0 text-muted-foreground outline-none active:cursor-grabbing",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
