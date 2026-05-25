import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ProviderPageProps = {
  children: ReactNode;
  className?: string;
};

type ProviderPageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
  className?: string;
};

type ProviderSectionCardProps = {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

type ProviderEmptyStateProps = {
  children: ReactNode;
  className?: string;
};

export function ProviderPage({ children, className }: ProviderPageProps) {
  return <section className={cn("flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5", className)}>{children}</section>;
}

export function ProviderPageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: ProviderPageHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-4 rounded-md border bg-background p-6", className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{eyebrow}</p> : null}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}

export function ProviderSectionCard({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: ProviderSectionCardProps) {
  return (
    <Card className={cn("rounded-lg", className)}>
      {title || description || actions ? (
        <CardHeader className="flex flex-col gap-3 border-b md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            {title ? <CardTitle className="text-base font-semibold">{title}</CardTitle> : null}
            {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </CardHeader>
      ) : null}
      <CardContent className={cn("pt-5", contentClassName)}>{children}</CardContent>
    </Card>
  );
}

export function ProviderEmptyState({ children, className }: ProviderEmptyStateProps) {
  return (
    <div className={cn("rounded-md border border-dashed p-6 text-sm text-muted-foreground", className)}>
      {children}
    </div>
  );
}
