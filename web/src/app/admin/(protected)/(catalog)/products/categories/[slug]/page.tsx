import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function AdminProductCategoryEditorPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin();
  const { slug } = await params;
  redirect(ROUTES.ADMIN.PRODUCT_CATEGORY(slug));
}
