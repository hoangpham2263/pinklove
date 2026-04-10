"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NativeForm } from "@/components/common/native-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PermalinkSettings } from "@/lib/system-settings";
import { finishMutation, postForm } from "@/lib/client-mutation";
import { ROUTES } from "@/lib/routes";

export function PermalinkSettingsForm({ settings }: { settings: PermalinkSettings }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const formData = new FormData(event.currentTarget);
      formData.append("section", "permalink");
      const result = await postForm(ROUTES.API.ADMIN.CONFIG.UPDATE, formData);
      toast.success(result.message ?? "Đã lưu cài đặt permalink.");
      finishMutation(router, result, { redirect: false, refresh: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu cài đặt permalink.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="w-full rounded-lg">
      <CardHeader>
        <CardTitle className="text-base">Permalinks</CardTitle>
        <CardDescription>Thiết lập chung cho cách hệ thống dùng custom permalink của managed pages.</CardDescription>
      </CardHeader>
      <CardContent>
        <NativeForm action={ROUTES.API.ADMIN.CONFIG.UPDATE} method="POST" className="space-y-4" onSubmit={handleSubmit}>
          <label className="flex items-start gap-3 rounded-md border bg-card p-4">
            <input type="checkbox" name="legacyRedirects" defaultChecked={settings.legacyRedirects} className="mt-1 rounded border-input" />
            <span className="space-y-1">
              <span className="block font-medium">Redirect URL cũ sang permalink mới</span>
              <span className="block text-sm text-muted-foreground">Khi page đổi permalink, route cũ sẽ chuyển hướng sang URL mới để giữ SEO và bookmark.</span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-md border bg-card p-4">
            <input type="checkbox" name="enforceLeadingSlash" defaultChecked={settings.enforceLeadingSlash} className="mt-1 rounded border-input" />
            <span className="space-y-1">
              <span className="block font-medium">Luôn chuẩn hóa permalink có dấu `/` đầu</span>
              <span className="block text-sm text-muted-foreground">Giữ format URL đồng nhất trong admin preview, menu và sitemap.</span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-md border bg-card p-4">
            <input type="checkbox" name="stripTrailingSlash" defaultChecked={settings.stripTrailingSlash} className="mt-1 rounded border-input" />
            <span className="space-y-1">
              <span className="block font-medium">Bỏ dấu `/` cuối permalink</span>
              <span className="block text-sm text-muted-foreground">Áp dụng chuẩn URL gọn kiểu WordPress khi không dùng trailing slash.</span>
            </span>
          </label>

          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Đang lưu..." : "Lưu cài đặt"}
          </Button>
        </NativeForm>
      </CardContent>
    </Card>
  );
}
