import { BriefcaseBusiness } from "lucide-react";

import { AdminDatabasePage } from "@/features/admin/components/admin-database-page";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/database";

export default async function AdminProvidersPage() {
  await requireAdmin();
  const result = await query<Record<string, unknown>>(`
    SELECT
      provider.id,
      provider.slug,
      provider.display_name,
      provider.provider_type,
      provider.status,
      profile.business_name,
      profile.phone,
      provider.updated_at
    FROM providers provider
    LEFT JOIN provider_profiles profile ON profile.provider_id = provider.id
    ORDER BY provider.updated_at DESC
  `);

  return (
    <AdminDatabasePage
      title="Providers"
      description="Unified provider layer cho vendor, creator, studio, planner, makeup, photographer."
      rows={result.rows}
      icon={BriefcaseBusiness}
      metricLabel="Providers"
      columns={[
        { key: "slug", label: "Slug" },
        { key: "display_name", label: "Display name" },
        { key: "provider_type", label: "Type" },
        { key: "status", label: "Status" },
        { key: "business_name", label: "Business" },
        { key: "phone", label: "Phone" },
        { key: "updated_at", label: "Updated" },
      ]}
    />
  );
}
