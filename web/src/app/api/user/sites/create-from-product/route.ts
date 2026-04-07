import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/auth";
import { getProductBySlug } from "@/features/products/server/service";
import { ROUTES } from "@/lib/routes";
import { createWeddingSiteFromProduct } from "@/features/sites/server/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const formData = await request.formData();
  const productSlug = String(formData.get("productSlug") ?? "");
  const product = await getProductBySlug(productSlug);

  if (!product || product.status !== "published") {
    return new NextResponse(null, {
      status: 303,
      headers: { Location: "/templates?error=product_not_found" },
    });
  }

  const site = await createWeddingSiteFromProduct({
    userId: user.id,
    product,
  });

  return new NextResponse(null, {
    status: 303,
    headers: { Location: `${ROUTES.USER.SITES}/${site.id}` },
  });
}
