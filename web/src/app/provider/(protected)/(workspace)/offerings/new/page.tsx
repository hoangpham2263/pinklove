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
        <div className="rounded-md border bg-background p-6">
          <h1 className="text-2xl font-semibold tracking-tight">Tạo yêu cầu sản phẩm</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Dùng hồ sơ này để đề xuất sản phẩm mới, yêu cầu cập nhật sản phẩm đang liên kết hoặc gửi yêu cầu ngừng bán.
          </p>
        </div>
        <ProviderOfferingSubmissionForm categories={categories} liveOfferings={liveOfferings} />
      </div>
    </section>
  );
}
