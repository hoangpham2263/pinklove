import { MessagesSquare } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminProviderLeadsTable } from "@/features/providers/admin/admin-provider-leads-table";
import { listVendorLeadsForAdmin } from "@/features/providers/server/leads";
import { requireAdmin } from "@/lib/auth";

export default async function AdminProviderLeadsPage() {
  await requireAdmin();
  const rows = await listVendorLeadsForAdmin();

  return (
    <section className="space-y-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md border bg-background">
              <MessagesSquare className="h-5 w-5 text-muted-foreground" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Provider Leads & Quotes</h1>
              <p className="mt-1 max-w-4xl text-sm leading-6 text-muted-foreground">
                Theo dõi lead, báo giá và trạng thái chuyển đổi sang booking. Khi khách chấp nhận quote kèm slot,
                slot được giữ để ưu tiên lịch triển khai/quảng cáo cho provider.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card className="rounded-lg">
        <CardHeader className="border-b">
          <CardTitle className="text-base font-semibold">Vendor leads</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <AdminProviderLeadsTable rows={rows} />
        </CardContent>
      </Card>
    </section>
  );
}
