"use client";

import { useState } from "react";
import { CalendarClock, Pencil, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AdminDialogOutlineTrigger, AdminDialogPrimaryTrigger, AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { AdminTableActionTrigger } from "@/features/admin/components/admin-table-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { adminApi } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import { getRoleLabel } from "@/lib/roles";
import type { NotificationAudienceType, AdminNotification } from "@/features/notifications/types";
import type { UserRole } from "@/lib/roles";

type AccountOption = {
  id: string;
  username: string;
  role: UserRole;
};

type RoleOption = {
  value: UserRole;
  label: string;
};

type AdminNotificationUpsertDialogProps = {
  accounts: AccountOption[];
  roles: RoleOption[];
  notification?: AdminNotification;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline";
  iconOnly?: boolean;
};

function toDateTimeLocalValue(value: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

export function AdminNotificationUpsertDialog({
  accounts,
  roles,
  notification,
  triggerLabel,
  triggerVariant = "default",
  iconOnly = false,
}: AdminNotificationUpsertDialogProps) {
  const router = useRouter();
  const isEditing = Boolean(notification);
  const [open, setOpen] = useState(false);
  const [audienceType, setAudienceType] = useState<NotificationAudienceType>(notification?.audienceType ?? "all");
  const [sendMode, setSendMode] = useState<"draft" | "now" | "scheduled">(
    notification?.status === "draft" ? "draft" : notification?.status === "scheduled" ? "scheduled" : "now"
  );
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(notification?.roles ?? []);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(notification?.targetUsers.map((user) => user.id) ?? []);

  const title = isEditing ? "Cập nhật thông báo" : "Tạo thông báo";
  const description = isEditing
    ? "Chỉnh sửa nội dung, đối tượng nhận hoặc trạng thái gửi của thông báo."
    : "Chọn đúng nhóm nhận trước, hệ thống chỉ hiển thị thêm phần cấu hình cần thiết cho nhóm đó.";
  const Trigger = triggerVariant === "outline" ? AdminDialogOutlineTrigger : AdminDialogPrimaryTrigger;

  const resetFormState = () => {
    setAudienceType(notification?.audienceType ?? "all");
    setSendMode(notification?.status === "draft" ? "draft" : notification?.status === "scheduled" ? "scheduled" : "now");
    setSelectedRoles(notification?.roles ?? []);
    setSelectedUserIds(notification?.targetUsers.map((user) => user.id) ?? []);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          resetFormState();
        }
      }}
    >
      {isEditing && iconOnly ? (
        <AdminTableActionTrigger action="edit" label={triggerLabel ?? "Sửa thông báo"} />
      ) : (
        <Trigger className={!isEditing ? "h-9" : undefined} title={triggerLabel ?? (isEditing ? "Sửa" : "Tạo thông báo")}>
          {isEditing ? <Pencil className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          {triggerLabel ?? (isEditing ? "Sửa" : "Tạo thông báo")}
        </Trigger>
      )}
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();

            const formData = new FormData(event.currentTarget);
            try {
              const result = isEditing
                ? await adminApi.updateNotification(formData)
                : await adminApi.createNotification(formData);
              toast.success(result.message ?? (isEditing ? "Đã cập nhật thông báo." : "Đã lưu thông báo."));
              setOpen(false);
              finishMutation(router, result, { redirect: false });
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Không thể lưu thông báo.");
            }
          }}
        >
          {notification ? <input type="hidden" name="id" value={notification.id} /> : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label htmlFor={notification ? `title-${notification.id}` : "title"} className="text-sm font-medium">Tiêu đề</label>
              <Input
                id={notification ? `title-${notification.id}` : "title"}
                name="title"
                placeholder="Ví dụ: Cập nhật đơn hàng mới"
                defaultValue={notification?.title ?? ""}
                className="bg-white"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor={notification ? `body-${notification.id}` : "body"} className="text-sm font-medium">Nội dung</label>
              <textarea
                id={notification ? `body-${notification.id}` : "body"}
                name="body"
                rows={4}
                defaultValue={notification?.body ?? ""}
                className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                placeholder="Nội dung hiển thị trong dropdown thông báo."
              />
            </div>

            <div className="space-y-2">
              <label htmlFor={notification ? `linkUrl-${notification.id}` : "linkUrl"} className="text-sm font-medium">Link điều hướng</label>
              <Input
                id={notification ? `linkUrl-${notification.id}` : "linkUrl"}
                name="linkUrl"
                placeholder="/customer/orders hoặc /admin/orders/..."
                defaultValue={notification?.linkUrl ?? ""}
                className="bg-white"
              />
              <p className="text-xs text-muted-foreground">Chỉ nhận link nội bộ bắt đầu bằng /.</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Thời điểm gửi</p>
              <div className="grid gap-2 md:grid-cols-3">
                <label className="flex items-center gap-2 rounded-lg border bg-white p-3 text-sm">
                  <input
                    type="radio"
                    name="sendMode"
                    value="draft"
                    checked={sendMode === "draft"}
                    onChange={() => setSendMode("draft")}
                  />
                  Bản nháp
                </label>
                <label className="flex items-center gap-2 rounded-lg border bg-white p-3 text-sm">
                  <input
                    type="radio"
                    name="sendMode"
                    value="now"
                    checked={sendMode === "now"}
                    onChange={() => setSendMode("now")}
                  />
                  Gửi ngay
                </label>
                <label className="flex items-center gap-2 rounded-lg border bg-white p-3 text-sm">
                  <input
                    type="radio"
                    name="sendMode"
                    value="scheduled"
                    checked={sendMode === "scheduled"}
                    onChange={() => setSendMode("scheduled")}
                  />
                  Lên lịch
                </label>
              </div>
              {sendMode === "scheduled" ? (
                <div className="relative">
                  <CalendarClock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    name="scheduledAt"
                    type="datetime-local"
                    className="bg-white pl-9"
                    defaultValue={toDateTimeLocalValue(notification?.scheduledAt ?? "")}
                    required
                  />
                </div>
              ) : (
                <input type="hidden" name="scheduledAt" value="" />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Đối tượng nhận</p>
            <div className="grid gap-2 md:grid-cols-3">
              <label className="flex items-center gap-2 rounded-lg border bg-white p-3 text-sm">
                <input
                  type="radio"
                  name="audienceType"
                  value="all"
                  checked={audienceType === "all"}
                  onChange={() => setAudienceType("all")}
                />
                Toàn bộ
              </label>
              <label className="flex items-center gap-2 rounded-lg border bg-white p-3 text-sm">
                <input
                  type="radio"
                  name="audienceType"
                  value="role"
                  checked={audienceType === "role"}
                  onChange={() => setAudienceType("role")}
                />
                Theo role
              </label>
              <label className="flex items-center gap-2 rounded-lg border bg-white p-3 text-sm">
                <input
                  type="radio"
                  name="audienceType"
                  value="users"
                  checked={audienceType === "users"}
                  onChange={() => setAudienceType("users")}
                />
                Cá nhân
              </label>
            </div>
          </div>

          {audienceType === "role" ? (
            <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
              <p className="text-sm font-medium">Chọn role nhận</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {roles.map((role) => (
                  <label key={role.value} className="flex items-center gap-2 rounded-lg border bg-white p-3 text-sm">
                    <input
                      type="checkbox"
                      name="roles"
                      value={role.value}
                      checked={selectedRoles.includes(role.value)}
                      onChange={(event) => {
                        setSelectedRoles((current) =>
                          event.target.checked
                            ? [...current, role.value]
                            : current.filter((item) => item !== role.value)
                        );
                      }}
                    />
                    {role.label}
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {audienceType === "users" ? (
            <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
              <p className="text-sm font-medium">Chọn tài khoản nhận riêng</p>
              <select
                name="userIds"
                multiple
                value={selectedUserIds}
                onChange={(event) => {
                  setSelectedUserIds(Array.from(event.target.selectedOptions, (option) => option.value));
                }}
                className="h-52 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.username} - {getRoleLabel(account.role)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">Giữ Ctrl/Cmd để chọn nhiều tài khoản.</p>
            </div>
          ) : null}

          <AdminSubmitButton className="w-full">
            {isEditing ? <Pencil className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            {isEditing ? "Lưu thay đổi" : sendMode === "scheduled" ? "Lên lịch gửi" : sendMode === "draft" ? "Lưu bản nháp" : "Gửi thông báo realtime"}
          </AdminSubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
