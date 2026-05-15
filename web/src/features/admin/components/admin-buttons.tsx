"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";

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

type AdminActionLinkTileProps = {
  href: string;
  target?: string;
  label: ReactNode;
  description?: ReactNode;
  showArrow?: boolean;
};

type AdminButtonProps = ComponentProps<typeof Button>;
type AdminNativeButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

function joinClassNames(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

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

export function AdminActionLinkTile({ href, target, label, description, showArrow = false }: AdminActionLinkTileProps) {
  return (
    <Link
      href={href}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      className="block rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition-colors hover:bg-muted"
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

export function AdminNavSubmitButton({ children, className, type = "submit", ...props }: AdminNativeButtonProps) {
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

export function AdminActionTileButton({ children, className, type = "button", ...props }: AdminNativeButtonProps) {
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

export function AdminDragHandleButton({ children, className, type = "button", ...props }: AdminNativeButtonProps) {
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
