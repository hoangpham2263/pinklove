import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AdminOverviewGridProps = {
  children: ReactNode;
  className?: string;
};

type AdminOverviewCardProps = {
  title: ReactNode;
  value?: ReactNode;
  description?: ReactNode;
  href?: string;
  hrefLabel?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function AdminOverviewGrid({ children, className }: AdminOverviewGridProps) {
  return <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>{children}</div>;
}

export function AdminOverviewCard({
  title,
  value,
  description,
  href,
  hrefLabel = "Xem khu vực",
  icon: Icon,
  children,
  className,
  contentClassName,
}: AdminOverviewCardProps) {
  return (
    <Card className={cn("rounded-lg", className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
      </CardHeader>
        <CardContent className={contentClassName}>
          {children ?? (
            <>
              {value !== undefined && value !== null ? <p>{value}</p> : null}
              {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
            {href ? (
              <Link href={href} className="mt-3 inline-flex items-center gap-2 text-sm text-foreground hover:text-primary">
                {hrefLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
