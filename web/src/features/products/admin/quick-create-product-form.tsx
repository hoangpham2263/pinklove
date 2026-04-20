"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NativeForm } from "@/components/common/native-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getInvitationTemplateOptions } from "@/features/invitations/templates/registry";
import { finishMutation, postForm } from "@/lib/client-mutation";
import { ROUTES } from "@/lib/routes";
import { slugify } from "@/lib/utils";
import type { ProductCategory, ProductFulfillmentType, ProductType } from "@/features/products/types";
import type { AccountUser } from "@/lib/auth";

export function QuickCreateProductForm({
  categories = [],
  usedTemplateKeys = [],
  vendors = [],
  defaultProductType = "coded_template",
  returnTo = ROUTES.ADMIN.PRODUCT_LIST_CODED,
}: {
  categories?: ProductCategory[];
  usedTemplateKeys?: string[];
  vendors?: AccountUser[];
  defaultProductType?: ProductType;
  returnTo?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugEdited, setIsSlugEdited] = useState(false);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [productType, setProductType] = useState<ProductType>(defaultProductType);
  const [templateKey, setTemplateKey] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState<ProductFulfillmentType>("digital");
  const [trackInventory, setTrackInventory] = useState(false);
  const [stockQuantity, setStockQuantity] = useState(0);
  const [lowStockThreshold, setLowStockThreshold] = useState(0);
  const [allowBackorder, setAllowBackorder] = useState(false);
  const [ownerType, setOwnerType] = useState<"internal" | "vendor">("internal");
  const [ownerVendorUserId, setOwnerVendorUserId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const templateOptions = useMemo(
    () =>
      productType === "general_product"
        ? []
        : getInvitationTemplateOptions(productType).filter((template) => !usedTemplateKeys.includes(template.value)),
    [productType, usedTemplateKeys]
  );

  useEffect(() => {
    if (productType === "general_product") {
      setTemplateKey("general_product");
      return;
    }

    if (!templateOptions.some((template) => template.value === templateKey)) {
      setTemplateKey(templateOptions[0]?.value ?? "");
    }
  }, [productType, templateKey, templateOptions]);

  useEffect(() => {
    if (productType === "general_product") {
      setTemplateKey("general_product");
    }
  }, [productType]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await postForm(ROUTES.API.ADMIN.PRODUCTS.CREATE, new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã tạo sản phẩm mới.");
      finishMutation(router, result, { redirect: "push", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo sản phẩm.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <NativeForm
      action={ROUTES.API.ADMIN.PRODUCTS.CREATE}
      method="POST"
      className="grid grid-cols-1 gap-6 lg:grid-cols-12"
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="returnTo" value={returnTo} />
      <Card className="min-w-0 rounded-lg lg:col-span-9">
        <CardHeader>
          <CardTitle>Thông tin mẫu gốc</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="name" className="font-medium">
                Tên mẫu / tên sản phẩm
              </label>
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
                placeholder="Ví dụ: Mẫu thiệp cưới Aurora Veil"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="slug" className="font-medium">
                Slug
              </label>
              <Input
                id="slug"
                name="slug"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setIsSlugEdited(true);
                }}
                placeholder="mau-thiep-cuoi-aurora-veil"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="categoryId" className="font-medium">
                Product Cat
              </label>
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

            <div className="space-y-2">
              <label htmlFor="productType" className="font-medium">
                Loại sản phẩm
              </label>
              <select
                id="productType"
                name="productType"
                value={productType}
                onChange={(e) => {
                  const nextType = e.target.value as ProductType;
                  setProductType(nextType);
                  if (nextType === "general_product") {
                    setOwnerType("internal");
                    setOwnerVendorUserId("");
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
                  <label htmlFor="ownerType" className="font-medium">
                    Nguồn hàng / chủ sở hữu
                  </label>
                  <select
                    id="ownerType"
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
                  <label htmlFor="ownerVendorUserId" className="font-medium">
                    Đối tác
                  </label>
                  <select
                    id="ownerVendorUserId"
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
                    Nhóm sản phẩm này không dùng invitation template source. Chỉ chọn đối tác khi nguồn hàng thuộc bên cung ứng.
                  </p>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <label htmlFor="templateKey" className="font-medium">
                  Template source
                </label>
                <select
                  id="templateKey"
                  name="templateKey"
                  value={templateKey}
                  className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  disabled={templateOptions.length === 0}
                  onChange={(e) => setTemplateKey(e.target.value)}
                >
                  {templateOptions.map((template) => (
                    <option key={template.value} value={template.value}>
                      {template.label}
                    </option>
                  ))}
                </select>
                {templateOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nhóm này đã dùng hết template có sẵn. Hãy thêm template mới trong code trước khi tạo tiếp.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Chọn đúng source gốc. Sau khi tạo, source này sẽ không còn xuất hiện ở form tạo mới nữa.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="fulfillmentType" className="font-medium">
                Hình thức bàn giao
              </label>
              <select
                id="fulfillmentType"
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

            <div className="space-y-2">
              <label className="font-medium">Theo dõi tồn kho</label>
              <label className="flex items-start gap-3 rounded-md border bg-card p-3">
                <input
                  type="checkbox"
                  name="trackInventory"
                  checked={trackInventory}
                  onChange={(e) => setTrackInventory(e.target.checked)}
                  className="mt-1 rounded border-input"
                />
                <span className="space-y-1">
                  <span className="block font-medium">Bật quản lý kho cho sản phẩm này</span>
                  <span className="block text-sm text-muted-foreground">Khi bật, checkout sẽ kiểm tra số lượng tồn và trừ kho sau khi tạo đơn.</span>
                </span>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-3 md:col-span-2">
              <div className="space-y-2">
                <label htmlFor="stockQuantity" className="font-medium">Tồn kho hiện tại</label>
                <Input
                  id="stockQuantity"
                  name="stockQuantity"
                  type="number"
                  min="0"
                  value={stockQuantity}
                  disabled={!trackInventory}
                  onChange={(e) => setStockQuantity(Math.max(0, Number(e.target.value || "0")))}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="lowStockThreshold" className="font-medium">Ngưỡng cảnh báo thấp</label>
                <Input
                  id="lowStockThreshold"
                  name="lowStockThreshold"
                  type="number"
                  min="0"
                  value={lowStockThreshold}
                  disabled={!trackInventory}
                  onChange={(e) => setLowStockThreshold(Math.max(0, Number(e.target.value || "0")))}
                />
              </div>
              <div className="space-y-2">
                <label className="font-medium">Cho phép âm kho / backorder</label>
                <label className="flex items-start gap-3 rounded-md border bg-card p-3">
                  <input
                    type="checkbox"
                    name="allowBackorder"
                    checked={allowBackorder}
                    disabled={!trackInventory}
                    onChange={(e) => setAllowBackorder(e.target.checked)}
                    className="mt-1 rounded border-input"
                  />
                  <span className="block text-sm text-muted-foreground">Cho phép tạo đơn dù tồn kho không đủ.</span>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="min-w-0 space-y-6 lg:col-span-3">
        <Card className="min-w-0 rounded-lg lg:self-start">
          <CardHeader>
            <CardTitle>Sản phẩm bán ra</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="status" className="font-medium">
                Trạng thái
              </label>
              <select
                id="status"
                name="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as "draft" | "published")}
                className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="draft">draft</option>
                <option value="published">published</option>
              </select>
            </div>
            <p className="text-sm text-muted-foreground">
              Chọn trạng thái tạo mới để tiếp tục hoàn thiện hoặc publish ngay từ đầu.
            </p>
            <Button
              type="submit"
              className="h-10 w-full rounded-md"
              disabled={isSubmitting || (productType !== "general_product" && !templateKey) || (productType === "general_product" && ownerType === "vendor" && !ownerVendorUserId)}
            >
              {isSubmitting ? "Đang tạo..." : "Tạo mẫu gốc"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </NativeForm>
  );
}
