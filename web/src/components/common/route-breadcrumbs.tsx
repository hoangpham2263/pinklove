"use client";

import { usePathname } from "next/navigation";

import { BreadcrumbTrail } from "@/components/common/breadcrumb-trail";
import { getRouteBreadcrumbs } from "@/lib/breadcrumbs";

type RouteBreadcrumbsProps = {
  wrapperClassName?: string;
  separator?: string;
  listClassName?: string;
  linkClassName?: string;
  currentClassName?: string;
  separatorClassName?: string;
};

export function RouteBreadcrumbs({
  wrapperClassName,
  separator,
  listClassName,
  linkClassName,
  currentClassName,
  separatorClassName,
}: RouteBreadcrumbsProps) {
  const pathname = usePathname();
  const items = getRouteBreadcrumbs(pathname);

  if (items.length <= 1) {
    return null;
  }

  return (
    <div className={wrapperClassName}>
      <BreadcrumbTrail
        items={items}
        separator={separator}
        listClassName={listClassName}
        linkClassName={linkClassName}
        currentClassName={currentClassName}
        separatorClassName={separatorClassName}
      />
    </div>
  );
}
