"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NativeForm } from "@/components/common/native-form";
import { FieldsEditor } from "@/components/common/fields-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MediaSelector } from "@/features/media/components/media-selector";
import {
  getInvitationTemplateFields,
  getInvitationTemplateOptions,
} from "@/features/invitations/templates/registry";
import type { Product, ProductCategory, ProductFulfillmentType, ProductType } from "@/features/products/types";
import { finishMutation, postForm } from "@/lib/client-mutation";
import { ROUTES } from "@/lib/routes";
import { slugify } from "@/lib/utils";

type ProductEditorFormProps = {
  product: Product;
  categories: ProductCategory[];
};

export function ProductEditorForm({ product, categories }: ProductEditorFormProps) {
  const router = useRouter();
  const [slug, setSlug] = useState(product.slug);
  const [name, setName] = useState(product.name);
  const [thumbnailUrl, setThumbnailUrl] = useState(product.thumbnailUrl || "");
  const [productType, setProductType] = useState<ProductType>(product.productType);
  const [fulfillmentType, setFulfillmentType] = useState<ProductFulfillmentType>(product.fulfillmentType);
  const [templateKey, setTemplateKey] = useState(product.templateKey);
  const [siteDefaults, setSiteDefaults] = useState<Record<string, unknown>>(
    (product.config.siteDefaults as Record<string, unknown> | undefined) ?? {}
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const templateOptions = useMemo(() => getInvitationTemplateOptions(productType), [productType]);
  const templateFields = getInvitationTemplateFields(templateKey);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const result = await postForm(ROUTES.API.ADMIN.PRODUCTS.UPDATE, new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã lưu sản phẩm.");
      finishMutation(router, result, { redirect: "replace", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu sản phẩm.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm: ${product.name}?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const formData = new FormData();
      formData.append("slug", product.slug);
      const result = await postForm(ROUTES.API.ADMIN.PRODUCTS.DELETE, formData);
      toast.success(result.message ?? "Đã xóa sản phẩm.");
      finishMutation(router, result, { redirect: "push", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa sản phẩm.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
    <NativeForm
      id="product-update-form"
      action={ROUTES.API.ADMIN.PRODUCTS.UPDATE}
      method="POST"
      className="grid gap-6 lg:grid-cols-12"
      onSubmit={handleSave}
    >
      <input type="hidden" name="originalSlug" value={product.slug} />
      <input type="hidden" name="thumbnailUrl" value={thumbnailUrl} />
      <input type="hidden" name="siteDefaults" value={JSON.stringify(siteDefaults)} />

      <Card className="min-w-0 rounded-lg lg:col-span-9">
        <CardHeader>
          <CardTitle>Thông tin sản phẩm</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="font-medium">Tên sản phẩm</label>
              <Input
                name="name"
                value={name}
                onChange={(e) => {
                  const next = e.target.value;
                  setName(next);
                  if (slug === product.slug || slug === slugify(product.name)) {
                    setSlug(slugify(next));
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="font-medium">Slug</label>
              <Input name="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="font-medium">Product Cat</label>
              <select
                name="categoryId"
                defaultValue={product.categoryId ?? ""}
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
            <div className="space-y-2">
              <label className="font-medium">Loại sản phẩm</label>
              <select
                name="productType"
                value={productType}
                onChange={(e) => {
                  const nextType = e.target.value as ProductType;
                  setProductType(nextType);
                  const nextTemplate = getInvitationTemplateOptions(nextType)[0]?.value || "";
                  setTemplateKey(nextTemplate);
                  setSiteDefaults({});
                }}
                className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="coded_template">Coded Template</option>
                <option value="builder_template">Builder Template</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="font-medium">Template</label>
              <select
                name="templateKey"
                value={templateKey}
                onChange={(e) => setTemplateKey(e.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {templateOptions.map((template) => (
                  <option key={template.value} value={template.value}>
                    {template.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="font-medium">Hình thức bàn giao</label>
              <select
                name="fulfillmentType"
                value={fulfillmentType}
                onChange={(e) => setFulfillmentType(e.target.value as ProductFulfillmentType)}
                className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="digital">Digital</option>
                <option value="physical">Cần vận chuyển</option>
                <option value="service">Dịch vụ</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-medium">Mô tả ngắn</label>
            <textarea
              name="excerpt"
              defaultValue={product.excerpt}
              className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label className="font-medium">Mô tả chi tiết</label>
            <textarea
              name="description"
              defaultValue={product.description}
              className="min-h-40 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {templateFields.length > 0 && (
            <div className="space-y-3 border-t pt-4">
              <h3 className="font-semibold">Dữ liệu mặc định khi tạo site</h3>
              <FieldsEditor
                fields={templateFields}
                values={siteDefaults}
                onChange={(fieldName, value) => {
                  setSiteDefaults((prev) => ({
                    ...prev,
                    [fieldName]: value,
                  }));
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="min-w-0 space-y-6 lg:col-span-3">
        <Card className="min-w-0 rounded-lg lg:self-start">
          <CardHeader>
            <CardTitle>Xuất bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="font-medium">Trạng thái</label>
              <select
                name="status"
                defaultValue={product.status}
                className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="draft">draft</option>
                <option value="published">published</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="font-medium">Giá</label>
              <Input name="price" type="number" min="0" step="1000" defaultValue={String(product.price)} />
            </div>

            <Button type="submit" className="w-full rounded-md" disabled={isSaving}>
              {isSaving ? "Đang lưu..." : "Lưu sản phẩm"}
            </Button>

            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Xóa product catalog entry này. Các `wedding_site` đã tạo trước đó vẫn giữ dữ liệu riêng.
              </p>
              <Button
                type="button"
                variant="destructive"
                className="mt-4 w-full rounded-md"
                disabled={isDeleting}
                onClick={() => void handleDelete()}
              >
                {isDeleting ? "Đang xóa..." : "Xóa sản phẩm"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Ảnh đại diện</CardTitle>
          </CardHeader>
          <CardContent>
            <MediaSelector value={thumbnailUrl} onChange={setThumbnailUrl} />
          </CardContent>
        </Card>
      </div>
    </NativeForm>
    </>
  );
}
