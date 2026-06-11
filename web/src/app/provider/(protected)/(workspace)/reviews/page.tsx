import { MessagesSquare } from "lucide-react";

import { DatabasePage } from "@/components/common/database-table";
import { getProviderByUserId } from "@/features/providers/server/service";
import { listProviderReviews } from "@/features/providers/server/workspace";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function ProviderReviewsPage() {
  const user = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const provider = await getProviderByUserId(user.id);
  const rows = provider ? await listProviderReviews(provider.id) : [];

  return (
    <DatabasePage
      title="Reviews"
      description="Theo dõi đánh giá khách hàng dành cho provider."
      rows={rows}
      icon={MessagesSquare}
      metricLabel="Reviews"
      columns={[
        { key: "customer", label: "Customer" },
        { key: "rating", label: "Rating" },
        { key: "status", label: "Status" },
        { key: "content", label: "Content" },
        { key: "created_at", label: "Created" },
      ]}
    />
  );
}
