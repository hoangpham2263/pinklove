"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CurrencyInput } from "@/components/common/currency-input";
import { NativeForm } from "@/components/common/native-form";
import { Input } from "@/components/ui/input";
import { AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { MediaSelector } from "@/features/media/components/media-selector";
import { BuilderEditorClient } from "@/features/invitations/builder/editor-client";
import { BuilderWorkspaceShell } from "@/features/invitations/builder/builder-workspace-shell";
import { createDefaultBuilderDocument } from "@/features/invitations/builder/defaults";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import { ROUTES } from "@/lib/routes";
import { slugify } from "@/lib/utils";
import {
  BUILDER_TEMPLATE_KEY,
  OFFERING_STATUSES,
  SYSTEM_OFFERING_TYPES,
  SYSTEM_TEMPLATE_ENGINES,
  getOfferingStatusLabel,
  type OfferingCategory,
} from "@/features/offerings/types";

type OfferingBuilderCreateFormProps = {
  categories: OfferingCategory[];
  returnTo?: string;
};

export function OfferingBuilderCreateForm({
  categories,
  returnTo = ROUTES.ADMIN.OFFERING_BUILDER,
}: OfferingBuilderCreateFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialBuilderDocument = useMemo(() => createDefaultBuilderDocument(), []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await adminApi.createOffering(new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã tạo builder.");
      finishMutation(router, result, { redirect: "push", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo builder.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <NativeForm
      action={adminApiActions.createOffering}
      method="POST"
      className="min-h-screen"
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="returnTo" value={returnTo} />
      <input type="hidden" name="offeringType" value={SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE} />
      <input type="hidden" name="templateEngine" value={SYSTEM_TEMPLATE_ENGINES.BUILDER} />
      <input type="hidden" name="templateKey" value={BUILDER_TEMPLATE_KEY} />
      <input type="hidden" name="fulfillmentType" value="digital" />
      <input type="hidden" name="ownerType" value="internal" />
      <input type="hidden" name="ownerProviderId" value="" />
      <input type="hidden" name="thumbnailUrl" value={thumbnailUrl} />
      <input type="hidden" name="stockQuantity" value="0" />
      <input type="hidden" name="lowStockThreshold" value="0" />

      <BuilderWorkspaceShell
        variant="fullscreen"
        editor={<BuilderEditorClient initialValue={initialBuilderDocument} />}
        sidebar={
          <>
            <div className="space-y-3">
              <h1 className="truncate text-base font-semibold">Tạo builder</h1>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="name" className="text-sm font-medium">Tên builder</label>
                <Input
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => {
                    const next = e.target.value;
                    setName(next);
                    setSlug(slugify(next));
                  }}
                  placeholder="Builder Garden Romance"
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="slug" className="text-sm font-medium">Slug</label>
                <Input
                  id="slug"
                  name="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="builder-garden-romance"
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="status" className="text-sm font-medium">Trạng thái</label>
                <select
                  id="status"
                  name="status"
                  defaultValue="draft"
                  className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
                >
                  {OFFERING_STATUSES.map((statusOption) => (
                    <option key={statusOption} value={statusOption}>{getOfferingStatusLabel(statusOption)}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="price" className="text-sm font-medium">Giá</label>
                <CurrencyInput id="price" name="price" defaultValue="0" />
              </div>

              <div className="space-y-1">
                <label htmlFor="categoryId" className="text-sm font-medium">Danh mục</label>
                <select
                  id="categoryId"
                  name="categoryId"
                  className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
                >
                  <option value="">Không chọn danh mục</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Ảnh đại diện</label>
                <MediaSelector value={thumbnailUrl} onChange={setThumbnailUrl} />
              </div>

              <div className="space-y-1">
                <label htmlFor="excerpt" className="text-sm font-medium">Mô tả ngắn</label>
                <textarea
                  id="excerpt"
                  name="excerpt"
                  className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="description" className="text-sm font-medium">Mô tả chi tiết</label>
                <textarea
                  id="description"
                  name="description"
                  className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>

            <div className="space-y-3">
              <AdminSubmitButton className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Đang tạo..." : "Tạo builder"}
              </AdminSubmitButton>
            </div>
          </>
        }
      />
    </NativeForm>
  );
}
