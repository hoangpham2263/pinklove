"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isRouteActive } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type ProviderWorkspaceNavLinkProps = {
  href: string;
  exact?: boolean;
  matchPrefixes?: string[];
  excludePaths?: string[];
  excludePrefixes?: string[];
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  onNavigate?: React.ComponentProps<typeof Link>["onNavigate"];
  children: React.ReactNode;
};

export function ProviderWorkspaceNavLink({
  href,
  exact = false,
  matchPrefixes,
  excludePaths,
  excludePrefixes,
  className,
  activeClassName = "bg-zinc-950 text-white",
  inactiveClassName = "text-zinc-700 hover:bg-zinc-100",
  onNavigate,
  children,
}: ProviderWorkspaceNavLinkProps) {
  const pathname = usePathname();
  const active = isRouteActive(pathname, href, { exact, matchPrefixes, excludePaths, excludePrefixes });

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onNavigate={onNavigate}
      className={cn(className, active ? activeClassName : inactiveClassName)}
    >
      {children}
    </Link>
  );
}
