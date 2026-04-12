import { redirect } from "next/navigation";

import { ensureVendorPortalSlug, getCurrentUser, isVendorRole } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function PartnerRootPage() {
  const user = await getCurrentUser();
  if (user && isVendorRole(user.role)) {
    const slug = await ensureVendorPortalSlug(user.id);
    if (slug) {
      redirect(ROUTES.PARTNER.PORTAL(slug));
    }
  }

  redirect(ROUTES.PARTNER.LOGIN);
}
