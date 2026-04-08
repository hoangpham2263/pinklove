import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { deleteProduct } from "@/features/products/server/service";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const slug = String(formData.get("slug") ?? "").trim();

  if (!slug) {
    return new NextResponse(null, {
      status: 303,
      headers: { Location: `${ROUTES.ADMIN.PRODUCT_LIST}?error=missing_slug` },
    });
  }

  await deleteProduct(slug);

  return new NextResponse(null, {
    status: 303,
    headers: { Location: `${ROUTES.ADMIN.PRODUCT_LIST}?deleted=1` },
  });
}
