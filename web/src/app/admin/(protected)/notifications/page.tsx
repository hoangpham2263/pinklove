import { Bell, CalendarClock, CheckCircle2, FilePenLine } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý thông báo</h1>
        </div>
        <AdminNotificationCreateDialog
          accounts={accounts}
          roles={USER_ROLE_OPTIONS.map((role) => ({ value: role.value, label: role.label }))}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-lg">
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Tổng thông báo</p>
              <p className="text-2xl font-semibold">{notifications.length}</p>
            </div>
            <Bell className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Đã gửi</p>
              <p className="text-2xl font-semibold">{sentCount}</p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Đang lên lịch</p>
              <p className="text-2xl font-semibold">{scheduledCount}</p>
            </div>
            <CalendarClock className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Bản nháp</p>
              <p className="text-2xl font-semibold">{draftCount}</p>
            </div>
            <FilePenLine className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-lg">
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Button
              variant={view === "default" ? "default" : "outline"}
              render={<Link href={ROUTES.ADMIN.NOTIFICATIONS}>Tất cả đang quản lý</Link>}
            />
            <Button
              variant={view === "scheduled" ? "default" : "outline"}
              render={<Link href={`${ROUTES.ADMIN.NOTIFICATIONS}?view=scheduled`}>Đã lên lịch</Link>}
            />
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
        </CardContent>
      </Card>
    </section>
  );
}
