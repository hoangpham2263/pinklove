import { redirect } from "next/navigation";

import { getCurrentUser, isProviderRole } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function ProviderRootPage() {
  const user = await getCurrentUser();
  if (user && isProviderRole(user.role)) {
    redirect(ROUTES.PROVIDER.DASHBOARD);
  }

  redirect(ROUTES.PROVIDER.LOGIN);
}
