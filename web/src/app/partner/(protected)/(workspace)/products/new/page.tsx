import { RouteBreadcrumbs } from "@/components/common/route-breadcrumbs";
import { ensureVendorPortalSlug, getUserProfile, requireVendor } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { PartnerVendorHeader } from "@/features/vendor-orders/components/partner-vendor-header";
import { listAllProductCategories, listAllProducts } from "@/features/products/server/service";
import { VendorProductSubmissionForm } from "@/features/vendor-product-submissions/components/vendor-product-submission-form";

export default async function PartnerProductCreatePage() {
  const vendor = await requireVendor(ROUTES.PARTNER.LOGIN);
  const [portalSlug, profile, categories, products] = await Promise.all([
    ensureVendorPortalSlug(vendor.id),
    getUserProfile(vendor.id),
    listAllProductCategories(),
    listAllProducts(),
  ]);
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
        currentPath={ROUTES.PARTNER.PRODUCT_NEW}
        currentOrderLabel="Tạo hồ sơ"
      />

      <div className="container mx-auto space-y-5 px-4 py-5 lg:py-7.5 2xl:py-10">
        <RouteBreadcrumbs wrapperClassName="rounded-2xl border border-zinc-200/80 bg-white/92 px-4 py-3" />

        <VendorProductSubmissionForm categories={categories} liveProducts={liveProducts} />
      </div>
    </section>
  );
}
