"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NativeForm } from "@/components/common/native-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AccountUser, AuthUser, UserProfile } from "@/lib/auth";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import { USER_ROLE_OPTIONS, getRoleLabel } from "@/lib/roles";

type EditUserFormProps = {
  actor: AuthUser;
  user: AccountUser;
  profile: UserProfile | null;
  returnTo?: string;
};

export function EditUserForm({ actor, user, profile, returnTo }: EditUserFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const result = await adminApi.updateUser(new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã cập nhật tài khoản.");
      finishMutation(router, result, { redirect: "replace", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật người dùng.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <NativeForm action={adminApiActions.updateUser} method="POST" className="flex flex-col gap-6 lg:flex-row" onSubmit={handleSubmit}>
      <input type="hidden" name="userId" value={user.id} />
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}

      <div className="flex-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Tài khoản</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label>Tên đăng nhập</label>
              <Input name="username" defaultValue={user.username} placeholder="" required />
            </div>

            <div className="space-y-2">
              <label>Mật khẩu mới (để trống nếu không đổi)</label>
              <Input name="password" type="password" placeholder="" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hồ sơ (Profile)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label>Họ và tên</label>
              <Input name="fullName" defaultValue={profile?.fullName ?? ""} placeholder="" />
            </div>
            <div className="space-y-2">
              <label>Tên hiển thị</label>
              <Input name="displayName" defaultValue={profile?.displayName ?? ""} placeholder="" />
            </div>
            <div className="space-y-2">
              <label>Số điện thoại</label>
              <Input name="phone" defaultValue={profile?.phone ?? ""} placeholder="" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label>Tiểu sử (Bio)</label>
              <textarea
                name="bio"
                defaultValue={profile?.bio ?? ""}
                rows={3}
                className="flex min-h-[80px] w-full rounded-lg border border-input bg-transparent focus:outline-none"
                placeholder=""
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="w-full shrink-0 space-y-6 lg:w-80">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="font-medium">Vai trò</label>
              <select
                name="role"
                defaultValue={user.role}
                disabled={user.id === actor.id}
                className="h-10 w-full disabled:opacity-50"
              >
                {USER_ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {getRoleLabel(role.value)} ({role.value})
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </NativeForm>
  );
}
