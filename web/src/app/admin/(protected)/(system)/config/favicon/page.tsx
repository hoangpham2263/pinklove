import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function AdminFaviconSettingsPage() {
  await requireAdmin();
  redirect(ROUTES.ADMIN.CONFIG_BRANDING);
}
