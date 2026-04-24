import { notFound } from "next/navigation";

import { RouteBreadcrumbs } from "@/components/common/route-breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ensureVendorPortalSlug, getUserProfile, requireVendor } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { PartnerVendorHeader } from "@/features/vendor-orders/components/partner-vendor-header";
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
  const [portalSlug, profile, categories, products, detail] = await Promise.all([
    ensureVendorPortalSlug(vendor.id),
    getUserProfile(vendor.id),
    listAllProductCategories(),
    listAllProducts(),
    getVendorProductSubmissionDetailForVendor(vendor.id, id),
  ]);

  if (!detail) {
    notFound();
  }

  const vendorName = profile.displayName || profile.fullName || vendor.username;
  const portalHref = portalSlug ? ROUTES.PARTNER.PORTAL(portalSlug) : ROUTES.PARTNER.ROOT;
  const liveProducts = products
    .filter((product) => product.productType === "general_product" && product.ownerType === "vendor" && product.ownerVendorUserId === vendor.id)
    .map((product) => ({ id: product.id, name: product.name, slug: product.slug }));

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#fff8f1_0%,#fffdf9_42%,#ffffff_100%)]">
      <PartnerVendorHeader
        vendorName={vendorName}
        portalHref={portalHref}
        currentPath={ROUTES.PARTNER.PRODUCT(detail.id)}
        currentOrderLabel={detail.name}
      />

      <div className="container mx-auto space-y-5 px-4 py-5 lg:py-7.5 2xl:py-10">
        <RouteBreadcrumbs wrapperClassName="rounded-2xl border border-zinc-200/80 bg-white/92 px-4 py-3" />

        <VendorProductSubmissionForm submission={detail} categories={categories} liveProducts={liveProducts} />

        <Card className="border-zinc-200/80 bg-white/92">
          <CardHeader className="border-b">
            <CardTitle className="text-base font-semibold text-zinc-950">Lịch sử review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {detail.events.map((event) => (
              <div key={event.id} className="rounded-xl border border-zinc-200/80 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-zinc-950">{event.message}</p>
                  <p className="text-xs text-zinc-500">{formatDateTime(event.createdAt)}</p>
                </div>
                <p className="mt-1 text-zinc-600">
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
