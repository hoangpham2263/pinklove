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
import type { AccountUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { slugify } from "@/lib/utils";

type ProductEditorFormProps = {
  product: Product;
  categories: ProductCategory[];
  usedTemplateKeys: string[];
  vendors: AccountUser[];
  returnTo?: string;
};

export function ProductEditorForm({ product, categories, usedTemplateKeys, vendors, returnTo = ROUTES.ADMIN.PRODUCT_LIST }: ProductEditorFormProps) {
  const router = useRouter();
  const [slug, setSlug] = useState(product.slug);
  const [name, setName] = useState(product.name);
  const [thumbnailUrl, setThumbnailUrl] = useState(product.thumbnailUrl || "");
  const [productType, setProductType] = useState<ProductType>(product.productType);
  const [fulfillmentType, setFulfillmentType] = useState<ProductFulfillmentType>(product.fulfillmentType);
  const [templateKey, setTemplateKey] = useState(product.templateKey);
  const [trackInventory, setTrackInventory] = useState(product.trackInventory);
  const [stockQuantity, setStockQuantity] = useState(product.stockQuantity);
  const [lowStockThreshold, setLowStockThreshold] = useState(product.lowStockThreshold);
  const [allowBackorder, setAllowBackorder] = useState(product.allowBackorder);
  const [ownerType, setOwnerType] = useState<"internal" | "vendor">(product.ownerType);
  const [ownerVendorUserId, setOwnerVendorUserId] = useState(product.ownerVendorUserId || "");
  const [siteDefaults, setSiteDefaults] = useState<Record<string, unknown>>(
    (product.config.siteDefaults as Record<string, unknown> | undefined) ?? {}
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const templateOptions = useMemo(
    () =>
      productType === "general_product"
        ? []
        : getInvitationTemplateOptions(productType).filter(
            (template) => template.value === templateKey || !usedTemplateKeys.includes(template.value)
          ),
    [productType, templateKey, usedTemplateKeys]
  );
  const templateFields = productType === "general_product" ? [] : getInvitationTemplateFields(templateKey);

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
      formData.append("returnTo", returnTo);
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
      <input type="hidden" name="returnTo" value={returnTo} />

      <Card className="min-w-0 rounded-lg lg:col-span-9">
        <CardHeader>
          <CardTitle>Thông tin mẫu gốc</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="font-medium">Tên mẫu / tên sản phẩm</label>
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
                  if (nextType === "general_product") {
                    setTemplateKey("general_product");
                    setSiteDefaults({});
                    setOwnerType("internal");
                    setOwnerVendorUserId("");
                  } else {
                    const nextTemplate = getInvitationTemplateOptions(nextType).find(
                      (template) => !usedTemplateKeys.includes(template.value)
                    )?.value || "";
                    setTemplateKey(nextTemplate);
                    setSiteDefaults({});
                  }
                }}
                className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="coded_template">Coded Template</option>
                <option value="builder_template">Builder Template</option>
                <option value="general_product">Sản phẩm</option>
              </select>
            </div>
            {productType === "general_product" ? (
              <>
                <input type="hidden" name="templateKey" value="general_product" />
                <div className="space-y-2">
                  <label className="font-medium">Nguồn hàng / chủ sở hữu</label>
                  <select
                    name="ownerType"
                    value={ownerType}
                    onChange={(e) => setOwnerType(e.target.value === "vendor" ? "vendor" : "internal")}
                    className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="internal">Sản phẩm của tôi / nội bộ</option>
                    <option value="vendor">Sản phẩm của đối tác</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-medium">Đối tác</label>
                  <select
                    name="ownerVendorUserId"
                    value={ownerVendorUserId}
                    onChange={(e) => setOwnerVendorUserId(e.target.value)}
                    disabled={ownerType !== "vendor"}
                    className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-60"
                  >
                    <option value="">Chọn đối tác</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.displayName || vendor.fullName || vendor.username}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-muted-foreground">
                    Nhóm sản phẩm này không sinh invitation site và chạy như sản phẩm bán ra bình thường.
                  </p>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <label className="font-medium">Template source</label>
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
                <p className="text-sm text-muted-foreground">
                  Mỗi template chỉ được gắn với một sản phẩm gốc duy nhất.
                </p>
              </div>
            )}
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
            <div className="space-y-2 md:col-span-2">
              <label className="font-medium">Quản lý kho</label>
              <label className="flex items-start gap-3 rounded-md border bg-card p-4">
                <input
                  type="checkbox"
                  name="trackInventory"
                  checked={trackInventory}
                  onChange={(e) => setTrackInventory(e.target.checked)}
                  className="mt-1 rounded border-input"
                />
                <span className="space-y-1">
                  <span className="block font-medium">Theo dõi tồn kho và trừ kho khi phát sinh đơn</span>
                  <span className="block text-sm text-muted-foreground">Nếu tắt, sản phẩm được xem là không giới hạn tồn kho trong checkout.</span>
                </span>
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-3 md:col-span-2">
              <div className="space-y-2">
                <label className="font-medium">Tồn kho hiện tại</label>
                <Input
                  name="stockQuantity"
                  type="number"
                  min={allowBackorder ? undefined : 0}
                  value={stockQuantity}
                  disabled={!trackInventory}
                  onChange={(e) => setStockQuantity(Number(e.target.value || "0"))}
                />
              </div>
              <div className="space-y-2">
                <label className="font-medium">Ngưỡng cảnh báo thấp</label>
                <Input
                  name="lowStockThreshold"
                  type="number"
                  min="0"
                  value={lowStockThreshold}
                  disabled={!trackInventory}
                  onChange={(e) => setLowStockThreshold(Math.max(0, Number(e.target.value || "0")))}
                />
              </div>
              <div className="space-y-2">
                <label className="font-medium">Cho phép backorder</label>
                <label className="flex items-start gap-3 rounded-md border bg-card p-3">
                  <input
                    type="checkbox"
                    name="allowBackorder"
                    checked={allowBackorder}
                    disabled={!trackInventory}
                    onChange={(e) => setAllowBackorder(e.target.checked)}
                    className="mt-1 rounded border-input"
                  />
                  <span className="block text-sm text-muted-foreground">Cho phép đơn đi tiếp kể cả khi tồn kho không đủ.</span>
                </label>
              </div>
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
              <h3 className="font-semibold">
                Dữ liệu mặc định khi tạo site
              </h3>
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
            <CardTitle>Sản phẩm bán ra</CardTitle>
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
