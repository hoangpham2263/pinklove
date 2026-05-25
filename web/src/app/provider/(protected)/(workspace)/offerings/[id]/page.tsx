import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { listAllOfferingCategories } from "@/features/offerings/server/service";
import { ProviderPage, ProviderPageHeader } from "@/features/provider-orders/components/provider-page";
import { ProviderOfferingSubmissionForm } from "@/features/provider-offering-submissions/components/provider-offering-submission-form";
import { getProviderOfferingSubmissionDetailForProvider, listLiveOfferingsForProviderSubmissions } from "@/features/provider-offering-submissions/server/service";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

export default async function ProviderOfferingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const providerUser = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const { id } = await params;
  const [categories, liveOfferings, detail] = await Promise.all([
    listAllOfferingCategories(),
    listLiveOfferingsForProviderSubmissions(providerUser.id),
    getProviderOfferingSubmissionDetailForProvider(providerUser.id, id),
  ]);

  if (!detail) {
    notFound();
  }

  return (
    <ProviderPage>
      <ProviderPageHeader
        title="Yêu cầu sản phẩm"
        description="Theo dõi và chỉnh sửa hồ sơ trước khi gửi duyệt hoặc khi admin yêu cầu bổ sung."
      />
      <ProviderOfferingSubmissionForm submission={detail} categories={categories} liveOfferings={liveOfferings} />

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base font-semibold">Lịch sử review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-5">
          {detail.events.map((event) => (
            <div key={event.id} className="rounded-md border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{event.message}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(event.createdAt)}</p>
              </div>
              <p className="mt-1 text-muted-foreground">
                {event.actorType}
                {event.actorUsername ? ` • ${event.actorUsername}` : ""}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </ProviderPage>
  );
}
