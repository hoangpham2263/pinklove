import Link from "next/link";
import type { ReactNode } from "react";

type AdminInlineLinkButtonProps = {
  href: string;
  target?: string;
  children: ReactNode;
};

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
