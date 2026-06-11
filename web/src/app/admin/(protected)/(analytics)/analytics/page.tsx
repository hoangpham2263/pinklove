import { ChartNoAxesCombined } from "lucide-react";

import { AdminDatabasePage } from "@/features/admin/components/admin-database-page";
import { listConversionEventGroups } from "@/features/analytics/server/conversions";
import { requireAdmin } from "@/lib/auth";

export default async function AdminAnalyticsPage() {
  await requireAdmin();
  const rows = await listConversionEventGroups();

  return (
    <AdminDatabasePage
      title="Analytics"
      description="Business conversion goals across RSVP, leads, bookings, checkout and vendor contact."
      rows={rows}
      icon={ChartNoAxesCombined}
      metricLabel="Event groups"
      columns={[
        { key: "event_name", label: "Event" },
        { key: "target_type", label: "Target type" },
        { key: "target_id", label: "Target ID" },
        { key: "total", label: "Total" },
        { key: "last_seen", label: "Last seen" },
      ]}
    />
  );
}
