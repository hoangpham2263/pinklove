import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function AdminAdsOverviewPage() {
  await requireAdmin();
  redirect(ROUTES.ADMIN.MARKETING_BANNER_ADS);
}
