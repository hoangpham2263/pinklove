"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NativeForm } from "@/components/common/native-form";
import { AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import { ROUTES } from "@/lib/routes";
import type { InternalProductImportApiSettings } from "@/lib/system-settings";

type InternalProductImportApiFormProps = {
  settings: InternalProductImportApiSettings;
};

export function InternalProductImportApiForm({ settings }: InternalProductImportApiFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const endpoint = ROUTES.API.ADMIN.INTERNAL.PRODUCTS_IMPORT;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const formData = new FormData(event.currentTarget);
      formData.append("section", "internal_api_products");
      const result = await adminApi.updateConfig(formData);
      toast.success(result.message ?? "Đã lưu cấu hình API import sản phẩm.");
      finishMutation(router, result, { redirect: false, refresh: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu cấu hình API import sản phẩm.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <AdminOverviewGrid>
        <AdminOverviewCard title="Trạng thái" value={settings.enabled ? "On" : "Off"} />
        <AdminOverviewCard title="Endpoint">
          <p className="break-all text-sm">{endpoint}</p>
        </AdminOverviewCard>
        <AdminOverviewCard title="Mặc định" value={settings.defaultStatus} />
        <AdminOverviewCard title="Luồng import" value="Sản phẩm thường" />
      </AdminOverviewGrid>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>API import sản phẩm</CardTitle>
          <CardDescription>
            Bật API nội bộ để hệ thống ngoài import hoặc upsert sản phẩm qua token. Tạm thời trang này quản lý riêng cho API sản phẩm.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NativeForm action={adminApiActions.updateConfig} method="POST" className="space-y-5" onSubmit={handleSubmit}>
            <label className="flex items-start gap-3 rounded-md border bg-card p-4">
              <input type="checkbox" name="enabled" defaultChecked={settings.enabled} className="mt-1 rounded border-input" />
              <span className="space-y-1">
                <span className="block font-medium">Bật API import sản phẩm</span>
                <span className="block text-sm text-muted-foreground">
                  Khi tắt, mọi request vào endpoint import sản phẩm sẽ bị từ chối.
                </span>
              </span>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="token" className="font-medium">Internal API Token</label>
                <Input
                  id="token"
                  name="token"
                  defaultValue={settings.token}
                  placeholder="Nhập token dùng cho Authorization Bearer hoặc x-internal-api-token"
                />
                <p className="text-sm text-muted-foreground">
                  Dùng header `Authorization: Bearer &lt;token&gt;` hoặc `x-internal-api-token`.
                </p>
              </div>
              <div className="space-y-2">
                <label htmlFor="defaultStatus" className="font-medium">Trạng thái mặc định khi thiếu dữ liệu</label>
                <select
                  id="defaultStatus"
                  name="defaultStatus"
                  defaultValue={settings.defaultStatus}
                  className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                </select>
              </div>
            </div>

            <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
              Endpoint này cố định cho sản phẩm thường. Coded template được tạo từ code/seed, builder được tạo từ trình builder riêng.
            </div>

            <div className="space-y-2 rounded-lg border bg-muted/30 p-4 text-sm">
              <p className="font-medium">Payload mẫu</p>
              <pre className="overflow-hidden whitespace-pre-wrap break-words rounded-md bg-background p-3 text-xs">
{`POST ${endpoint}
Authorization: Bearer <token>
Content-Type: application/json

{
  "product": {
    "slug": "san-pham-demo",
    "name": "Sản phẩm demo",
    "status": "draft",
    "price": 250000,
    "fulfillmentType": "physical",
    "categorySlug": "san-pham",
    "excerpt": "Mô tả ngắn",
    "description": "Mô tả chi tiết"
  }
}`}
              </pre>
            </div>

            <AdminSubmitButton disabled={isSaving}>
              {isSaving ? "Đang lưu..." : "Lưu cấu hình API sản phẩm"}
            </AdminSubmitButton>
          </NativeForm>
        </CardContent>
      </Card>
    </div>
  );
}
