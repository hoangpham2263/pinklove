"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import { ArrowRight, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

type CustomerInlineLinkButtonProps = {
  href: string;
  target?: string;
  children: ReactNode;
};

type CustomerLinkButtonProps = CustomerInlineLinkButtonProps & {
  className?: string;
};

type CustomerActionLinkTileProps = {
  href: string;
  target?: string;
  label: ReactNode;
  description?: ReactNode;
  showArrow?: boolean;
  variant?: "card" | "plain";
};

type CustomerButtonProps = ComponentProps<typeof Button>;
type CustomerNativeButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

function joinClassNames(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function CustomerCreateButton({ children, className, ...props }: CustomerButtonProps) {
  return (
    <Button size="lg" className={className} {...props}>
      <Plus className="h-4 w-4" />
      {children}
    </Button>
  );
}

export function CustomerSubmitButton({ children, className, type = "submit", ...props }: CustomerButtonProps) {
  return (
    <Button type={type} className={className} {...props}>
      {children}
    </Button>
  );
}

export function CustomerOutlineButton({ children, className, type = "button", ...props }: CustomerButtonProps) {
  return (
    <Button type={type} variant="outline" className={className} {...props}>
      {children}
    </Button>
  );
}

export function CustomerIconButton({ children, className, type = "button", ...props }: CustomerButtonProps) {
  return (
    <Button type={type} variant="outline" size="icon-sm" className={className} {...props}>
      {children}
    </Button>
  );
}

export function CustomerLinkButton({ href, target, children, className }: CustomerLinkButtonProps) {
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

export function CustomerCreateLinkButton({ href, target, children, className }: CustomerLinkButtonProps) {
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

export function CustomerInlineLinkButton({ href, target, children }: CustomerInlineLinkButtonProps) {
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

export function CustomerActionLinkTile({
  href,
  target,
  label,
  description,
  showArrow = false,
  variant = "card",
}: CustomerActionLinkTileProps) {
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

export function CustomerNavSubmitButton({ children, className, type = "submit", ...props }: CustomerNativeButtonProps) {
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
