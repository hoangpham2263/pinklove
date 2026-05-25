import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { listAllOfferingCategories } from "@/features/offerings/server/service";
import { ProviderPage, ProviderPageHeader } from "@/features/provider-orders/components/provider-page";
import { ProviderOfferingSubmissionForm } from "@/features/provider-offering-submissions/components/provider-offering-submission-form";
import { listLiveOfferingsForProviderSubmissions } from "@/features/provider-offering-submissions/server/service";

export default async function ProviderOfferingCreatePage() {
  const providerUser = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const [categories, liveOfferings] = await Promise.all([
    listAllOfferingCategories(),
    listLiveOfferingsForProviderSubmissions(providerUser.id),
  ]);

  return (
    <ProviderPage>
      <ProviderPageHeader
        title="Tạo yêu cầu sản phẩm"
        description="Dùng hồ sơ này để đề xuất sản phẩm mới, yêu cầu cập nhật sản phẩm đang liên kết hoặc gửi yêu cầu ngừng bán."
      />
      <ProviderOfferingSubmissionForm categories={categories} liveOfferings={liveOfferings} />
    </ProviderPage>
  );
}
