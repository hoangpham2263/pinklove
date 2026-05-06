import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAvailableProductsForVendorSupply } from "@/features/vendor-product-submissions/server/service";
import { requireVendor } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function PartnerAvailableTemplatesPage() {
  const vendor = await requireVendor(ROUTES.PARTNER.LOGIN);
  const products = await listAvailableProductsForVendorSupply(vendor.id);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-md border bg-background p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Available Templates</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Chọn mẫu có sẵn trong catalog và gửi yêu cầu để được duyệt làm supplier. Admin sẽ kiểm tra giá nhập, năng lực sản xuất và chất lượng mẫu trước khi mở bán.
          </p>
        </div>
        <Button variant="outline" render={<Link href={ROUTES.PARTNER.SUPPLY_REQUESTS}>My Supply Requests</Link>} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {products.map((product) => {
          const locked = Boolean(product.supplierStatus) || ["submitted", "under_review"].includes(product.requestStatus ?? "");
          const submitLabel = product.requestStatus === "changes_requested" ? "Gửi lại yêu cầu cung cấp mẫu" : "Gửi yêu cầu cung cấp mẫu";
          return (
            <Card key={product.id} className="rounded-lg">
              <CardHeader>
                <CardTitle className="text-base">{product.name}</CardTitle>
                <p className="text-sm text-muted-foreground">/{product.slug}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {product.thumbnailUrl ? (
                  <img src={product.thumbnailUrl} alt={product.name} className="h-40 w-full rounded-md object-cover" />
                ) : null}
                <p className="text-sm text-muted-foreground">{product.excerpt || "Chưa có mô tả ngắn."}</p>
                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                  {product.supplierStatus ? (
                    <p>Supplier status: {product.supplierStatus}</p>
                  ) : product.requestStatus ? (
                    <p>Request status: {product.requestStatus}</p>
                  ) : (
                    <p>Mẫu này đang có thể xin cung cấp.</p>
                  )}
                </div>

                {!locked ? (
                  <form action={ROUTES.API.PARTNER.PRODUCTS.SUPPLY_REQUESTS} method="POST" className="grid gap-3 md:grid-cols-2">
                    <input type="hidden" name="productId" value={product.id} />
                    <input name="purchaseCost" type="number" min="0" step="1000" placeholder="Giá nhập/gia công" className="h-10 rounded-md border bg-background px-3 text-sm" />
                    <input name="vendorSku" placeholder="SKU vendor" className="h-10 rounded-md border bg-background px-3 text-sm" />
                    <input name="leadTimeDays" type="number" min="0" placeholder="Lead time ngày" className="h-10 rounded-md border bg-background px-3 text-sm" />
                    <input name="monthlyCapacity" type="number" min="0" placeholder="Năng lực/tháng" className="h-10 rounded-md border bg-background px-3 text-sm" />
                    <input name="serviceArea" placeholder="Khu vực phục vụ" className="h-10 rounded-md border bg-background px-3 text-sm md:col-span-2" />
                    <input name="sampleImageUrl" placeholder="Link ảnh mẫu in thử" className="h-10 rounded-md border bg-background px-3 text-sm md:col-span-2" />
                    <textarea name="materialNote" placeholder="Chất liệu/giấy/hoàn thiện" className="min-h-20 rounded-md border bg-background px-3 py-2 text-sm md:col-span-2" />
                    <textarea name="qualityNote" placeholder="Cam kết chất lượng/đóng gói" className="min-h-20 rounded-md border bg-background px-3 py-2 text-sm md:col-span-2" />
                    <textarea name="vendorNote" placeholder="Ghi chú thêm cho admin" className="min-h-20 rounded-md border bg-background px-3 py-2 text-sm md:col-span-2" />
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
