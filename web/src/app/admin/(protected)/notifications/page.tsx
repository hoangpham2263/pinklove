import { Bell, CalendarClock, CheckCircle2, FilePenLine } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminNotificationCreateDialog } from "@/features/notifications/components/admin-notification-create-dialog";
import { AdminNotificationsTable } from "@/features/notifications/components/admin-notifications-table";
import { listAdminNotifications, publishDueScheduledNotifications } from "@/features/notifications/server/service";
import { listAccounts, requireAdmin } from "@/lib/auth";
import { USER_ROLE_OPTIONS } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";

type AdminNotificationsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminNotificationsPage({ searchParams }: AdminNotificationsPageProps) {
  await requireAdmin();
  const query = (await searchParams) ?? {};
  await publishDueScheduledNotifications();
  const [accounts, notifications] = await Promise.all([listAccounts(), listAdminNotifications(50)]);
  const view = getQueryValue(query.view) === "scheduled" ? "scheduled" : "default";
  const sentCount = notifications.filter((item) => item.status === "sent").length;
  const scheduledCount = notifications.filter((item) => item.status === "scheduled").length;
  const draftCount = notifications.filter((item) => item.status === "draft").length;
  const visibleNotifications =
    view === "scheduled"
      ? notifications.filter((item) => item.status === "scheduled")
      : notifications.filter((item) => item.status !== "scheduled");

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={view === "default" ? "default" : "outline"}
            className={view === "default" ? "h-9" : "h-9 bg-white"}
            render={<Link href={ROUTES.ADMIN.NOTIFICATIONS}>Tất cả đang quản lý</Link>}
          />
          <Button
            variant={view === "scheduled" ? "default" : "outline"}
            className={view === "scheduled" ? "h-9" : "h-9 bg-white"}
            render={<Link href={`${ROUTES.ADMIN.NOTIFICATIONS}?view=scheduled`}>Đã lên lịch</Link>}
          />
        </div>
        <AdminNotificationCreateDialog
          accounts={accounts}
          roles={USER_ROLE_OPTIONS.map((role) => ({ value: role.value, label: role.label }))}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Tổng thông báo</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{notifications.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Đã gửi</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{sentCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Đang lên lịch</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{scheduledCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Bản nháp</CardTitle>
            <FilePenLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{draftCount}</p>
          </CardContent>
        </Card>
      </div>

      <AdminNotificationsTable
        notifications={visibleNotifications}
        accounts={accounts}
        roles={USER_ROLE_OPTIONS.map((role) => ({ value: role.value, label: role.label }))}
        statusOptions={view === "scheduled" ? ["scheduled"] : ["draft", "sent", "archived"]}
        hideStatusFilter={view === "scheduled"}
        emptyMessage={
          view === "scheduled"
            ? "Chưa có thông báo nào đang lên lịch."
            : "Không có thông báo phù hợp với bộ lọc hiện tại."
        }
      />
    </section>
  );
}
