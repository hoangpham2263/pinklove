import { Suspense } from "react";
import { redirect } from "next/navigation";

import { PartnerLoginForm } from "@/features/auth/components/login-forms";
import { ensureProviderPortalSlug, getCurrentUser, isProviderRole } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function PartnerLoginPage() {
  const user = await getCurrentUser();
  if (user) {
    if (isProviderRole(user.role)) {
      const slug = await ensureProviderPortalSlug(user.id);
      redirect(slug ? ROUTES.PARTNER.PORTAL(slug) : ROUTES.PARTNER.ROOT);
    }

    redirect(ROUTES.CUSTOMER.DASHBOARD);
  }

  return (
    <Suspense fallback={null}>
      <PartnerLoginForm />
    </Suspense>
  );
}
