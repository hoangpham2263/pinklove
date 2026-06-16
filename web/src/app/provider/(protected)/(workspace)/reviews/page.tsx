import { ProviderDataSection } from "@/features/provider-orders/components/provider-data-section";
import { ProviderPage, ProviderPageHeader } from "@/features/provider-orders/components/provider-page";
import { getProviderByUserId } from "@/features/providers/server/service";
import { listProviderReviews } from "@/features/providers/server/workspace";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function ProviderReviewsPage() {
  const user = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const provider = await getProviderByUserId(user.id);
  const rows = provider ? await listProviderReviews(provider.id) : [];

  return (
    <ProviderPage>
      <ProviderPageHeader title="Reviews" description="Theo dõi đánh giá khách hàng dành cho provider." />
      <ProviderDataSection
        title="Danh sách review"
        rows={rows}
        columns={[
          { key: "customer", label: "Customer" },
          { key: "rating", label: "Rating" },
          { key: "status", label: "Status" },
          { key: "content", label: "Content" },
          { key: "created_at", label: "Created" },
        ]}
        emptyMessage="Chưa có review."
      />
    </ProviderPage>
  );
}
