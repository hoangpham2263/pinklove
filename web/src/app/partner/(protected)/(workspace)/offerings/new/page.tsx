import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { listAllOfferingCategories, listAllOfferings } from "@/features/offerings/server/service";
import { getProviderByUserId } from "@/features/providers/server/service";
import { ProviderOfferingSubmissionForm } from "@/features/provider-offering-submissions/components/provider-offering-submission-form";

export default async function PartnerOfferingCreatePage() {
  const providerUser = await requireProvider(ROUTES.PARTNER.LOGIN);
  const [categories, offerings, provider] = await Promise.all([
    listAllOfferingCategories(),
    listAllOfferings(),
    getProviderByUserId(providerUser.id),
  ]);
  const liveOfferings = offerings
    .filter((offering) => offering.offeringType === "physical_product" && offering.ownerType === "provider" && offering.ownerProviderId === provider?.id)
    .map((offering) => ({ id: offering.id, name: offering.name, slug: offering.slug }));

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="space-y-5">
        <ProviderOfferingSubmissionForm categories={categories} liveOfferings={liveOfferings} />
      </div>
    </section>
  );
}
