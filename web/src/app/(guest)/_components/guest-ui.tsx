import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GuestShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cn("container mx-auto flex w-full flex-1 flex-col px-4", className)}>{children}</section>;
}

export function GuestPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)] lg:rounded-2xl",
        className
      )}
    >
      {children}
    </div>
  );
}

export function GuestPanelHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("border-b border-stone-100 px-6 py-5", className)}>{children}</div>;
}

export function GuestPanelTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <h2 className={cn("text-xl font-semibold text-stone-900", className)}>{children}</h2>;
}

export function GuestPanelBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("px-6 py-6", className)}>{children}</div>;
}

export function GuestButton({
  className,
  ...props
}: ComponentPropsWithoutRef<"button">) {
  return (
    <button
      className={cn(
        "inline-flex min-h-12 items-center justify-center rounded-xl bg-stone-950 px-6 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 lg:rounded-2xl",
        className
      )}
      {...props}
    />
  );
}

export function GuestLinkButton({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-12 items-center justify-center rounded-xl px-6 text-sm font-semibold transition lg:rounded-2xl",
        variant === "primary"
          ? "bg-stone-950 text-white hover:bg-stone-800"
          : "border border-stone-300 bg-white text-stone-900 hover:bg-stone-50",
        className
      )}
    >
      {children}
    </Link>
  );
}

export function GuestInput(props: ComponentPropsWithoutRef<"input">) {
  return (
    <input
      {...props}
      className={cn(
        "h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-950 lg:rounded-2xl",
        props.className
      )}
    />
  );
}

export function GuestTextarea(props: ComponentPropsWithoutRef<"textarea">) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-32 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-950 lg:rounded-2xl",
        props.className
      )}
    />
  );
}
