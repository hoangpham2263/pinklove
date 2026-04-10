"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isRouteActive } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type UserNavLinkProps = {
  href: string;
  exact?: boolean;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  children: React.ReactNode;
};

export function UserNavLink({
  href,
  exact = true,
  className,
  activeClassName = "bg-muted",
  inactiveClassName = "hover:bg-muted",
  children,
}: UserNavLinkProps) {
  const pathname = usePathname();
  const active = isRouteActive(pathname, href, exact);

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
