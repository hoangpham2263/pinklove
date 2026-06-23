"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CurrencyInput } from "@/components/common/currency-input";
import { NativeForm } from "@/components/common/native-form";
import { FieldsEditor } from "@/components/common/fields-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminActionTileButton, AdminDeleteButton, AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { AdminCheckbox, AdminField, AdminInput, AdminReadonlyField, AdminSelect, AdminTextarea } from "@/features/admin/components/admin-form";
import { AdminTableActionButton, AdminTableActions } from "@/features/admin/components/admin-table-actions";
import { DynamicOfferingFields } from "@/features/offerings/admin/dynamic-offering-fields";
import { OfferingSearchSelect } from "@/features/offerings/admin/offering-search-select";
import { MediaSelector } from "@/features/media/components/media-selector";
import { BuilderEditorClient } from "@/features/invitations/builder/editor-client";
import { BuilderWorkspaceShell } from "@/features/invitations/builder/builder-workspace-shell";
import { getInvitationTemplateFields } from "@/features/invitations/templates/registry";
import type { LandingPage } from "@/features/landing-pages/types";
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
import { getLandingPagePath } from "@/lib/public-paths";
import { ROUTES } from "@/lib/routes";
import { slugify } from "@/lib/utils";
import { useConfirm } from "@/components/common/confirm-provider";

type ProviderOption = {
  id: string;
  display_name?: string;
  displayName?: string;
  fullName?: string;
  accountName?: string;
};

type OfferingEditorFormProps = {
  offering: Offering;
  offeringTypeDefinition: OfferingTypeDefinition | null;
  categories: OfferingCategory[];
  providers: ProviderOption[];
  allOfferings?: Offering[];
  landingPages?: LandingPage[];
  returnTo?: string;
};

type ProductEditorTab = "commerce" | "source" | "relations" | "landingPages";
type OfferingInfoTab = "templateFields" | "customFields";

const PRODUCT_EDITOR_TABS: Array<{ key: ProductEditorTab; label: string; description: string }> = [
  { key: "commerce", label: "Giá & kho", description: "Giá bán, giá nhập, tồn kho" },
  { key: "source", label: "Nguồn hàng", description: "Provider, supplier request" },
  { key: "relations", label: "Liên kết", description: "Bán chéo và bán kèm" },
  { key: "landingPages", label: "Landing", description: "Landing pages" },
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

export function OfferingEditorForm({
  offering,
  offeringTypeDefinition,
  categories,
  providers,
  allOfferings = [],
  landingPages = [],
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
  const [activeInfoTab, setActiveInfoTab] = useState<OfferingInfoTab>("templateFields");
  const [activeProductTab, setActiveProductTab] = useState<ProductEditorTab>("commerce");
  const [siteDefaults, setSiteDefaults] = useState<Record<string, unknown>>(
    (offering.config.siteDefaults as Record<string, unknown> | undefined) ?? {}
  );
  const [customFields, setCustomFields] = useState<Record<string, unknown>>(
    (offering.config.customFields as Record<string, unknown> | undefined) ?? {}
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingLandingPageId, setDeletingLandingPageId] = useState<string | null>(null);
  const isGeneralOffering = offering.offeringType !== SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE;
  const isBuilder = offering.offeringType === SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE && offering.templateEngine === SYSTEM_TEMPLATE_ENGINES.BUILDER;
  const isCodedTemplate = offering.offeringType === SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE && offering.templateEngine === SYSTEM_TEMPLATE_ENGINES.CODED;
  const canDeleteOffering = !isCodedTemplate;
  const confirm = useConfirm();
  const templateFields = useMemo(
    () => (isGeneralOffering || isBuilder ? [] : getInvitationTemplateFields(offering.templateKey)),
    [isGeneralOffering, isBuilder, offering.templateKey]
  );
  const hasCustomFieldSchema = Boolean(offeringTypeDefinition?.fieldSchema?.length);
  const infoTabs = useMemo(() => {
    const tabs: Array<{ key: OfferingInfoTab; label: string; description: string }> = [];
    if (templateFields.length > 0) {
      tabs.push({ key: "templateFields", label: "Nội dung mẫu", description: "Field mặc định của template" });
    }
    if (hasCustomFieldSchema && offeringTypeDefinition) {
      tabs.push({ key: "customFields", label: "Thông số", description: offeringTypeDefinition.label });
    }
    return tabs;
  }, [hasCustomFieldSchema, offeringTypeDefinition, templateFields.length]);
  const activeFieldTab = infoTabs.some((tab) => tab.key === activeInfoTab) ? activeInfoTab : infoTabs[0]?.key;
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
    const isConfirmed = await confirm({
      title: "Xóa sản phẩm",
      description: `Bạn có chắc chắn muốn xóa sản phẩm: ${offering.name}? Hành động này không thể hoàn tác.`,
      confirmText: "Xóa",
      cancelText: "Hủy",
      variant: "destructive",
    });

    if (!isConfirmed) {
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

  async function handleDeleteLandingPage(landingPage: LandingPage) {
    const isConfirmed = await confirm({
      title: "Xóa landing",
      description: `Xóa “${landingPage.name}” và dữ liệu liên quan?`,
      confirmText: "Xóa",
      cancelText: "Hủy",
      variant: "destructive",
    });

    if (!isConfirmed) {
      return;
    }

    setDeletingLandingPageId(landingPage.id);
    try {
      const formData = new FormData();
      formData.set("landingPageId", landingPage.id);
      const result = await adminApi.deleteLandingPage(formData);
      toast.success(result.message ?? "Đã xóa landing.");
      finishMutation(router, result, { redirect: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa landing.");
    } finally {
      setDeletingLandingPageId(null);
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
                </div>
              </div>

              <div className="space-y-3">
                <AdminField label="Tên builder" className="space-y-1">
                  <AdminInput
                    name="name"
                    value={name}
                    onChange={(e) => {
                      const next = e.target.value;
                      setName(next);
                      setSlug(slugify(next));
                    }}
                  />
                </AdminField>

                <AdminField label="Slug" className="space-y-1">
                  <AdminInput name="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
                </AdminField>

                <AdminField label="Trạng thái" className="space-y-1">
                  <AdminSelect
                    name="status"
                    defaultValue={offering.status}
                  >
                    {OFFERING_STATUSES.map((statusOption) => (
                      <option key={statusOption} value={statusOption}>{getOfferingStatusLabel(statusOption)}</option>
                    ))}
                  </AdminSelect>
                </AdminField>

                <AdminField label="Giá" className="space-y-1">
                  <CurrencyInput name="price" defaultValue={offering.price} />
                </AdminField>

                <AdminField label="Danh mục" className="space-y-1">
                  <AdminSelect
                    name="categoryId"
                    defaultValue={offering.categoryId ?? ""}
                    required
                  >
                    <option value="" disabled>Chọn danh mục</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>

                <AdminField label="Ảnh đại diện" className="space-y-1">
                  <MediaSelector value={thumbnailUrl} onChange={setThumbnailUrl} />
                </AdminField>

                <AdminField label="Mô tả ngắn" className="space-y-1">
                  <AdminTextarea
                    name="excerpt"
                    defaultValue={offering.excerpt}
                    className="min-h-20"
                  />
                </AdminField>

                <AdminField label="Mô tả chi tiết" className="space-y-1">
                  <AdminTextarea
                    name="description"
                    defaultValue={offering.description}
                    className="min-h-20"
                  />
                </AdminField>
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

      <div className="min-w-0 space-y-6 lg:col-span-9">
        <Card className="min-w-0 overflow-visible rounded-lg gap-0">
          <CardHeader className="border-b gap-0 pb-0">
            <CardTitle>{isGeneralOffering ? "Thông tin sản phẩm" : "Thông tin mẫu chuẩn"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <div className="grid gap-5 md:grid-cols-2">
              <AdminField label={isGeneralOffering ? "Tên sản phẩm" : "Tên mẫu"}>
                <AdminInput
                  name="name"
                  value={name}
                  onChange={(e) => {
                    const next = e.target.value;
                    setName(next);
                    setSlug(slugify(next));
                  }}
                />
              </AdminField>

              <AdminField label="Slug">
                <AdminInput name="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
              </AdminField>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <AdminField label="Danh mục">
                <AdminSelect
                  name="categoryId"
                  defaultValue={offering.categoryId ?? ""}
                  required
                >
                  <option value="" disabled>Chọn danh mục</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </AdminSelect>
              </AdminField>

              <AdminField label="Hình thức bàn giao">
                {isGeneralOffering ? (
                  <AdminSelect
                    name="fulfillmentType"
                    value={fulfillmentType}
                    onChange={(e) => setFulfillmentType(e.target.value as OfferingFulfillmentType)}
                  >
                    <option value="digital">Sản phẩm online - Nhận qua link/file</option>
                    <option value="physical">Sản phẩm vật lý - Có sản xuất/giao hàng</option>
                    <option value="service">Dịch vụ - Có người thực hiện/ đặt lịch</option>
                  </AdminSelect>
                ) : (
                  <>
                    <input type="hidden" name="fulfillmentType" value={offering.fulfillmentType} />
                    <AdminReadonlyField>
                      {getFulfillmentTypeLabel(offering.fulfillmentType)}
                    </AdminReadonlyField>
                  </>
                )}
              </AdminField>
            </div>

            {!isGeneralOffering ? (
              <AdminField label="Template source">
                <AdminReadonlyField>
                  {offering.templateKey}
                </AdminReadonlyField>
              </AdminField>
            ) : null}

            <AdminField label="Mô tả ngắn">
              <AdminTextarea
                name="excerpt"
                defaultValue={offering.excerpt}
                className="min-h-24"
              />
            </AdminField>

            <AdminField label="Mô tả chi tiết">
              <AdminTextarea
                name="description"
                defaultValue={offering.description}
                className="min-h-40"
              />
            </AdminField>
          </CardContent>
        </Card>

        {infoTabs.length > 0 ? (
          <Card className="min-w-0 overflow-hidden rounded-lg gap-0">
            <CardHeader className="border-b gap-0 pb-0">
              <CardTitle>Nội dung</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid min-h-[30rem] lg:grid-cols-[220px_minmax(0,1fr)]">
                <div className="border-b bg-white p-3 lg:border-r lg:border-b-0">
                  <div className="grid gap-1">
                    {infoTabs.map((tab) => {
                      const active = activeFieldTab === tab.key;
                      return (
                        <AdminActionTileButton
                          key={tab.key}
                          type="button"
                          className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                            active
                              ? "border-primary/30 bg-primary/5"
                              : "border-border/50 bg-white hover:border-primary/30 hover:bg-primary/5"
                          }`}
                          onClick={() => setActiveInfoTab(tab.key)}
                        >
                          <span className="block font-medium">{tab.label}</span>
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">{tab.description}</span>
                        </AdminActionTileButton>
                      );
                    })}
                  </div>
                </div>

                <div className="min-w-0 p-5 md:p-6">
                  {templateFields.length > 0 ? (
                    <section className={activeFieldTab !== "templateFields" ? "hidden" : "space-y-6"}>
                      <div className="border-b pb-5">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Template defaults
                        </p>
                        <h3 className="mt-1 text-lg font-semibold">Nội dung mẫu</h3>
                      </div>
                      <FieldsEditor
                        fields={templateFields}
                        values={siteDefaults}
                        showTabs={false}
                        className="grid grid-cols-12 gap-4"
                        onChange={(fieldName, value) => {
                          setSiteDefaults((prev) => ({
                            ...prev,
                            [fieldName]: value,
                          }));
                        }}
                      />
                    </section>
                  ) : null}

                  {hasCustomFieldSchema && offeringTypeDefinition ? (
                    <section className={activeFieldTab !== "customFields" ? "hidden" : "space-y-6"}>
                      <div className="border-b pb-5">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Dynamic fields
                        </p>
                        <h3 className="mt-1 text-lg font-semibold">Thông số: {offeringTypeDefinition.label}</h3>
                      </div>
                      <DynamicOfferingFields
                        offeringType={offeringTypeDefinition}
                        values={customFields}
                        onChange={setCustomFields}
                      />
                    </section>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {isGeneralOffering ? (
          <Card className="min-w-0 overflow-hidden rounded-lg gap-0">
            <CardHeader className="border-b gap-0 pb-0">
              <CardTitle>Cấu hình bán hàng</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid min-h-[28rem] lg:grid-cols-[220px_minmax(0,1fr)]">
                <div className="border-b bg-white p-3 lg:border-r lg:border-b-0">
                  <div className="grid gap-1">
                    {PRODUCT_EDITOR_TABS.map((tab) => {
                      const active = activeProductTab === tab.key;
                      return (
                        <AdminActionTileButton
                          key={tab.key}
                          type="button"
                          className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                            active
                              ? "border-primary/30 bg-primary/5"
                              : "bg-white border-border/50 hover:border-primary/30 hover:bg-primary/5"
                          }`}
                          onClick={() => setActiveProductTab(tab.key)}
                        >
                          <span className="block font-medium">{tab.label}</span>
                        </AdminActionTileButton>
                      );
                    })}
                  </div>
                </div>

                <div className="min-w-0 p-6">
                  <section className={activeProductTab !== "commerce" ? "hidden" : "space-y-8"}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <AdminField label="Giá bán">
                        <CurrencyInput name="price" defaultValue={offering.price} />
                      </AdminField>
                      <AdminField label="Giá nhập">
                        <CurrencyInput
                          name="costPrice"
                          value={costPrice}
                          onValueChange={setCostPrice}
                        />
                      </AdminField>
                    </div>

                    <div className="space-y-4 border-t pt-8">
                      <AdminCheckbox
                        name="trackInventory"
                        checked={trackInventory}
                        onChange={(e) => setTrackInventory(e.target.checked)}
                        label="Bật quản lý kho cho sản phẩm này"
                      />

                      <div className="grid gap-4 md:grid-cols-2">
                        <AdminField label="Tồn kho hiện tại">
                          <AdminInput
                            name="stockQuantity"
                            type="number"
                            min={allowBackorder ? undefined : 0}
                            value={stockQuantity}
                            disabled={!trackInventory}
                            onChange={(e) => setStockQuantity(Number(e.target.value || "0"))}
                          />
                        </AdminField>
                        <AdminField label="Ngưỡng cảnh báo thấp">
                          <AdminInput
                            name="lowStockThreshold"
                            type="number"
                            min="0"
                            value={lowStockThreshold}
                            disabled={!trackInventory}
                            onChange={(e) => setLowStockThreshold(Math.max(0, Number(e.target.value || "0")))}
                          />
                        </AdminField>
                      </div>

                      <AdminField label="Cho phép backorder">
                        <AdminCheckbox
                          name="allowBackorder"
                          checked={allowBackorder}
                          disabled={!trackInventory}
                          onChange={(e) => setAllowBackorder(e.target.checked)}
                          description="Cho phép đơn đi tiếp kể cả khi tồn kho không đủ."
                        />
                      </AdminField>
                    </div>
                  </section>

                  <section className={activeProductTab !== "source" ? "hidden" : "space-y-8"}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <AdminField label="Nguồn hàng / chủ sở hữu">
                        <AdminSelect
                          name="ownerType"
                          value={ownerType}
                          onChange={(e) => setOwnerType(e.target.value === "provider" ? "provider" : "internal")}
                        >
                          <option value="internal">Sản phẩm của tôi / nội bộ</option>
                          <option value="provider">Sản phẩm của provider</option>
                        </AdminSelect>
                      </AdminField>
                      <AdminField label="Provider">
                        <AdminSelect
                          name="ownerProviderId"
                          value={ownerProviderId}
                          onChange={(e) => setOwnerProviderId(e.target.value)}
                          disabled={ownerType !== "provider"}
                        >
                          <option value="">Chọn provider</option>
                          {providers.map((provider) => (
                            <option key={provider.id} value={provider.id}>
                              {provider.displayName || provider.display_name || provider.fullName || provider.accountName}
                            </option>
                          ))}
                        </AdminSelect>
                      </AdminField>
                    </div>
                    <AdminField label="Provider SKU">
                      <AdminInput
                        name="providerSku"
                        value={providerSku}
                        onChange={(e) => setProviderSku(e.target.value)}
                        placeholder="Mã nội bộ phía provider"
                      />
                    </AdminField>

                    <div className="border-t pt-8">
                      <AdminCheckbox
                        name="allowProviderSupply"
                        checked={allowProviderSupply}
                        onChange={(e) => setAllowProviderSupply(e.target.checked)}
                        label="Cho phép provider xin cung cấp dịch vụ/sản phẩm này"
                      />
                    </div>
                  </section>

                  <section className={activeProductTab !== "relations" ? "hidden" : "space-y-8"}>
                    <div className="grid gap-6 grid-cols-1">
                      <OfferingSearchSelect
                        name="crossSells"
                        options={allOfferings}
                        defaultValue={offering.crossSells?.map((o) => o.id) ?? []}
                        label="Sản phẩm bán chéo (Cross-sell)"
                        excludeId={offering.id}
                      />
                      <OfferingSearchSelect
                        name="upsells"
                        options={allOfferings}
                        defaultValue={offering.upsells?.map((o) => o.id) ?? []}
                        label="Sản phẩm bán kèm (Upsell)"
                        excludeId={offering.id}
                      />
                    </div>
                  </section>

                  <section className={activeProductTab !== "landingPages" ? "hidden" : "space-y-5"}>
                    <p className="text-sm text-muted-foreground">{landingPages.length} landing</p>

                    {landingPages.length ? (
                      <div className="divide-y rounded-md border">
                        {landingPages.map((landingPage) => (
                          <div key={landingPage.id} className="flex items-center justify-between gap-4 px-4 py-3">
                            <div className="min-w-0">
                              <p className="truncate font-medium">{landingPage.name}</p>
                            </div>
                            <AdminTableActions>
                              <AdminTableActionButton
                                action="edit"
                                label="Sửa"
                                href={ROUTES.ADMIN.LANDING_PAGE(landingPage.id)}
                              />
                              <AdminTableActionButton
                                action="external"
                                label="Mở trang"
                                href={getLandingPagePath(landingPage)}
                                target="_blank"
                              />
                              <AdminTableActionButton
                                action="delete"
                                label="Xóa"
                                disabled={deletingLandingPageId === landingPage.id}
                                onClick={() => void handleDeleteLandingPage(landingPage)}
                              />
                            </AdminTableActions>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                        Chưa có landing.
                      </div>
                    )}
                  </section>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <input type="hidden" name="stockQuantity" value="0" />
            <input type="hidden" name="lowStockThreshold" value="0" />
            <input type="hidden" name="costPrice" value="0" />
            <input type="hidden" name="providerSku" value="" />
          </>
        )}

      </div>

      <div className="min-w-0 space-y-6 lg:col-span-3">
        <Card className="min-w-0 rounded-lg lg:self-start">
          <CardHeader>
            <CardTitle>{isGeneralOffering ? "Sản phẩm bán ra" : "Mẫu chuẩn"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AdminField label="Trạng thái">
              <AdminSelect
                name="status"
                defaultValue={offering.status}
              >
                {OFFERING_STATUSES.map((statusOption) => (
                  <option key={statusOption} value={statusOption}>{getOfferingStatusLabel(statusOption)}</option>
                ))}
              </AdminSelect>
            </AdminField>

            {!isGeneralOffering ? (
              <AdminField label="Giá">
                <CurrencyInput name="price" defaultValue={offering.price} />
              </AdminField>
            ) : null}

            <AdminSubmitButton className="w-full rounded-md" disabled={isSaving}>
              {isSaving ? "Đang lưu..." : "Lưu sản phẩm"}
            </AdminSubmitButton>

            {canDeleteOffering ? (
              <div className="border-t pt-4">
                <AdminDeleteButton className="w-full rounded-md" disabled={isDeleting} onClick={() => void handleDelete()}>
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
