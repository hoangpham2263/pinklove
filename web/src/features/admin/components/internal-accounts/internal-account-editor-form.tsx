"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useConfirm } from "@/components/common/confirm-provider";
import { NativeForm } from "@/components/common/native-form";
import { PasswordInput } from "@/components/common/password-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminDeleteButton, AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import type { InternalAccount } from "@/lib/internal-accounts";

type InternalAccountEditorFormProps = {
  account?: InternalAccount;
};

export function InternalAccountEditorForm({ account }: InternalAccountEditorFormProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const result = await adminApi.saveInternalAccount(new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã lưu tài khoản nội bộ.");
      finishMutation(router, result, { redirect: account ? "replace" : "push", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu tài khoản nội bộ.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!account) return;
    const approved = await confirm({
      title: "Xóa tài khoản nội bộ",
      description: `Bạn có chắc chắn muốn xóa tài khoản "${account.label}"?`,
      confirmText: "Xóa",
      cancelText: "Hủy",
      variant: "destructive",
    });
    if (!approved) return;

    setIsDeleting(true);
    const formData = new FormData();
    formData.set("id", account.id);
    try {
      const result = await adminApi.removeInternalAccount(formData);
      toast.success(result.message ?? "Đã xóa tài khoản nội bộ.");
      finishMutation(router, result, { redirect: "push", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa tài khoản nội bộ.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <NativeForm
      id="internal-account-editor-form"
      action={adminApiActions.saveInternalAccount}
      method="POST"
      className="grid gap-6 lg:grid-cols-12"
      onSubmit={handleSubmit}
    >
      {account ? <input type="hidden" name="id" value={account.id} /> : null}

      <div className="min-w-0 space-y-6 lg:col-span-9">
        <Card className="min-w-0 overflow-visible rounded-lg gap-0">
          <CardHeader className="border-b gap-0 pb-0">
            <CardTitle>Thông tin tài khoản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nền tảng</label>
                <Input name="platform" defaultValue={account?.platform ?? ""} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tên tài khoản</label>
                <Input name="label" defaultValue={account?.label ?? ""} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email / username / số điện thoại</label>
                <Input name="loginUsername" defaultValue={account?.loginUsername ?? ""} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mật khẩu</label>
                <PasswordInput
                  name="loginPassword"
                  defaultValue={account?.loginPassword ?? ""}
                  autoComplete="new-password"
                  allowGenerate
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Link đăng nhập hoặc trang quản trị</label>
                <Input name="loginUrl" defaultValue={account?.loginUrl ?? ""} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-visible rounded-lg gap-0">
          <CardHeader className="border-b gap-0 pb-0">
            <CardTitle>Ghi chú</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <Textarea name="notes" defaultValue={account?.notes ?? ""} className="min-h-32" />
          </CardContent>
        </Card>
      </div>

      <div className="min-w-0 space-y-6 lg:col-span-3">
        <Card className="min-w-0 rounded-lg lg:self-start">
          <CardHeader>
            <CardTitle>Tài khoản nội bộ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="font-medium">Thứ tự hiển thị</label>
              <Input name="sortOrder" type="number" defaultValue={account?.sortOrder ?? 0} />
            </div>

            <AdminSubmitButton className="w-full rounded-md" disabled={isSaving}>
              {isSaving ? "Đang lưu..." : account ? "Lưu thay đổi" : "Tạo tài khoản"}
            </AdminSubmitButton>

            {account ? (
              <div className="border-t pt-4">
                <AdminDeleteButton className="w-full rounded-md" disabled={isDeleting} onClick={() => void handleDelete()}>
                  {isDeleting ? "Đang xóa..." : "Xóa tài khoản"}
                </AdminDeleteButton>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </NativeForm>
  );
}
