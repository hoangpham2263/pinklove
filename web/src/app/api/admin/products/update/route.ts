import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { updateProduct } from "@/features/products/server/service";
import { ROUTES } from "@/lib/routes";
import { getWeddingTemplateProductType } from "@/features/sites/templates/registry";
import type { ProductType } from "@/features/products/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const originalSlug = String(formData.get("originalSlug") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "");
  const description = String(formData.get("description") ?? "");
  const status = String(formData.get("status") ?? "draft") as "draft" | "published";
  const productType = String(formData.get("productType") ?? "coded_template") as ProductType;
  const templateKey = String(formData.get("templateKey") ?? "").trim();
  const thumbnailUrl = String(formData.get("thumbnailUrl") ?? "").trim();
  const price = Number(formData.get("price") ?? "0");
  const siteDefaultsRaw = String(formData.get("siteDefaults") ?? "{}");

  if (!originalSlug || !slug || !name || !templateKey) {
    return new NextResponse(null, {
      status: 303,
      headers: { Location: `${ROUTES.ADMIN.PRODUCT(originalSlug)}?error=missing_fields` },
    });
  }

  if (getWeddingTemplateProductType(templateKey) !== productType) {
    return new NextResponse(null, {
      status: 303,
      headers: { Location: `${ROUTES.ADMIN.PRODUCT(originalSlug)}?error=invalid_template` },
    });
  }

  const siteDefaults = JSON.parse(siteDefaultsRaw) as Record<string, unknown>;
  const product = await updateProduct(originalSlug, {
    slug,
    name,
    excerpt,
    description,
    status,
    productType,
    templateKey,
    thumbnailUrl,
    price,
    config: {
      siteDefaults,
    },
  });

  if (!product) {
    return new NextResponse(null, {
      status: 303,
      headers: { Location: `${ROUTES.ADMIN.PRODUCTS}?error=product_not_found` },
    });
  }

  return new NextResponse(null, {
    status: 303,
    headers: { Location: `${ROUTES.ADMIN.PRODUCT(product.slug)}?saved=1` },
  });
}
