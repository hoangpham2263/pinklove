import { HeaderSettings } from "@/features/admin/components/settings/security-settings-sections";
import { requireAdminPermission } from "@/lib/auth";

export default async function AdminHeaderSettingsPage() {
  await requireAdminPermission("security.view");
  return <HeaderSettings />;
}
