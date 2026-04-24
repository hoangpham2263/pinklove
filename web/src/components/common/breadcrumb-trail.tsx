import Link from "next/link";

import type { BreadcrumbItem } from "@/lib/breadcrumbs";
import { cn } from "@/lib/utils";

type BreadcrumbTrailProps = {
  items: BreadcrumbItem[];
  separator?: string;
  className?: string;
  listClassName?: string;
  linkClassName?: string;
  currentClassName?: string;
  separatorClassName?: string;
};

export function BreadcrumbTrail({
  items,
  separator = "/",
  className,
  listClassName,
  linkClassName,
  currentClassName,
  separatorClassName,
}: BreadcrumbTrailProps) {
  if (items.length <= 1) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className={cn("flex flex-wrap items-center gap-2 text-sm text-muted-foreground", listClassName)}>
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;

          return (
            <li key={`${item.label}-${item.href ?? index}`} className="flex items-center gap-2">
              {isCurrent || !item.href ? (
                <span className={cn("font-medium text-foreground", currentClassName)}>{item.label}</span>
              ) : (
                <Link href={item.href} className={cn("transition-colors hover:text-foreground", linkClassName)}>
                  {item.label}
                </Link>
              )}
              {!isCurrent ? <span className={cn("text-muted-foreground/60", separatorClassName)}>{separator}</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
