import { redirect } from "next/navigation";

import { ensureVendorPortalSlug, requireVendor } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function PartnerOrdersLegacyPage() {
  const vendor = await requireVendor(ROUTES.PARTNER.LOGIN);
  const slug = await ensureVendorPortalSlug(vendor.id);

  redirect(slug ? ROUTES.PARTNER.PORTAL(slug) : ROUTES.PARTNER.ROOT);
}
