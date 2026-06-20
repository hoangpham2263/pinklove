"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NativeForm } from "@/components/common/native-form";
import { AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import type { SitemapSettings } from "@/lib/system-settings";

const OPTIONS: Array<{ key: keyof SitemapSettings; title: string; description: string }> = [
  { key: "includeManagedPages", title: "Pages", description: "Bao gồm managed pages như home, gioi-thieu, dich-vu, tao-ma-qr, du-toan-cuoi, blog landing..." },
  { key: "includeBlogCategories", title: "Blog Categories", description: "Bao gồm trang category của blog trong sitemap.xml." },
  { key: "includeBlogPosts", title: "Blog Posts", description: "Bao gồm bài viết blog đã publish." },
  { key: "includeOfferings", title: "Offerings", description: "Bao gồm template coded và builder offerings đã publish." },
  { key: "includePublicSites", title: "Public Sites", description: "Bao gồm các public sites đã publish." },
];

export function SitemapSettingsForm({ settings }: { settings: SitemapSettings }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const formData = new FormData(event.currentTarget);
      formData.append("section", "sitemap");
      const result = await adminApi.updateConfig(formData);
      toast.success(result.message ?? "Đã lưu cài đặt sitemap.");
      finishMutation(router, result, { redirect: false, refresh: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu cài đặt sitemap.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="w-full rounded-lg">
      <CardHeader>
        <CardTitle className="text-base">Sitemap</CardTitle>
        <CardDescription>Chọn các nhóm nội dung sẽ xuất hiện trong `sitemap.xml`.</CardDescription>
      </CardHeader>
      <CardContent>
        <NativeForm action={adminApiActions.updateConfig} method="POST" className="space-y-4" onSubmit={handleSubmit}>
          <label className="flex items-start gap-3 rounded-md border bg-card p-4">
            <input type="checkbox" name="enabled" defaultChecked={settings.enabled} className="mt-1 rounded border-input" />
            <span className="space-y-1">
              <span className="block font-medium">Bật sitemap.xml</span>
              <span className="block text-sm text-muted-foreground">Nếu tắt, sitemap index sẽ không xuất các child sitemaps.</span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-md border bg-card p-4">
            <input type="checkbox" name="autoDiscovery" defaultChecked={settings.autoDiscovery} className="mt-1 rounded border-input" />
            <span className="space-y-1">
              <span className="block font-medium">Auto discovery</span>
              <span className="block text-sm text-muted-foreground">Tự quét static public pages từ source app để nhập chung vào `sitemap-pages.xml`.</span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-md border bg-card p-4">
            <input type="checkbox" name="includeDiscoveredRoutes" defaultChecked={settings.includeDiscoveredRoutes} className="mt-1 rounded border-input" />
            <span className="space-y-1">
              <span className="block font-medium">Static public pages</span>
              <span className="block text-sm text-muted-foreground">Đưa các public route tĩnh từ `src/app/(guest)` vào cùng `sitemap-pages.xml`.</span>
            </span>
          </label>

          {OPTIONS.map((option) => (
            <label key={option.key} className="flex items-start gap-3 rounded-md border bg-card p-4">
              <input type="checkbox" name={option.key} defaultChecked={settings[option.key]} className="mt-1 rounded border-input" />
              <span className="space-y-1">
                <span className="block font-medium">{option.title}</span>
                <span className="block text-sm text-muted-foreground">{option.description}</span>
              </span>
            </label>
          ))}

          <AdminSubmitButton disabled={isSaving}>
            {isSaving ? "Đang lưu..." : "Lưu cài đặt"}
          </AdminSubmitButton>
        </NativeForm>
      </CardContent>
    </Card>
  );
}
