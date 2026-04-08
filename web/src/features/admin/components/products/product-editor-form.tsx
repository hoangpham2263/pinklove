"use client";

import { useMemo, useState } from "react";
import { NativeForm } from "@/components/common/native-form";
import { FieldsEditor } from "@/components/common/fields-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MediaSelector } from "@/features/media/components/media-selector";
import {
  getWeddingTemplateFields,
  getWeddingTemplateOptions,
} from "@/features/sites/templates/registry";
import type { Product, ProductType } from "@/features/products/types";
import { ROUTES } from "@/lib/routes";
import { slugify } from "@/lib/utils";

type ProductEditorFormProps = {
  product: Product;
};

export function ProductEditorForm({ product }: ProductEditorFormProps) {
  const [slug, setSlug] = useState(product.slug);
  const [name, setName] = useState(product.name);
  const [thumbnailUrl, setThumbnailUrl] = useState(product.thumbnailUrl || "");
  const [productType, setProductType] = useState<ProductType>(product.productType);
  const [templateKey, setTemplateKey] = useState(product.templateKey);
  const [siteDefaults, setSiteDefaults] = useState<Record<string, unknown>>(
    (product.config.siteDefaults as Record<string, unknown> | undefined) ?? {}
  );

  const templateOptions = useMemo(() => getWeddingTemplateOptions(productType), [productType]);
  const templateFields = getWeddingTemplateFields(templateKey);

  return (
    <>
    <NativeForm
      id="product-update-form"
      action={ROUTES.API.ADMIN.PRODUCTS.UPDATE}
      method="POST"
      className="grid gap-6 lg:grid-cols-12"
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
              <label className="font-medium">Loại sản phẩm</label>
              <select
                name="productType"
                value={productType}
                onChange={(e) => {
                  const nextType = e.target.value as ProductType;
                  setProductType(nextType);
                  const nextTemplate = getWeddingTemplateOptions(nextType)[0]?.value || "";
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
                values={{
                  ...siteDefaults,
                  gallery: Array.isArray(siteDefaults.gallery)
                    ? (siteDefaults.gallery as string[]).join("\n")
                    : siteDefaults.gallery,
                }}
                onChange={(fieldName, value) => {
                  setSiteDefaults((prev) => ({
                    ...prev,
                    [fieldName]: fieldName === "gallery"
                      ? String(value).split("\n").map((item) => item.trim()).filter(Boolean)
                      : value,
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

            <Button type="submit" className="w-full rounded-md">
              Lưu sản phẩm
            </Button>

            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Xóa product catalog entry này. Các `wedding_site` đã tạo trước đó vẫn giữ dữ liệu riêng.
              </p>
              <Button
                type="button"
                variant="destructive"
                className="mt-4 w-full rounded-md"
                form="product-delete-form"
              >
                Xóa sản phẩm
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

    <NativeForm id="product-delete-form" action={ROUTES.API.ADMIN.PRODUCTS.DELETE} method="POST" className="hidden">
      <input type="hidden" name="slug" value={product.slug} />
    </NativeForm>
    </>
  );
}
