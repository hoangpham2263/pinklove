"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NativeForm } from "@/components/common/native-form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { DynamicOfferingFields } from "@/features/offerings/admin/dynamic-offering-fields";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import { ROUTES } from "@/lib/routes";
import { slugify } from "@/lib/utils";
import {
  OFFERING_STATUSES,
  SYSTEM_OFFERING_TYPES,
  getOfferingStatusLabel,
  type OfferingCategory,
  type OfferingFulfillmentType,
  type OfferingStatus,
  type OfferingTypeDefinition,
} from "@/features/offerings/types";
import type { AccountUser } from "@/lib/auth";

export function QuickCreateOfferingForm({
  categories = [],
  vendors = [],
  offeringTypes = [],
  initialOfferingType = SYSTEM_OFFERING_TYPES.PHYSICAL_PRODUCT,
  returnTo = ROUTES.ADMIN.OFFERING_LIST,
}: {
  categories?: OfferingCategory[];
  vendors?: AccountUser[];
  offeringTypes?: OfferingTypeDefinition[];
  initialOfferingType?: string;
  returnTo?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<OfferingStatus>("draft");
  const [offeringType, setOfferingType] = useState(initialOfferingType);
  const activeOfferingType = useMemo(
    () => offeringTypes.find((type) => type.key === offeringType) ?? offeringTypes.find((type) => type.key === SYSTEM_OFFERING_TYPES.PHYSICAL_PRODUCT),
    [offeringType, offeringTypes]
  );
  const [fulfillmentType, setFulfillmentType] = useState<OfferingFulfillmentType>(activeOfferingType?.fulfillmentType ?? "digital");
  const supportsInventory = activeOfferingType?.supportsInventory ?? offeringType === SYSTEM_OFFERING_TYPES.PHYSICAL_PRODUCT;
  const supportsVendorSupply = activeOfferingType?.supportsVendorSupply ?? offeringType === SYSTEM_OFFERING_TYPES.PHYSICAL_PRODUCT;
  const [customFields, setCustomFields] = useState<Record<string, unknown>>({});
  const [trackInventory, setTrackInventory] = useState(false);
  const [stockQuantity, setStockQuantity] = useState(0);
  const [lowStockThreshold, setLowStockThreshold] = useState(0);
  const [allowBackorder, setAllowBackorder] = useState(false);
  const [costPrice, setCostPrice] = useState(0);
  const [vendorSku, setVendorSku] = useState("");
  const [ownerType, setOwnerType] = useState<"internal" | "vendor">("internal");
  const [ownerVendorUserId, setOwnerVendorUserId] = useState("");
  const [allowVendorSupply, setAllowVendorSupply] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await adminApi.createOffering(new FormData(event.currentTarget));
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
      action={adminApiActions.createOffering}
      method="POST"
      className="grid grid-cols-1 gap-6 lg:grid-cols-12"
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="returnTo" value={returnTo} />
      <input type="hidden" name="templateKey" value={activeOfferingType?.templateKey || offeringType} />
      <input type="hidden" name="customFields" value={JSON.stringify(customFields)} />

      <Card className="min-w-0 rounded-lg lg:col-span-9">
        <CardHeader>
          <CardTitle>Thông tin sản phẩm</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="offeringType" className="font-medium">
                Loại
              </label>
              <select
                id="offeringType"
                name="offeringType"
                value={offeringType}
                onChange={(e) => {
                  const nextType = e.target.value;
                  const definition = offeringTypes.find((type) => type.key === nextType);
                  setOfferingType(nextType);
                  setFulfillmentType(definition?.fulfillmentType ?? "digital");
                  setCustomFields({});
                }}
                className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
              >
                {offeringTypes
                  .filter((type) => type.status === "active")
                  .map((type) => (
                    <option key={type.key} value={type.key}>
                      {type.label}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="name" className="font-medium">
                Tên sản phẩm
              </label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => {
                  const next = e.target.value;
                  setName(next);
                  setSlug(slugify(next));
                }}
                placeholder="Ví dụ: Hộp quà cưới Aurora"
                required
              />
            </div>

            {activeOfferingType ? (
              <DynamicOfferingFields
                offeringType={activeOfferingType}
                values={customFields}
                onChange={setCustomFields}
              />
            ) : null}

            <div className="space-y-2">
              <label htmlFor="slug" className="font-medium">
                Slug
              </label>
              <Input
                id="slug"
                name="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="hop-qua-cuoi-aurora"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="categoryId" className="font-medium">
                Danh mục
              </label>
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

            <div className="space-y-2">
              <label htmlFor="ownerType" className="font-medium">
                Nguồn hàng / chủ sở hữu
              </label>
              <select
                id="ownerType"
                name="ownerType"
                value={ownerType}
                onChange={(e) => setOwnerType(e.target.value === "vendor" ? "vendor" : "internal")}
                className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
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
                  disabled={ownerType !== "vendor" || !supportsVendorSupply}
                className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none disabled:opacity-60"
              >
                <option value="">Chọn đối tác</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.displayName || vendor.fullName || vendor.username}
                  </option>
                ))}
              </select>
              <p className="text-sm text-muted-foreground">
                Nhóm này không dùng template invitation source. Chỉ chọn đối tác khi nguồn hàng thuộc bên cung ứng.
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="font-medium">Vendor supplier requests</label>
              <label className="flex items-start gap-3 rounded-md border bg-card p-3">
                <input
                  type="checkbox"
                  name="allowVendorSupply"
                  checked={allowVendorSupply}
                  disabled={!supportsVendorSupply}
                  onChange={(e) => setAllowVendorSupply(e.target.checked)}
                  className="mt-1 rounded border-input"
                />
                <span className="space-y-1">
                  <span className="block font-medium">Cho phép vendor xin cung cấp sản phẩm này</span>
                  <span className="block text-sm text-muted-foreground">
                    Bật khi bạn muốn vendor thấy mẫu này trong portal và gửi hồ sơ xin cung cấp.
                  </span>
                </span>
              </label>
            </div>

            <div className="space-y-2">
              <label htmlFor="fulfillmentType" className="font-medium">
                Hình thức bàn giao
              </label>
              <select
                id="fulfillmentType"
                name="fulfillmentType"
                value={fulfillmentType}
                onChange={(e) => setFulfillmentType(e.target.value as OfferingFulfillmentType)}
                className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
              >
                <option value="digital">Digital</option>
                <option value="physical">Cần vận chuyển</option>
                <option value="service">Dịch vụ</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
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

            <div className="grid gap-4 md:col-span-2 md:grid-cols-3">
              <div className="space-y-2">
                <label htmlFor="stockQuantity" className="font-medium">Tồn kho hiện tại</label>
                <Input
                  id="stockQuantity"
                  name="stockQuantity"
                  type="number"
                  min="0"
                  value={stockQuantity}
                  disabled={!supportsInventory || !trackInventory}
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
                  disabled={!supportsInventory || !trackInventory}
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
                    disabled={!supportsInventory || !trackInventory}
                    onChange={(e) => setAllowBackorder(e.target.checked)}
                    className="mt-1 rounded border-input"
                  />
                  <span className="block text-sm text-muted-foreground">Cho phép tạo đơn dù tồn kho không đủ.</span>
                </label>
              </div>
            </div>

            <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="costPrice" className="font-medium">Giá nhập</label>
                <Input
                  id="costPrice"
                  name="costPrice"
                  type="number"
                  min="0"
                  step="1000"
                  value={costPrice}
                  onChange={(e) => setCostPrice(Math.max(0, Number(e.target.value || "0")))}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="vendorSku" className="font-medium">Vendor SKU</label>
                <Input
                  id="vendorSku"
                  name="vendorSku"
                  value={vendorSku}
                  onChange={(e) => setVendorSku(e.target.value)}
                  placeholder="Mã nội bộ phía vendor"
                />
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
                onChange={(e) => setStatus(e.target.value as OfferingStatus)}
                className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
              >
                {OFFERING_STATUSES.map((statusOption) => (
                  <option key={statusOption} value={statusOption}>{getOfferingStatusLabel(statusOption)}</option>
                ))}
              </select>
            </div>
            <p className="text-sm text-muted-foreground">
              Chọn trạng thái tạo mới để tiếp tục hoàn thiện hoặc publish ngay từ đầu.
            </p>
            <AdminSubmitButton
              className="h-10 w-full rounded-md"
              disabled={isSubmitting || (ownerType === "vendor" && !ownerVendorUserId)}
            >
              {isSubmitting ? "Đang tạo..." : "Tạo sản phẩm"}
            </AdminSubmitButton>
          </CardContent>
        </Card>
      </div>
    </NativeForm>
  );
}
