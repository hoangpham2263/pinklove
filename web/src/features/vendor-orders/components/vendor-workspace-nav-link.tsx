"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type VendorWorkspaceNavLinkProps = {
  href: string;
  exact?: boolean;
  matchPrefixes?: string[];
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  children: React.ReactNode;
};

function isActivePath(pathname: string, href: string, exact: boolean, matchPrefixes?: string[]) {
  if (!pathname) {
    return false;
  }

  if (matchPrefixes?.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  if (exact) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function VendorWorkspaceNavLink({
  href,
  exact = false,
  matchPrefixes,
  className,
  activeClassName = "bg-zinc-950 text-white",
  inactiveClassName = "text-zinc-700 hover:bg-zinc-100",
  children,
}: VendorWorkspaceNavLinkProps) {
  const pathname = usePathname();
  const active = isActivePath(pathname, href, exact, matchPrefixes);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(className, active ? activeClassName : inactiveClassName)}
    >
      {children}
    </Link>
  );
}
