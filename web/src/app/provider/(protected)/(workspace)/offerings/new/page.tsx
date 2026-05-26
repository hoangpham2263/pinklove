import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { listAllOfferingCategories } from "@/features/offerings/server/service";
import { ProviderPage, ProviderPageHeader } from "@/features/provider-orders/components/provider-page";
import { ProviderOfferingSubmissionForm } from "@/features/provider-offering-submissions/components/provider-offering-submission-form";
import { listLiveOfferingsForProviderSubmissions } from "@/features/provider-offering-submissions/server/service";

export default async function ProviderOfferingCreatePage({ searchParams }: { searchParams?: Promise<{ intent?: string }> }) {
  const providerUser = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const params = searchParams ? await searchParams : {};
  const defaultFulfillmentType = params.intent === "product" ? "physical" : "service";
  const [categories, liveOfferings] = await Promise.all([
    listAllOfferingCategories(),
    listLiveOfferingsForProviderSubmissions(providerUser.id),
  ]);

  return (
    <ProviderPage>
      <ProviderPageHeader
        title="Yêu cầu nhận dịch vụ/sản phẩm"
        description="Dùng hồ sơ này để chọn loại dịch vụ/sản phẩm, mô tả năng lực cung cấp và gửi admin duyệt trước khi khai báo lịch hoặc bán."
      />
      <ProviderOfferingSubmissionForm categories={categories} liveOfferings={liveOfferings} defaultFulfillmentType={defaultFulfillmentType} />
    </ProviderPage>
  );
}
