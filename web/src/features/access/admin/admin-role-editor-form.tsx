"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useConfirm } from "@/components/common/confirm-provider";
import { NativeForm } from "@/components/common/native-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminDeleteButton, AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import type { AdminPermission, AdminRole } from "@/features/access/server/service";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";

type AdminRoleEditorFormProps = {
  role?: AdminRole;
  permissions: AdminPermission[];
};

export function AdminRoleEditorForm({ role, permissions }: AdminRoleEditorFormProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const permissionsByModule = permissions.reduce<Record<string, AdminPermission[]>>((groups, permission) => {
    (groups[permission.module] ??= []).push(permission);
    return groups;
  }, {});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (role?.isActive && formData.get("status") === "inactive") {
      const approved = await confirm({
        title: "Tạm ngưng vai trò",
        description: `Các tài khoản đang dùng role "${role.label}" sẽ không thể truy cập Admin cho tới khi role được bật lại.`,
        confirmText: "Tạm ngưng",
        cancelText: "Hủy",
        variant: "destructive",
      });
      if (!approved) return;
    }

    setIsSaving(true);
    try {
      const result = await adminApi.saveAdminRole(formData);
      toast.success(result.message ?? "Đã lưu Admin role.");
      finishMutation(router, result, { redirect: "replace", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu Admin role.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!role) return;
    const approved = await confirm({
      title: "Xóa Admin role",
      description: `Role "${role.label}" sẽ bị xóa vĩnh viễn.`,
      confirmText: "Xóa role",
      cancelText: "Hủy",
      variant: "destructive",
    });
    if (!approved) return;

    setIsDeleting(true);
    try {
      const formData = new FormData();
      formData.set("id", role.id);
      const result = await adminApi.deleteAdminRole(formData);
      toast.success(result.message ?? "Đã xóa role.");
      finishMutation(router, result, { redirect: "push", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa role.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <NativeForm
      id="admin-role-editor-form"
      action={adminApiActions.saveAdminRole}
      method="POST"
      className="grid gap-6 lg:grid-cols-12"
      onSubmit={handleSubmit}
    >
      {role ? <input type="hidden" name="id" value={role.id} /> : null}

      <div className="min-w-0 space-y-6 lg:col-span-9">
        <Card className="min-w-0 overflow-visible rounded-lg gap-0">
          <CardHeader className="border-b gap-0 pb-0">
            <CardTitle>Thông tin vai trò</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tên vai trò</label>
                <Input name="label" defaultValue={role?.label ?? ""} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Key</label>
                <Input name="key" defaultValue={role?.key ?? ""} placeholder="staff" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mô tả</label>
              <Textarea name="description" defaultValue={role?.description ?? ""} />
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-visible rounded-lg gap-0">
          <CardHeader className="border-b gap-0 pb-0">
            <CardTitle>Quyền truy cập</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-5">
            {Object.entries(permissionsByModule).map(([module, modulePermissions]) => (
              <section key={module} className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{module}</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {modulePermissions.map((permission) => (
                    <label key={permission.id} className="flex items-start gap-3 rounded-md border p-3">
                      <input
                        type="checkbox"
                        name="permissionIds"
                        value={permission.id}
                        defaultChecked={role?.permissionIds.includes(permission.id)}
                        className="mt-1 rounded border-input"
                      />
                      <span className="min-w-0">
                        <span className="block font-medium">{permission.label}</span>
                        <span className="block text-sm text-muted-foreground">{permission.key}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="min-w-0 space-y-6 lg:col-span-3">
        <Card className="min-w-0 rounded-lg lg:self-start">
          <CardHeader>
            <CardTitle>Vai trò quản trị</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="font-medium">Trạng thái</label>
              <select
                name="status"
                defaultValue={role?.isActive === false ? "inactive" : "active"}
                className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Tạm ngưng</option>
              </select>
            </div>

            <AdminSubmitButton className="w-full rounded-md" disabled={isSaving}>
              {isSaving ? "Đang lưu..." : role ? "Lưu thay đổi" : "Tạo role"}
            </AdminSubmitButton>

            {role ? (
              <div className="border-t pt-4">
                <AdminDeleteButton className="w-full rounded-md" disabled={isDeleting} onClick={() => void handleDelete()}>
                  {isDeleting ? "Đang xóa..." : "Xóa role"}
                </AdminDeleteButton>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </NativeForm>
  );
}
