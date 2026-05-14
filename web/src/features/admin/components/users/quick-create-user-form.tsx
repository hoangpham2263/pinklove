"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { NativeForm } from "@/components/common/native-form";
import { AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { Input } from "@/components/ui/input";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import { USER_ROLE_OPTIONS, type UserRole, USER_ROLES, getRoleLabel } from "@/lib/roles";

type QuickCreateUserFormProps = {
  defaultRole?: UserRole;
  returnTo?: string;
};

export function QuickCreateUserForm({
  defaultRole = USER_ROLES.CUSTOMER,
  returnTo,
}: QuickCreateUserFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await adminApi.createUser(new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã tạo tài khoản mới.");
      finishMutation(router, result, { redirect: false });
      event.currentTarget.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo tài khoản.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <NativeForm action={adminApiActions.createUser} method="POST" className="grid gap-4 md:grid-cols-3" onSubmit={handleSubmit}>
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
      <div className="space-y-2">
        <label>Tên đăng nhập</label>
        <Input name="username" required />
      </div>
      <div className="space-y-2">
        <label>Mật khẩu</label>
        <Input name="password" type="password" required />
      </div>
      <div className="space-y-2">
        <label>Vai trò</label>
        <select
          name="role"
          defaultValue={defaultRole}
          className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
        >
          {USER_ROLE_OPTIONS.map((role) => (
            <option key={role.value} value={role.value}>
              {getRoleLabel(role.value)} ({role.value})
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 border-t pt-4 md:col-span-3 md:grid-cols-3">
        <div className="space-y-2">
          <label>Họ và tên</label>
          <Input name="fullName" />
        </div>
        <div className="space-y-2">
          <label>Tên hiển thị</label>
          <Input name="displayName" />
        </div>
        <div className="space-y-2">
          <label>Số điện thoại</label>
          <Input name="phone" />
        </div>
      </div>

      <div className="md:col-span-3">
        <AdminSubmitButton className="w-full md:w-auto" disabled={isSubmitting}>
          {isSubmitting ? "Đang tạo..." : "Tạo tài khoản"}
        </AdminSubmitButton>
      </div>
    </NativeForm>
  );
}
