import { AuthRateLimitSettings } from "@/features/admin/components/settings/security-settings-sections";
import { requireAdminPermission } from "@/lib/auth";

export default async function AdminAuthRateLimitSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPermission("security.view");
  return <AuthRateLimitSettings searchParams={(await searchParams) ?? {}} />;
}
