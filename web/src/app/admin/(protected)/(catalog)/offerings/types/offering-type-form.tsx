"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { NativeForm } from "@/components/common/native-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminCancelButton, AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import {
  type OfferingFulfillmentType,
  type OfferingTypeDefinition,
} from "@/features/offerings/types";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import { ROUTES } from "@/lib/routes";
import { OfferingTypeFieldsBuilder } from "./offering-type-fields-builder";

type OfferingTypeFormProps = {
  offeringType?: OfferingTypeDefinition;
  returnTo?: string;
};

type OfferingTypeMetaboxTab = "inventory" | "provider";

const OFFERING_TYPE_METABOX_TABS: Array<{ key: OfferingTypeMetaboxTab; label: string }> = [
  { key: "inventory", label: "Kho" },
  { key: "provider", label: "Provider" },
];

function getFulfillmentTypeLabel(value: OfferingFulfillmentType) {
  switch (value) {
    case "digital":
      return "Sản phẩm online - Nhận qua link/file";
    case "physical":
      return "Sản phẩm vật lý - Có sản xuất/giao hàng";
    case "service":
      return "Dịch vụ - Có người thực hiện/đặt lịch";
    default:
      return value;
  }
}

export function OfferingTypeForm({
  offeringType,
  returnTo = ROUTES.ADMIN.OFFERING_TYPES,
}: OfferingTypeFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [activeMetaboxTab, setActiveMetaboxTab] = useState<OfferingTypeMetaboxTab>("inventory");
  const isEditing = Boolean(offeringType);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const result = await adminApi.saveOfferingType(new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã lưu offering type.");
      finishMutation(router, result, { redirect: "push", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu offering type.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <NativeForm
      action={adminApiActions.saveOfferingType}
      method="POST"
      className="grid gap-6 lg:grid-cols-12"
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="returnTo" value={returnTo} />

      <div className="min-w-0 space-y-6 lg:col-span-9">
        <Card className="min-w-0 overflow-visible rounded-lg gap-0">
          <CardHeader className="border-b gap-0 pb-0">
            <CardTitle>Thông tin offering type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="type-label" className="text-sm font-medium">Tên hiển thị</label>
                <Input id="type-label" name="label" defaultValue={offeringType?.label ?? ""} placeholder="Video cưới" required />
              </div>
              <div className="space-y-2">
                <label htmlFor="type-key" className="text-sm font-medium">Key</label>
                <Input
                  id="type-key"
                  name="key"
                  defaultValue={offeringType?.key ?? ""}
                  placeholder="video_invitation"
                  required
                  pattern="[a-z][a-z0-9_]*"
                  readOnly={offeringType?.isSystem}
                />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="type-fulfillment" className="text-sm font-medium">Fulfillment</label>
                <select
                  id="type-fulfillment"
                  name="fulfillmentType"
                  defaultValue={offeringType?.fulfillmentType ?? "digital"}
                  className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
                >
                  {(["digital", "physical", "service"] satisfies OfferingFulfillmentType[]).map((value) => (
                    <option key={value} value={value}>{getFulfillmentTypeLabel(value)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="type-template-key" className="text-sm font-medium">Template key</label>
                <Input id="type-template-key" name="templateKey" defaultValue={offeringType?.templateKey ?? ""} placeholder="video_invitation" />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="type-description" className="text-sm font-medium">Mô tả</label>
              <textarea
                id="type-description"
                name="description"
                defaultValue={offeringType?.description ?? ""}
                className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden rounded-lg gap-0">
          <CardHeader className="border-b gap-0 pb-0">
            <CardTitle>Metabox</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid min-h-[14rem] lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className="border-b bg-white p-3 lg:border-r lg:border-b-0">
                <div className="grid gap-1">
                  {OFFERING_TYPE_METABOX_TABS.map((tab) => {
                    const active = activeMetaboxTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                          active
                            ? "border-primary/30 bg-primary/5"
                            : "border-border/50 bg-white hover:border-primary/30 hover:bg-primary/5"
                        }`}
                        onClick={() => setActiveMetaboxTab(tab.key)}
                      >
                        <span className="block font-medium">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="min-w-0 p-6">
                <section className={activeMetaboxTab !== "inventory" ? "hidden" : "space-y-3"}>
                  <label className="flex items-start gap-3 rounded-md border bg-card p-3">
                    <input
                      type="checkbox"
                      name="supportsInventory"
                      defaultChecked={offeringType?.supportsInventory ?? false}
                      className="mt-1 rounded border-input"
                    />
                    <span className="space-y-1">
                      <span className="block font-medium">Có tồn kho</span>
                      <span className="block text-sm text-muted-foreground">Bật khi offering thuộc type này cần quản lý số lượng tồn.</span>
                    </span>
                  </label>
                </section>

                <section className={activeMetaboxTab !== "provider" ? "hidden" : "space-y-3"}>
                  <label className="flex items-start gap-3 rounded-md border bg-card p-3">
                    <input
                      type="checkbox"
                      name="supportsProviderSupply"
                      defaultChecked={offeringType?.supportsProviderSupply ?? false}
                      className="mt-1 rounded border-input"
                    />
                    <span className="space-y-1">
                      <span className="block font-medium">Cho provider supply</span>
                      <span className="block text-sm text-muted-foreground">Cho phép provider gửi yêu cầu cung cấp offering thuộc type này.</span>
                    </span>
                  </label>
                </section>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-visible rounded-lg gap-0">
          <CardHeader className="border-b gap-0 pb-0">
            <CardTitle>Field definitions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <OfferingTypeFieldsBuilder initialFields={offeringType?.fieldSchema} />
          </CardContent>
        </Card>
      </div>

      <div className="min-w-0 lg:col-span-3">
        <div className="space-y-6 lg:sticky lg:top-6">
          <Card className="min-w-0 rounded-lg">
            <CardHeader>
              <CardTitle>{isEditing ? "Lưu type" : "Tạo type"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="type-status" className="font-medium">Trạng thái</label>
                <select
                  id="type-status"
                  name="status"
                  defaultValue={offeringType?.status ?? "active"}
                  className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
                >
                  <option value="active">active</option>
                  <option value="draft">draft</option>
                  <option value="archived">archived</option>
                </select>
              </div>

              <div className="space-y-3 border-t pt-4">
                <AdminSubmitButton className="w-full rounded-md" disabled={isSaving}>
                  {isSaving ? "Đang lưu..." : "Lưu type"}
                </AdminSubmitButton>
                <AdminCancelButton
                  type="button"
                  className="w-full rounded-md"
                  render={<Link href={returnTo}>Hủy</Link>}
                  nativeButton={false}
                />
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </NativeForm>
  );
}
