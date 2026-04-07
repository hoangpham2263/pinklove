import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createProduct } from "@/features/products/server/service";
import { ROUTES } from "@/lib/routes";
import {
  getWeddingTemplateDefaults,
  getWeddingTemplateProductType,
} from "@/features/sites/templates";
import type { ProductType } from "@/features/products/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const productType = String(formData.get("productType") ?? "coded_template") as ProductType;
  const templateKey = String(formData.get("templateKey") ?? "").trim();

  if (!name || !slug || !templateKey) {
    return new NextResponse(null, {
      status: 303,
      headers: { Location: `${ROUTES.ADMIN.PRODUCTS}?error=missing_fields` },
    });
  }

  if (getWeddingTemplateProductType(templateKey) !== productType) {
    return new NextResponse(null, {
      status: 303,
      headers: { Location: `${ROUTES.ADMIN.PRODUCTS}?error=invalid_template` },
    });
  }

  try {
    const product = await createProduct({
      slug,
      name,
      productType,
      templateKey,
      status: "draft",
      config: {
        siteDefaults: getWeddingTemplateDefaults(templateKey),
      },
    });

    return new NextResponse(null, {
      status: 303,
      headers: { Location: ROUTES.ADMIN.PRODUCT(product.slug) },
    });
  } catch (error) {
    console.error("Failed to create product:", error);
    return new NextResponse(null, {
      status: 303,
      headers: { Location: `${ROUTES.ADMIN.PRODUCTS}?error=create_failed` },
    });
  }
}
