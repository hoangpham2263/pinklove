"use client";

import { type FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NativeForm } from "@/components/common/native-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MediaSelector } from "@/features/media/components/media-selector";
import { BuilderEditorClient } from "@/features/invitations/builder/editor-client";
import { BuilderWorkspaceShell } from "@/features/invitations/builder/builder-workspace-shell";
import { createDefaultBuilderDocument } from "@/features/invitations/builder/defaults";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import { ROUTES } from "@/lib/routes";
import { slugify } from "@/lib/utils";
import type { ProductCategory } from "@/features/products/types";

const BUILDER_TEMPLATE_KEY = "freeform_sections";

type ProductBuilderTemplateCreateFormProps = {
  categories: ProductCategory[];
  returnTo?: string;
};

export function ProductBuilderTemplateCreateForm({
  categories,
  returnTo = ROUTES.ADMIN.PRODUCT_LIST_BUILDER,
}: ProductBuilderTemplateCreateFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugEdited, setIsSlugEdited] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialBuilderDocument = useMemo(() => createDefaultBuilderDocument(), []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await adminApi.createProduct(new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã tạo mẫu builder.");
      finishMutation(router, result, { redirect: "push", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo mẫu builder.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <NativeForm
      action={adminApiActions.createProduct}
      method="POST"
      className="min-h-screen"
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="returnTo" value={returnTo} />
      <input type="hidden" name="productType" value="builder_template" />
      <input type="hidden" name="templateKey" value={BUILDER_TEMPLATE_KEY} />
      <input type="hidden" name="fulfillmentType" value="digital" />
      <input type="hidden" name="ownerType" value="internal" />
      <input type="hidden" name="ownerVendorUserId" value="" />
      <input type="hidden" name="thumbnailUrl" value={thumbnailUrl} />
      <input type="hidden" name="stockQuantity" value="0" />
      <input type="hidden" name="lowStockThreshold" value="0" />

      <BuilderWorkspaceShell
        variant="fullscreen"
        editor={<BuilderEditorClient initialValue={initialBuilderDocument} />}
        sidebar={
          <>
            <div className="flex min-w-0 items-center gap-3">
              <Button variant="outline" render={<Link href={returnTo}>Quay lại</Link>} />
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold">Tạo mẫu builder</h1>
                <p className="text-sm text-muted-foreground">Catalog builder template</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="name" className="text-sm font-medium">Tên mẫu</label>
                <Input
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => {
                    const next = e.target.value;
                    setName(next);
                    if (!isSlugEdited) {
                      setSlug(slugify(next));
                    }
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
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setIsSlugEdited(true);
                  }}
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
                  className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="price" className="text-sm font-medium">Giá</label>
                <Input id="price" name="price" type="number" min="0" step="1000" defaultValue="0" />
              </div>

              <div className="space-y-1">
                <label htmlFor="categoryId" className="text-sm font-medium">Product Cat</label>
                <select
                  id="categoryId"
                  name="categoryId"
                  className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Không chọn category</option>
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
                  className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="description" className="text-sm font-medium">Mô tả chi tiết</label>
                <textarea
                  id="description"
                  name="description"
                  className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Đang tạo..." : "Tạo mẫu builder"}
              </Button>
            </div>
          </>
        }
      />
    </NativeForm>
  );
}
