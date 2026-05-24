import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { listAllOfferingCategories } from "@/features/offerings/server/service";
import { ProviderOfferingSubmissionForm } from "@/features/provider-offering-submissions/components/provider-offering-submission-form";
import { listLiveOfferingsForProviderSubmissions } from "@/features/provider-offering-submissions/server/service";

export default async function ProviderOfferingCreatePage() {
  const providerUser = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const [categories, liveOfferings] = await Promise.all([
    listAllOfferingCategories(),
    listLiveOfferingsForProviderSubmissions(providerUser.id),
  ]);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="space-y-5">
        <ProviderOfferingSubmissionForm categories={categories} liveOfferings={liveOfferings} />
      </div>
    </section>
  );
}
