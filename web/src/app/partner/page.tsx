import { redirect } from "next/navigation";

import { ensureProviderPortalSlug, getCurrentUser, isProviderRole } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function PartnerRootPage() {
  const user = await getCurrentUser();
  if (user && isProviderRole(user.role)) {
    const slug = await ensureProviderPortalSlug(user.id);
    if (slug) {
      redirect(ROUTES.PARTNER.PORTAL(slug));
    }
  }

  redirect(ROUTES.PARTNER.LOGIN);
}
