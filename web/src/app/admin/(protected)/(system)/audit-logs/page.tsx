import { Radio } from "lucide-react";

import { AdminDatabasePage } from "@/features/admin/components/admin-database-page";
import { listAuditLogs } from "@/features/admin/server/operations";
import { requireAdmin } from "@/lib/auth";

export default async function AdminAuditLogsPage() {
  await requireAdmin();
  const rows = await listAuditLogs();

  return (
    <AdminDatabasePage
      title="Audit Logs"
      description="Tra cứu thay đổi trường dữ liệu từ bảng field_change_logs."
      rows={rows}
      icon={Radio}
      metricLabel="Changes"
      columns={[
        { key: "target_type", label: "Target type" },
        { key: "target_id", label: "Target ID" },
        { key: "field_key", label: "Field" },
        { key: "actor", label: "Actor" },
        { key: "old_value", label: "Old value" },
        { key: "new_value", label: "New value" },
        { key: "created_at", label: "Changed at" },
      ]}
    />
  );
}
