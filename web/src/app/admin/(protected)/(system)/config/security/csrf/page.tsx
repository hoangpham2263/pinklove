import { CsrfSettings } from "@/features/admin/components/settings/security-settings-sections";
import { requireAdminPermission } from "@/lib/auth";

export default async function AdminCsrfSettingsPage() {
  await requireAdminPermission("security.view");
  return <CsrfSettings />;
}
