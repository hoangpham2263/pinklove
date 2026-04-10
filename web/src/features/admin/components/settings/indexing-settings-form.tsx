"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NativeForm } from "@/components/common/native-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { finishMutation, postForm } from "@/lib/client-mutation";
import { ROUTES } from "@/lib/routes";
import type { IndexingSettings } from "@/lib/system-settings";

export function IndexingSettingsForm({ settings }: { settings: IndexingSettings }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const formData = new FormData(event.currentTarget);
      formData.append("section", "indexing");
      const result = await postForm(ROUTES.API.ADMIN.CONFIG.UPDATE, formData);
      toast.success(result.message ?? "Đã lưu cài đặt indexing.");
      finishMutation(router, result, { redirect: false, refresh: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu cài đặt indexing.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="w-full rounded-lg">
      <CardHeader>
        <CardTitle className="text-base">Indexing</CardTitle>
        <CardDescription>Điều khiển robots và khả năng index toàn website.</CardDescription>
      </CardHeader>
      <CardContent>
        <NativeForm action={ROUTES.API.ADMIN.CONFIG.UPDATE} method="POST" className="space-y-4" onSubmit={handleSubmit}>
          <label className="flex items-start gap-3 rounded-md border bg-card p-4">
            <input type="checkbox" name="siteIndexingEnabled" defaultChecked={settings.siteIndexingEnabled} className="mt-1 rounded border-input" />
            <span className="space-y-1">
              <span className="block font-medium">Cho phép index website</span>
              <span className="block text-sm text-muted-foreground">Nếu tắt, robots và metadata sẽ chuyển site sang noindex/nofollow ở mức toàn cục.</span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-md border bg-card p-4">
            <input type="checkbox" name="includeSitemapInRobots" defaultChecked={settings.includeSitemapInRobots} className="mt-1 rounded border-input" />
            <span className="space-y-1">
              <span className="block font-medium">Hiện sitemap trong robots.txt</span>
              <span className="block text-sm text-muted-foreground">Xuất dòng `Sitemap:` trong robots.txt.</span>
            </span>
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex items-start gap-3 rounded-md border bg-card p-4">
              <input type="checkbox" name="disallowAdmin" defaultChecked={settings.disallowAdmin} className="mt-1 rounded border-input" />
              <span className="space-y-1">
                <span className="block font-medium">Disallow /admin</span>
                <span className="block text-sm text-muted-foreground">Chặn crawl khu admin.</span>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-md border bg-card p-4">
              <input type="checkbox" name="disallowUser" defaultChecked={settings.disallowUser} className="mt-1 rounded border-input" />
              <span className="space-y-1">
                <span className="block font-medium">Disallow /customer</span>
                <span className="block text-sm text-muted-foreground">Chặn crawl khu customer.</span>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-md border bg-card p-4">
              <input type="checkbox" name="disallowApi" defaultChecked={settings.disallowApi} className="mt-1 rounded border-input" />
              <span className="space-y-1">
                <span className="block font-medium">Disallow /api</span>
                <span className="block text-sm text-muted-foreground">Chặn crawl endpoint API.</span>
              </span>
            </label>
          </div>

          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Đang lưu..." : "Lưu cài đặt"}
          </Button>
        </NativeForm>
      </CardContent>
    </Card>
  );
}
