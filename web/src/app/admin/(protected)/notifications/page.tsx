import { Bell, CalendarClock, CheckCircle2, FilePenLine } from "lucide-react";
import { AdminFilterLinkButton } from "@/features/admin/components/admin-buttons";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
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
          <AdminFilterLinkButton href={ROUTES.ADMIN.NOTIFICATIONS} active={view === "default"}>
            Tất cả đang quản lý
          </AdminFilterLinkButton>
          <AdminFilterLinkButton href={`${ROUTES.ADMIN.NOTIFICATIONS}?view=scheduled`} active={view === "scheduled"}>
            Đã lên lịch
          </AdminFilterLinkButton>
        </div>
        <AdminNotificationCreateDialog
          accounts={accounts}
          roles={USER_ROLE_OPTIONS.map((role) => ({ value: role.value, label: role.label }))}
        />
      </div>

      <AdminOverviewGrid>
        <AdminOverviewCard title="Tổng thông báo" value={notifications.length} icon={Bell} />
        <AdminOverviewCard title="Đã gửi" value={sentCount} icon={CheckCircle2} />
        <AdminOverviewCard title="Đang lên lịch" value={scheduledCount} icon={CalendarClock} />
        <AdminOverviewCard title="Bản nháp" value={draftCount} icon={FilePenLine} />
      </AdminOverviewGrid>

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
