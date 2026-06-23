"use client";

import { NativeForm } from "@/components/common/native-form";
import { RouteBreadcrumbs } from "@/components/common/route-breadcrumbs";

import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { ProviderNavSubmitButton } from "@/features/provider-orders/components/provider-buttons";
import { ProviderWorkspaceHeaderMenu } from "@/features/provider-orders/components/provider-workspace-header-menu";
import { ROUTES } from "@/lib/routes";

type ProviderWorkspaceTopHeaderProps = {
  accountName: string;
  portalHref: string;
  breadcrumbEnabled?: boolean;
  breadcrumbSeparator?: string;
};

export function ProviderWorkspaceTopHeader({
  accountName,
  portalHref,
  breadcrumbEnabled = true,
  breadcrumbSeparator,
}: ProviderWorkspaceTopHeaderProps) {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 h-14 border-b border-border bg-background md:left-[18.181818%]">
      <div className="flex h-full w-full items-center justify-between px-5 md:px-7.5">
        <div className="flex min-w-0 items-center gap-3">
          {breadcrumbEnabled ? (
            <>
              <span className="shrink-0 text-foreground">|</span>
              <div className="min-w-0">
                <RouteBreadcrumbs
                  separator={breadcrumbSeparator}
                  listClassName="flex-nowrap overflow-hidden whitespace-nowrap text-sm"
                  linkClassName="truncate"
                  currentClassName="truncate font-medium text-foreground"
                />
              </div>
            </>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell listHref={portalHref} />
          <span className="hidden text-sm md:inline">{accountName}</span>
          <NativeForm action={ROUTES.AUTH.LOGOUT_API} method="POST" className="hidden md:block">
            <ProviderNavSubmitButton className="px-0 py-0 hover:bg-transparent hover:underline">Đăng xuất</ProviderNavSubmitButton>
          </NativeForm>
          <ProviderWorkspaceHeaderMenu />
        </div>
      </div>
    </header>
  );
}
