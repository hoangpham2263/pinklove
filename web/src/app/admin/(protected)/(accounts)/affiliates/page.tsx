import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/routes";

export default function AdminAffiliatesPage() {
  redirect(`${ROUTES.ADMIN.ACCOUNTS}#affiliate`);
}
