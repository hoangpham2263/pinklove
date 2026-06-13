import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/routes";

export default function AdminOfferingsPage() {
  redirect(`${ROUTES.ADMIN.COMMERCE}#offerings`);
}
