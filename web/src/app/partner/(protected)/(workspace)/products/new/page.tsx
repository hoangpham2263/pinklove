import { requireVendor } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { listAllProductCategories, listAllProducts } from "@/features/products/server/service";
import { VendorProductSubmissionForm } from "@/features/vendor-product-submissions/components/vendor-product-submission-form";

export default async function PartnerProductCreatePage() {
  const vendor = await requireVendor(ROUTES.PARTNER.LOGIN);
  const [categories, products] = await Promise.all([
    listAllProductCategories(),
    listAllProducts(),
  ]);
  const liveProducts = products
    .filter((product) => product.productType === "general_product" && product.ownerType === "vendor" && product.ownerVendorUserId === vendor.id)
    .map((product) => ({ id: product.id, name: product.name, slug: product.slug }));

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="space-y-5">
        <VendorProductSubmissionForm categories={categories} liveProducts={liveProducts} />
      </div>
    </section>
  );
}
