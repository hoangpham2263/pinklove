import { CalendarClock } from "lucide-react";

import { AdminDatabasePage } from "@/features/admin/components/admin-database-page";
import { listWeddingPlanningForAdmin } from "@/features/wedding-planning/server/service";
import { requireAdmin } from "@/lib/auth";

export default async function AdminWeddingPlanningPage() {
  await requireAdmin();
  const rows = await listWeddingPlanningForAdmin();

  return (
    <AdminDatabasePage
      title="Wedding Planning"
      description="Theo dõi wedding site, khách mời, RSVP, bàn tiệc, checklist và timeline của khách hàng."
      rows={rows}
      icon={CalendarClock}
      metricLabel="Wedding sites"
      columns={[
        { key: "title", label: "Wedding site" },
        { key: "customer", label: "Customer" },
        { key: "project_status", label: "Status" },
        { key: "event_date", label: "Event date" },
        { key: "budget", label: "Budget" },
        { key: "guest_target", label: "Guest target" },
        { key: "guests", label: "Guests" },
        { key: "rsvps", label: "RSVPs" },
        { key: "tables", label: "Tables" },
        { key: "tasks", label: "Tasks" },
        { key: "timeline_items", label: "Timeline" },
        { key: "updated_at", label: "Updated" },
      ]}
    />
  );
}
