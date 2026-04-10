import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function AdminProductListPage() {
  await requireAdmin();
  redirect(ROUTES.ADMIN.PRODUCT_LIST);
}
