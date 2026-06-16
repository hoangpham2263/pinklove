import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/routes";

export default function ProviderSourcingPage() {
  redirect(ROUTES.PROVIDER.SERVICES);
}
