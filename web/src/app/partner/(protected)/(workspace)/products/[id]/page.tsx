import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireVendor } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { listAllProductCategories, listAllProducts } from "@/features/products/server/service";
import { VendorProductSubmissionForm } from "@/features/vendor-product-submissions/components/vendor-product-submission-form";
import { getVendorProductSubmissionDetailForVendor } from "@/features/vendor-product-submissions/server/service";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

export default async function PartnerProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const vendor = await requireVendor(ROUTES.PARTNER.LOGIN);
  const { id } = await params;
  const [categories, products, detail] = await Promise.all([
    listAllProductCategories(),
    listAllProducts(),
    getVendorProductSubmissionDetailForVendor(vendor.id, id),
  ]);

  if (!detail) {
    notFound();
  }

  const liveProducts = products
    .filter((product) => product.productType === "general_product" && product.ownerType === "vendor" && product.ownerVendorUserId === vendor.id)
    .map((product) => ({ id: product.id, name: product.name, slug: product.slug }));

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="space-y-5">
        <VendorProductSubmissionForm submission={detail} categories={categories} liveProducts={liveProducts} />

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base font-semibold">Lịch sử review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {detail.events.map((event) => (
              <div key={event.id} className="rounded-md border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{event.message}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(event.createdAt)}</p>
                </div>
                <p className="mt-1 text-muted-foreground">
                  {event.actorType}
                  {event.actorUsername ? ` • ${event.actorUsername}` : ""}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
