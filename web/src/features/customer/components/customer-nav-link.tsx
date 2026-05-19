"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isRouteActive } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type CustomerNavLinkProps = {
  href: string;
  exact?: boolean;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  onNavigate?: React.ComponentProps<typeof Link>["onNavigate"];
  children: React.ReactNode;
};

export function CustomerNavLink({
  href,
  exact = true,
  className,
  activeClassName = "bg-muted",
  inactiveClassName = "hover:bg-muted",
  onClick,
  onNavigate,
  children,
}: CustomerNavLinkProps) {
  const pathname = usePathname();
  const active = isRouteActive(pathname, href, exact);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      onNavigate={onNavigate}
      className={cn(className, active ? activeClassName : inactiveClassName)}
    >
      {children}
    </Link>
  );
}
