import { CurrencyInput } from "@/components/common/currency-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOfferingProviderSupplierStatusLabel, getProviderOfferingSupplierRequestStatusLabel } from "@/features/provider-offering-submissions/labels";
import { listAvailableOfferingsForProviderSupply } from "@/features/provider-offering-submissions/server/service";
import { ProviderLinkButton, ProviderSubmitButton } from "@/features/provider-orders/components/provider-buttons";
import { ProviderInput, ProviderTextarea } from "@/features/provider-orders/components/provider-form";
import { ProviderEmptyState, ProviderPage, ProviderPageHeader } from "@/features/provider-orders/components/provider-page";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function ProviderAvailableTemplatesPage() {
  const provider = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const offerings = await listAvailableOfferingsForProviderSupply(provider.id);

  return (
    <ProviderPage>
      <ProviderPageHeader
        title="Dịch vụ/sản phẩm cần provider"
        description="Chọn dịch vụ/sản phẩm admin đang cần provider và gửi báo giá, năng lực cung ứng, chất lượng để admin so sánh trước khi duyệt."
        actions={<ProviderLinkButton href={ROUTES.PROVIDER.SUPPLY_REQUESTS}>Yêu cầu cung cấp của tôi</ProviderLinkButton>}
      />

      {offerings.length === 0 ? (
        <ProviderEmptyState>Hiện chưa có dịch vụ/sản phẩm nào đang mở cho provider.</ProviderEmptyState>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {offerings.map((offering) => {
          const locked = Boolean(offering.supplierStatus) || ["submitted", "under_review"].includes(offering.requestStatus ?? "");
          const submitLabel = offering.requestStatus === "changes_requested" ? "Gửi lại yêu cầu cung cấp mẫu" : "Gửi yêu cầu cung cấp mẫu";
          return (
            <Card key={offering.id} className="rounded-lg">
              <CardHeader>
                <CardTitle className="text-base">{offering.name}</CardTitle>
                <p className="text-sm text-muted-foreground">/{offering.slug}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {offering.thumbnailUrl ? (
                  <img src={offering.thumbnailUrl} alt={offering.name} className="h-40 w-full rounded-md object-cover" />
                ) : null}
                <p className="text-sm text-muted-foreground">{offering.excerpt || "Chưa có mô tả ngắn."}</p>
                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                  {offering.supplierStatus ? (
                    <p>Trạng thái cung cấp: {getOfferingProviderSupplierStatusLabel(offering.supplierStatus)}</p>
                  ) : offering.requestStatus ? (
                    <p>Trạng thái yêu cầu: {getProviderOfferingSupplierRequestStatusLabel(offering.requestStatus)}</p>
                  ) : (
                    <p>Dịch vụ/sản phẩm này đang cần provider gửi thông tin cung cấp.</p>
                  )}
                </div>

                {!locked ? (
                  <form action={ROUTES.API.PROVIDER.OFFERINGS.SUPPLY_REQUESTS} method="POST" className="grid gap-3 md:grid-cols-2">
                    <input type="hidden" name="offeringId" value={offering.id} />
                    <CurrencyInput name="purchaseCost" placeholder="Giá nhập/gia công" className="rounded-md bg-background px-3 text-sm" />
                    <ProviderInput name="providerSku" placeholder="Mã SKU của bạn" />
                    <ProviderInput name="leadTimeDays" type="number" min="0" placeholder="Thời gian xử lý ngày" />
                    <ProviderInput name="monthlyCapacity" type="number" min="0" placeholder="Năng lực/tháng" />
                    <ProviderInput name="serviceArea" placeholder="Khu vực phục vụ" className="md:col-span-2" />
                    <ProviderInput name="sampleImageUrl" placeholder="Link ảnh mẫu in thử" className="md:col-span-2" />
                    <ProviderTextarea name="materialNote" placeholder="Chất liệu/giấy/hoàn thiện" className="min-h-20 md:col-span-2" />
                    <ProviderTextarea name="qualityNote" placeholder="Cam kết chất lượng/đóng gói" className="min-h-20 md:col-span-2" />
                    <ProviderTextarea name="providerNote" placeholder="Ghi chú thêm cho admin" className="min-h-20 md:col-span-2" />
                    <ProviderSubmitButton type="submit" className="md:col-span-2">{submitLabel}</ProviderSubmitButton>
                  </form>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ProviderPage>
  );
}
