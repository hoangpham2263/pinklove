import { MessagesSquare } from "lucide-react";

import { AdminDatabasePage } from "@/features/admin/components/admin-database-page";
import { listVendorLeadsForAdmin } from "@/features/providers/server/leads";
import { requireAdmin } from "@/lib/auth";

export default async function AdminProviderLeadsPage() {
  await requireAdmin();
  const rows = await listVendorLeadsForAdmin();

  return (
    <AdminDatabasePage
      title="Provider Leads & Quotes"
      description="Theo dõi lead, báo giá và trạng thái chuyển đổi từ yêu cầu nhà cung cấp sang booking."
      rows={rows}
      icon={MessagesSquare}
      metricLabel="Vendor leads"
      columns={[
        { key: "provider", label: "Provider" },
        { key: "customer", label: "Customer" },
        { key: "offering", label: "Offering" },
        { key: "budget", label: "Budget" },
        { key: "event_date", label: "Event date" },
        { key: "status", label: "Lead status" },
        { key: "quote_amount", label: "Quote amount" },
        { key: "quote_status", label: "Quote status" },
        { key: "created_at", label: "Created" },
        { key: "updated_at", label: "Updated" },
      ]}
    />
  );
}
