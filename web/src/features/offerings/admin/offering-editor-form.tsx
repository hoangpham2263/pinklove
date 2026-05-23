"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NativeForm } from "@/components/common/native-form";
import { FieldsEditor } from "@/components/common/fields-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminDeleteButton, AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { DynamicOfferingFields } from "@/features/offerings/admin/dynamic-offering-fields";
import { MediaSelector } from "@/features/media/components/media-selector";
import { BuilderEditorClient } from "@/features/invitations/builder/editor-client";
import { BuilderWorkspaceShell } from "@/features/invitations/builder/builder-workspace-shell";
import { getInvitationTemplateFields } from "@/features/invitations/templates/registry";
import {
  OFFERING_STATUSES,
  SYSTEM_OFFERING_TYPES,
  SYSTEM_TEMPLATE_ENGINES,
  getOfferingStatusLabel,
  type Offering,
  type OfferingCategory,
  type OfferingFulfillmentType,
  type OfferingTypeDefinition,
} from "@/features/offerings/types";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import { ROUTES } from "@/lib/routes";
import { slugify } from "@/lib/utils";

type ProviderOption = {
  id: string;
  display_name?: string;
  displayName?: string;
  fullName?: string;
  username?: string;
};

type OfferingEditorFormProps = {
  offering: Offering;
  offeringTypeDefinition: OfferingTypeDefinition | null;
  categories: OfferingCategory[];
  providers: ProviderOption[];
  returnTo?: string;
};

export function OfferingEditorForm({
  offering,
  offeringTypeDefinition,
  categories,
  providers,
  returnTo = ROUTES.ADMIN.OFFERING_LIST,
}: OfferingEditorFormProps) {
  const router = useRouter();
  const [slug, setSlug] = useState(offering.slug);
  const [name, setName] = useState(offering.name);
  const [thumbnailUrl, setThumbnailUrl] = useState(offering.thumbnailUrl || "");
  const [fulfillmentType, setFulfillmentType] = useState<OfferingFulfillmentType>(offering.fulfillmentType);
  const [trackInventory, setTrackInventory] = useState(offering.trackInventory);
  const [stockQuantity, setStockQuantity] = useState(offering.stockQuantity);
  const [lowStockThreshold, setLowStockThreshold] = useState(offering.lowStockThreshold);
  const [allowBackorder, setAllowBackorder] = useState(offering.allowBackorder);
  const [costPrice, setCostPrice] = useState(offering.costPrice);
  const [providerSku, setProviderSku] = useState(offering.providerSku);
  const [ownerType, setOwnerType] = useState<"internal" | "provider">(offering.ownerType);
  const [ownerProviderId, setOwnerProviderId] = useState(offering.ownerProviderId || "");
  const [allowProviderSupply, setAllowProviderSupply] = useState(offering.allowProviderSupply);
  const [siteDefaults, setSiteDefaults] = useState<Record<string, unknown>>(
    (offering.config.siteDefaults as Record<string, unknown> | undefined) ?? {}
  );
  const [customFields, setCustomFields] = useState<Record<string, unknown>>(
    (offering.config.customFields as Record<string, unknown> | undefined) ?? {}
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isGeneralOffering = offering.offeringType === SYSTEM_OFFERING_TYPES.PHYSICAL_PRODUCT;
  const isBuilder = offering.offeringType === SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE && offering.templateEngine === SYSTEM_TEMPLATE_ENGINES.BUILDER;
  const isCodedTemplate = offering.offeringType === SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE && offering.templateEngine === SYSTEM_TEMPLATE_ENGINES.CODED;
  const canDeleteOffering = !isCodedTemplate;
  const templateFields = useMemo(
    () => (isGeneralOffering || isBuilder ? [] : getInvitationTemplateFields(offering.templateKey)),
    [isGeneralOffering, isBuilder, offering.templateKey]
  );
  const builderInitialValue = useMemo(
    () => (siteDefaults.builderDocument ?? siteDefaults.builderCanvas ?? null),
    [siteDefaults]
  );

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const result = await adminApi.updateOffering(new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã lưu sản phẩm.");
      finishMutation(router, result, { redirect: "replace", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu sản phẩm.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm: ${offering.name}?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const formData = new FormData();
      formData.append("slug", offering.slug);
      formData.append("returnTo", returnTo);
      const result = await adminApi.deleteOffering(formData);
      toast.success(result.message ?? "Đã xóa sản phẩm.");
      finishMutation(router, result, { redirect: "push", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa sản phẩm.");
    } finally {
      setIsDeleting(false);
    }
  }

  if (isBuilder) {
    return (
      <NativeForm
        id="offering-update-form"
        action={adminApiActions.updateOffering}
        method="POST"
        className="flex min-h-screen flex-col"
        onSubmit={handleSave}
      >
        <input type="hidden" name="originalSlug" value={offering.slug} />
        <input type="hidden" name="thumbnailUrl" value={thumbnailUrl} />
        <input type="hidden" name="siteDefaults" value={JSON.stringify(siteDefaults)} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <input type="hidden" name="offeringType" value={SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE} />
        <input type="hidden" name="templateEngine" value={SYSTEM_TEMPLATE_ENGINES.BUILDER} />
        <input type="hidden" name="templateKey" value={offering.templateKey} />
        <input type="hidden" name="fulfillmentType" value={offering.fulfillmentType} />

        <BuilderWorkspaceShell
          variant="fullscreen"
          editor={<BuilderEditorClient initialValue={builderInitialValue} />}
          sidebar={
            <>
              <div className="flex min-w-0 items-center gap-3">
                <div className="min-w-0">
                  <h1 className="truncate text-base font-semibold">{offering.name}</h1>
                  <p className="text-sm text-muted-foreground">Builder gốc trong admin</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Tên builder</label>
                  <Input
                    name="name"
                    value={name}
                    onChange={(e) => {
                      const next = e.target.value;
                      setName(next);
                      setSlug(slugify(next));
                    }}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Slug</label>
                  <Input name="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Trạng thái</label>
                  <select
                    name="status"
                    defaultValue={offering.status}
                    className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
                  >
                    {OFFERING_STATUSES.map((statusOption) => (
                      <option key={statusOption} value={statusOption}>{getOfferingStatusLabel(statusOption)}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Giá</label>
                  <Input name="price" type="number" min="0" step="1000" defaultValue={String(offering.price)} />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Danh mục</label>
                  <select
                    name="categoryId"
                    defaultValue={offering.categoryId ?? ""}
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
                  <label className="text-sm font-medium">Mô tả ngắn</label>
                  <textarea
                    name="excerpt"
                    defaultValue={offering.excerpt}
                    className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Mô tả chi tiết</label>
                  <textarea
                    name="description"
                    defaultValue={offering.description}
                    className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <AdminDeleteButton className="w-full rounded-md" disabled={isDeleting} onClick={() => void handleDelete()}>
                  {isDeleting ? "Đang xóa..." : "Xóa builder"}
                </AdminDeleteButton>

                <AdminSubmitButton className="w-full" disabled={isSaving}>
                  {isSaving ? "Đang lưu..." : "Lưu builder"}
                </AdminSubmitButton>
              </div>
            </>
          }
        />
      </NativeForm>
    );
  }

  return (
    <NativeForm
      id="offering-update-form"
      action={adminApiActions.updateOffering}
      method="POST"
      className="grid gap-6 lg:grid-cols-12"
      onSubmit={handleSave}
    >
      <input type="hidden" name="originalSlug" value={offering.slug} />
      <input type="hidden" name="thumbnailUrl" value={thumbnailUrl} />
      <input type="hidden" name="siteDefaults" value={JSON.stringify(siteDefaults)} />
      <input type="hidden" name="customFields" value={JSON.stringify(customFields)} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <input type="hidden" name="offeringType" value={offering.offeringType} />
      {offering.templateEngine ? <input type="hidden" name="templateEngine" value={offering.templateEngine} /> : null}
      <input type="hidden" name="templateKey" value={offering.templateKey} />

      <Card className="min-w-0 rounded-lg lg:col-span-9">
        <CardHeader>
          <CardTitle>{isGeneralOffering ? "Thông tin sản phẩm" : "Thông tin mẫu chuẩn"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="font-medium">{isGeneralOffering ? "Tên sản phẩm" : "Tên mẫu"}</label>
              <Input
                name="name"
                value={name}
                onChange={(e) => {
                  const next = e.target.value;
                  setName(next);
                  setSlug(slugify(next));
                }}
              />
            </div>

            {offeringTypeDefinition ? (
              <DynamicOfferingFields
                offeringType={offeringTypeDefinition}
                values={customFields}
                onChange={setCustomFields}
              />
            ) : null}
            <div className="space-y-2">
              <label className="font-medium">Slug</label>
              <Input name="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="font-medium">Danh mục</label>
              <select
                name="categoryId"
                defaultValue={offering.categoryId ?? ""}
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

            {!isGeneralOffering ? (
              <div className="space-y-2">
                <label className="font-medium">Template source</label>
                <div className="flex h-10 items-center rounded-md border bg-muted/40 px-3 text-sm">
                  {offering.templateKey}
                </div>
                <p className="text-sm text-muted-foreground">
                  Source của mẫu chuẩn đã bị khóa. Chỉ chỉnh nội dung, dữ liệu mặc định và trạng thái hiển thị.
                </p>
              </div>
            ) : null}

            {isGeneralOffering ? (
              <>
                <div className="space-y-2 md:col-span-2">
                  <label className="font-medium">Provider supplier requests</label>
                  <label className="flex items-start gap-3 rounded-md border bg-card p-3">
                    <input
                      type="checkbox"
                      name="allowProviderSupply"
                      checked={allowProviderSupply}
                      onChange={(e) => setAllowProviderSupply(e.target.checked)}
                      className="mt-1 rounded border-input"
                    />
                    <span className="space-y-1">
                      <span className="block font-medium">Cho phép provider xin cung cấp sản phẩm này</span>
                      <span className="block text-sm text-muted-foreground">
                        Chỉ bật cho mẫu/sản phẩm đã sẵn sàng review supplier. Provider sẽ thấy mục này trong portal.
                      </span>
                    </span>
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="font-medium">Nguồn hàng / chủ sở hữu</label>
                  <select
                    name="ownerType"
                    value={ownerType}
                    onChange={(e) => setOwnerType(e.target.value === "provider" ? "provider" : "internal")}
                    className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
                  >
                    <option value="internal">Sản phẩm của tôi / nội bộ</option>
                    <option value="provider">Sản phẩm của provider</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-medium">Provider</label>
                  <select
                    name="ownerProviderId"
                    value={ownerProviderId}
                    onChange={(e) => setOwnerProviderId(e.target.value)}
                    disabled={ownerType !== "provider"}
                    className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none disabled:opacity-60"
                  >
                    <option value="">Chọn provider</option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.displayName || provider.display_name || provider.fullName || provider.username}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : null}

            <div className="space-y-2">
              <label className="font-medium">Hình thức bàn giao</label>
              {isGeneralOffering ? (
                <select
                  name="fulfillmentType"
                  value={fulfillmentType}
                  onChange={(e) => setFulfillmentType(e.target.value as OfferingFulfillmentType)}
                  className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
                >
                  <option value="digital">Digital</option>
                  <option value="physical">Cần vận chuyển</option>
                  <option value="service">Dịch vụ</option>
                </select>
              ) : (
                <>
                  <input type="hidden" name="fulfillmentType" value={offering.fulfillmentType} />
                  <div className="flex h-10 items-center rounded-md border bg-muted/40 px-3 text-sm">
                    {offering.fulfillmentType}
                  </div>
                </>
              )}
            </div>

            {isGeneralOffering ? (
              <>
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

                <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="font-medium">Giá nhập</label>
                    <Input
                      name="costPrice"
                      type="number"
                      min="0"
                      step="1000"
                      value={costPrice}
                      onChange={(e) => setCostPrice(Math.max(0, Number(e.target.value || "0")))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-medium">Provider SKU</label>
                    <Input
                      name="providerSku"
                      value={providerSku}
                      onChange={(e) => setProviderSku(e.target.value)}
                      placeholder="Mã nội bộ phía provider"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <input type="hidden" name="stockQuantity" value="0" />
                <input type="hidden" name="lowStockThreshold" value="0" />
                <input type="hidden" name="costPrice" value="0" />
                <input type="hidden" name="providerSku" value="" />
              </>
            )}
          </div>

          <div className="space-y-2">
            <label className="font-medium">Mô tả ngắn</label>
            <textarea
              name="excerpt"
              defaultValue={offering.excerpt}
              className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="font-medium">Mô tả chi tiết</label>
            <textarea
              name="description"
              defaultValue={offering.description}
              className="min-h-40 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
            />
          </div>

          {templateFields.length > 0 ? (
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
          ) : null}
        </CardContent>
      </Card>

      <div className="min-w-0 space-y-6 lg:col-span-3">
        <Card className="min-w-0 rounded-lg lg:self-start">
          <CardHeader>
            <CardTitle>{isGeneralOffering ? "Sản phẩm bán ra" : "Mẫu chuẩn"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="font-medium">Trạng thái</label>
              <select
                name="status"
                defaultValue={offering.status}
                className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
              >
                {OFFERING_STATUSES.map((statusOption) => (
                  <option key={statusOption} value={statusOption}>{getOfferingStatusLabel(statusOption)}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="font-medium">Giá</label>
              <Input name="price" type="number" min="0" step="1000" defaultValue={String(offering.price)} />
            </div>

            <AdminSubmitButton className="w-full rounded-md" disabled={isSaving}>
              {isSaving ? "Đang lưu..." : "Lưu sản phẩm"}
            </AdminSubmitButton>

            {canDeleteOffering ? (
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  Xóa offering catalog entry này. Các `wedding_site` đã tạo trước đó vẫn giữ dữ liệu riêng.
                </p>
                <AdminDeleteButton className="mt-4 w-full rounded-md" disabled={isDeleting} onClick={() => void handleDelete()}>
                  {isDeleting ? "Đang xóa..." : "Xóa sản phẩm"}
                </AdminDeleteButton>
              </div>
            ) : null}
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
  );
}
