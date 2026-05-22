import { requireVendor } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { listAllOfferingCategories, listAllOfferings } from "@/features/offerings/server/service";
import { VendorOfferingSubmissionForm } from "@/features/vendor-offering-submissions/components/vendor-offering-submission-form";

export default async function PartnerOfferingCreatePage() {
  const vendor = await requireVendor(ROUTES.PARTNER.LOGIN);
  const [categories, offerings] = await Promise.all([
    listAllOfferingCategories(),
    listAllOfferings(),
  ]);
  const liveOfferings = offerings
    .filter((offering) => offering.offeringType === "physical_product" && offering.ownerType === "vendor" && offering.ownerVendorUserId === vendor.id)
    .map((offering) => ({ id: offering.id, name: offering.name, slug: offering.slug }));

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="space-y-5">
        <VendorOfferingSubmissionForm categories={categories} liveOfferings={liveOfferings} />
      </div>
    </section>
  );
}
