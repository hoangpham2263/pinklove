"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isRouteActive } from "@/lib/navigation";

type AdminNavLinkProps = {
  href: string;
  exact?: boolean;
  matchPrefixes?: string[];
  excludePaths?: string[];
  excludePrefixes?: string[];
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  children: React.ReactNode;
};

export function AdminNavLink({
  href,
  exact = false,
  matchPrefixes,
  excludePaths,
  excludePrefixes,
  className,
  activeClassName = "bg-muted",
  inactiveClassName = "hover:bg-muted",
  onClick,
  children,
}: AdminNavLinkProps) {
  const pathname = usePathname();
  const active = isRouteActive(pathname, href, { exact, matchPrefixes, excludePaths, excludePrefixes });

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={cn(className, active ? activeClassName : inactiveClassName)}
    >
      {children}
    </Link>
  );
}
