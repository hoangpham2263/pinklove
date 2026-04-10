import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

export default function AdminLegacyCommerceConfigPage() {
  redirect(ROUTES.ADMIN.CONFIG_ECOMMERCE);
}
