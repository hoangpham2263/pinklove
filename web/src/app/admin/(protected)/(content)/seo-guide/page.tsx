import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function AdminSeoGuidePage() {
  await requireAdmin();
  redirect(ROUTES.ADMIN.SEO_PAGES);
}
