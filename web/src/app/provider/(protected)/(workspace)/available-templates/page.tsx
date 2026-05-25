import Link from "next/link";

import { CurrencyInput } from "@/components/common/currency-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOfferingProviderSupplierStatusLabel, getProviderOfferingSupplierRequestStatusLabel } from "@/features/provider-offering-submissions/labels";
import { listAvailableOfferingsForProviderSupply } from "@/features/provider-offering-submissions/server/service";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function ProviderAvailableTemplatesPage() {
  const provider = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const offerings = await listAvailableOfferingsForProviderSupply(provider.id);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-md border bg-background p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mẫu có thể cung cấp</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Chọn mẫu có sẵn trong catalog và gửi yêu cầu cung cấp. Admin sẽ kiểm tra giá nhập, năng lực sản xuất và chất lượng mẫu trước khi mở bán.
          </p>
        </div>
        <Button variant="outline" render={<Link href={ROUTES.PROVIDER.SUPPLY_REQUESTS}>Yêu cầu cung cấp của tôi</Link>} />
      </div>

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
                    <p>Mẫu này đang có thể xin cung cấp.</p>
                  )}
                </div>

                {!locked ? (
                  <form action={ROUTES.API.PROVIDER.OFFERINGS.SUPPLY_REQUESTS} method="POST" className="grid gap-3 md:grid-cols-2">
                    <input type="hidden" name="offeringId" value={offering.id} />
                    <CurrencyInput name="purchaseCost" placeholder="Giá nhập/gia công" className="rounded-md bg-background px-3 text-sm" />
                    <input name="providerSku" placeholder="Mã SKU của bạn" className="h-10 rounded-md border bg-background px-3 text-sm" />
                    <input name="leadTimeDays" type="number" min="0" placeholder="Thời gian xử lý ngày" className="h-10 rounded-md border bg-background px-3 text-sm" />
                    <input name="monthlyCapacity" type="number" min="0" placeholder="Năng lực/tháng" className="h-10 rounded-md border bg-background px-3 text-sm" />
                    <input name="serviceArea" placeholder="Khu vực phục vụ" className="h-10 rounded-md border bg-background px-3 text-sm md:col-span-2" />
                    <input name="sampleImageUrl" placeholder="Link ảnh mẫu in thử" className="h-10 rounded-md border bg-background px-3 text-sm md:col-span-2" />
                    <textarea name="materialNote" placeholder="Chất liệu/giấy/hoàn thiện" className="min-h-20 rounded-md border bg-background px-3 py-2 text-sm md:col-span-2" />
                    <textarea name="qualityNote" placeholder="Cam kết chất lượng/đóng gói" className="min-h-20 rounded-md border bg-background px-3 py-2 text-sm md:col-span-2" />
                    <textarea name="providerNote" placeholder="Ghi chú thêm cho admin" className="min-h-20 rounded-md border bg-background px-3 py-2 text-sm md:col-span-2" />
                    <Button type="submit" className="md:col-span-2">{submitLabel}</Button>
                  </form>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
