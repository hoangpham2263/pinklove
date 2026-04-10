"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NativeForm } from "@/components/common/native-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { finishMutation, postForm } from "@/lib/client-mutation";
import { ROUTES } from "@/lib/routes";
import type { BreadcrumbSettings } from "@/lib/system-settings";

export function BreadcrumbSettingsForm({ settings }: { settings: BreadcrumbSettings }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const formData = new FormData(event.currentTarget);
      formData.append("section", "breadcrumb");
      const result = await postForm(ROUTES.API.ADMIN.CONFIG.UPDATE, formData);
      toast.success(result.message ?? "Đã lưu cài đặt breadcrumb.");
      finishMutation(router, result, { redirect: false, refresh: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu cài đặt breadcrumb.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="w-full rounded-lg">
      <CardHeader>
        <CardTitle className="text-base">Breadcrumbs</CardTitle>
        <CardDescription>Thiết lập chung cho breadcrumb UI và breadcrumb schema kiểu Rank Math.</CardDescription>
      </CardHeader>
      <CardContent>
        <NativeForm action={ROUTES.API.ADMIN.CONFIG.UPDATE} method="POST" className="space-y-4" onSubmit={handleSubmit}>
          <label className="flex items-start gap-3 rounded-md border bg-card p-4">
            <input type="checkbox" name="enabled" defaultChecked={settings.enabled} className="mt-1 rounded border-input" />
            <span className="space-y-1">
              <span className="block font-medium">Bật breadcrumb cho managed pages</span>
              <span className="block text-sm text-muted-foreground">Nếu tắt, hệ thống sẽ không render breadcrumb UI và schema cho các managed pages.</span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-md border bg-card p-4">
            <input type="checkbox" name="showOnPage" defaultChecked={settings.showOnPage} className="mt-1 rounded border-input" />
            <span className="space-y-1">
              <span className="block font-medium">Hiển thị breadcrumb trên trang</span>
              <span className="block text-sm text-muted-foreground">Cho phép render breadcrumb text/link ở đầu trang ngoài phần JSON-LD.</span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-md border bg-card p-4">
            <input type="checkbox" name="includeStructuredData" defaultChecked={settings.includeStructuredData} className="mt-1 rounded border-input" />
            <span className="space-y-1">
              <span className="block font-medium">Render breadcrumb structured data</span>
              <span className="block text-sm text-muted-foreground">Xuất `BreadcrumbList` JSON-LD cho search engines.</span>
            </span>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="homeLabel" className="font-medium">Tên mục Home</label>
              <Input id="homeLabel" name="homeLabel" defaultValue={settings.homeLabel} placeholder="Trang chủ" />
            </div>
            <div className="space-y-2">
              <label htmlFor="separator" className="font-medium">Ký tự phân cách</label>
              <Input id="separator" name="separator" defaultValue={settings.separator} placeholder="/" />
            </div>
          </div>

          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Đang lưu..." : "Lưu cài đặt"}
          </Button>
        </NativeForm>
      </CardContent>
    </Card>
  );
}
