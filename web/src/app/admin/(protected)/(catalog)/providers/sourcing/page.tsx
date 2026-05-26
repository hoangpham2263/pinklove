import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/routes";

export default function AdminProviderSourcingRedirectPage() {
  redirect(ROUTES.ADMIN.PROVIDER_SOURCING_OFFERINGS);
}
