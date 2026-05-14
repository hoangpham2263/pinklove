"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ArrowLeft, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";

type AdminInlineLinkButtonProps = {
  href: string;
  target?: string;
  children: ReactNode;
};

type AdminLinkButtonProps = AdminInlineLinkButtonProps & {
  className?: string;
};

type AdminButtonProps = ComponentProps<typeof Button>;

export function AdminCreateButton({ children, className, ...props }: AdminButtonProps) {
  return (
    <Button size="lg" className={className} {...props}>
      <Plus className="h-4 w-4" />
      {children}
    </Button>
  );
}

export function AdminSubmitButton({ children, className, type = "submit", ...props }: AdminButtonProps) {
  return (
    <Button type={type} className={className} {...props}>
      {children}
    </Button>
  );
}

export function AdminBulkSubmitButton({ children, className, type = "submit", ...props }: AdminButtonProps) {
  return (
    <Button type={type} size="lg" className={className} {...props}>
      {children}
    </Button>
  );
}

export function AdminCancelButton({ children, className, type = "button", ...props }: AdminButtonProps) {
  return (
    <Button type={type} variant="outline" className={className} {...props}>
      {children}
    </Button>
  );
}

export function AdminOutlineButton({ children, className, type = "button", ...props }: AdminButtonProps) {
  return (
    <Button type={type} variant="outline" className={className} {...props}>
      {children}
    </Button>
  );
}

export function AdminIconButton({ children, className, type = "button", ...props }: AdminButtonProps) {
  return (
    <Button type={type} variant="outline" size="icon-sm" className={className} {...props}>
      {children}
    </Button>
  );
}

export function AdminDeleteButton({ children, className, type = "button", ...props }: AdminButtonProps) {
  return (
    <Button type={type} variant="destructive" className={className} {...props}>
      {children}
    </Button>
  );
}

export function AdminSecondaryButton({ children, className, type = "button", ...props }: AdminButtonProps) {
  return (
    <Button type={type} variant="secondary" className={className} {...props}>
      {children}
    </Button>
  );
}

export function AdminCreateLinkButton({ href, target, children, className }: AdminLinkButtonProps) {
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

export function AdminDialogCreateTrigger({ children }: { children: ReactNode }) {
  return (
    <DialogTrigger render={<Button size="lg" />}>
      <Plus className="h-4 w-4" />
      {children}
    </DialogTrigger>
  );
}

export function AdminDialogOutlineTrigger({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <DialogTrigger
      render={
        <Button type="button" variant="outline" className={className} title={title} />
      }
    >
      {children}
    </DialogTrigger>
  );
}

export function AdminDialogPrimaryTrigger({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <DialogTrigger
      render={
        <Button type="button" className={className} title={title} />
      }
    >
      {children}
    </DialogTrigger>
  );
}

export function AdminBackButton({ href, target, children, className }: AdminLinkButtonProps) {
  return (
    <Button
      variant="outline"
      className={className}
      render={
        <Link href={href} target={target} rel={target === "_blank" ? "noopener noreferrer" : undefined}>
          <ArrowLeft className="h-4 w-4" />
          {children}
        </Link>
      }
    />
  );
}

export function AdminLinkButton({ href, target, children, className }: AdminLinkButtonProps) {
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

export function AdminFilterLinkButton({
  href,
  target,
  children,
  className,
  active = false,
}: AdminLinkButtonProps & { active?: boolean }) {
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

export function AdminInlineLinkButton({ href, target, children }: AdminInlineLinkButtonProps) {
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
