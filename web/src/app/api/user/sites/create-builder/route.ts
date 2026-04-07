import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/auth";
import { getPublishedProductBySlugAndType } from "@/features/products/server/service";
import { ROUTES } from "@/lib/routes";
import { createBuilderWeddingSite, createWeddingSiteFromProduct } from "@/features/sites/server/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const formData = await request.formData();
  const productSlug = String(formData.get("productSlug") ?? "");

  const site = productSlug
    ? await (async () => {
        const product = await getPublishedProductBySlugAndType(productSlug, "builder_template");
        if (!product) {
          return null;
        }

        return createWeddingSiteFromProduct({
          userId: user.id,
          product,
        });
      })()
    : await createBuilderWeddingSite(user.id);

  if (!site) {
    return new NextResponse(null, {
      status: 303,
      headers: { Location: `${ROUTES.BUILDER}?error=product_not_found` },
    });
  }

  return new NextResponse(null, {
    status: 303,
    headers: { Location: ROUTES.USER.DESIGN(site.id) },
  });
}
