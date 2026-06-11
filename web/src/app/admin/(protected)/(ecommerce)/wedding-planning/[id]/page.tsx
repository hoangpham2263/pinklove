import { notFound } from "next/navigation";
import { CalendarClock } from "lucide-react";

import { AdminDatabasePage } from "@/features/admin/components/admin-database-page";
import { getWeddingPlanningDetailForAdmin } from "@/features/wedding-planning/server/service";
import { requireAdmin } from "@/lib/auth";

type PageProps = {
  params: Promise<{ id: string }>;
};

function FieldList({ rows }: { rows: Record<string, unknown> }) {
  return (
    <div className="grid gap-3 rounded-md border bg-background p-4 md:grid-cols-3">
      {Object.entries(rows).map(([key, value]) => (
        <div key={key}>
          <p className="text-xs uppercase text-muted-foreground">{key.replace(/_/g, " ")}</p>
          <p className="mt-1 break-words text-sm font-medium">{String(value ?? "-")}</p>
        </div>
      ))}
    </div>
  );
}

export default async function AdminWeddingPlanningDetailPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const detail = await getWeddingPlanningDetailForAdmin(id);

  if (!detail) {
    notFound();
  }

  return (
    <section className="flex w-full flex-1 flex-col gap-6 p-5 md:p-7.5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Wedding Planning Detail</h1>
        <p className="text-sm text-muted-foreground">Chi tiết wedding site, khách mời, RSVP, bàn tiệc, checklist và timeline phục vụ CSKH.</p>
      </div>

      <FieldList rows={detail.site} />

      <AdminDatabasePage
        title="Guests"
        description="Danh sách khách mời."
        rows={detail.guests}
        icon={CalendarClock}
        metricLabel="Guests"
        columns={[
          { key: "full_name", label: "Name" },
          { key: "phone", label: "Phone" },
          { key: "email", label: "Email" },
          { key: "group_label", label: "Group" },
          { key: "created_at", label: "Created" },
        ]}
      />

      <AdminDatabasePage
        title="RSVP"
        description="Phản hồi RSVP."
        rows={detail.rsvps}
        icon={CalendarClock}
        metricLabel="RSVPs"
        columns={[
          { key: "attendee_name", label: "Name" },
          { key: "attendee_count", label: "Count" },
          { key: "response_status", label: "Status" },
          { key: "meal_choice", label: "Meal" },
          { key: "special_requests", label: "Requests" },
        ]}
      />

      <AdminDatabasePage
        title="Tables"
        description="Bàn tiệc và số khách đã xếp."
        rows={detail.tables}
        icon={CalendarClock}
        metricLabel="Tables"
        columns={[
          { key: "name", label: "Table" },
          { key: "capacity", label: "Capacity" },
          { key: "assigned_guests", label: "Assigned" },
        ]}
      />

      <AdminDatabasePage
        title="Checklist"
        description="Công việc trong kế hoạch cưới."
        rows={detail.tasks}
        icon={CalendarClock}
        metricLabel="Tasks"
        columns={[
          { key: "title", label: "Task" },
          { key: "category", label: "Category" },
          { key: "status", label: "Status" },
          { key: "priority", label: "Priority" },
          { key: "due_date", label: "Due" },
        ]}
      />

      <AdminDatabasePage
        title="Timeline"
        description="Lịch trình sự kiện."
        rows={detail.timeline}
        icon={CalendarClock}
        metricLabel="Timeline items"
        columns={[
          { key: "title", label: "Title" },
          { key: "timeline_type", label: "Type" },
          { key: "starts_at", label: "Starts" },
          { key: "ends_at", label: "Ends" },
        ]}
      />
    </section>
  );
}
