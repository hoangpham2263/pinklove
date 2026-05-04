import { createProduct, getProductBySlug, getProductCategoryBySlug, updateProduct } from "@/features/products/server/service";
import type { ProductFulfillmentType, ProductOwnerType } from "@/features/products/types";
import { getSystemSettings } from "@/lib/system-settings";

export const runtime = "nodejs";

type ProductImportPayload = {
  mode?: "upsert" | "create" | "update";
  product?: {
    slug?: string;
    name?: string;
    categoryId?: string;
    categorySlug?: string;
    excerpt?: string;
    description?: string;
    status?: "draft" | "published";
    thumbnailUrl?: string;
    price?: number;
    fulfillmentType?: ProductFulfillmentType;
    trackInventory?: boolean;
    stockQuantity?: number;
    lowStockThreshold?: number;
    allowBackorder?: boolean;
    ownerType?: ProductOwnerType;
    ownerVendorUserId?: string;
    siteDefaults?: Record<string, unknown>;
    config?: Record<string, unknown>;
  };
};

function unauthorized(message: string, status = 401) {
  return Response.json({ ok: false, error: "unauthorized", message }, { status });
}

function badRequest(message: string) {
  return Response.json({ ok: false, error: "bad_request", message }, { status: 400 });
}

function getTokenFromRequest(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim();
  }

  return request.headers.get("x-internal-api-token")?.trim() ?? "";
}

export async function POST(request: Request) {
  const settings = await getSystemSettings();
  const apiSettings = settings.internalApis.productsImport;

  if (!apiSettings.enabled) {
    return unauthorized("API import sản phẩm đang tắt.", 403);
  }

  if (!apiSettings.token) {
    return unauthorized("API import sản phẩm chưa được cấu hình token.", 403);
  }

  const token = getTokenFromRequest(request);
  if (!token || token !== apiSettings.token) {
    return unauthorized("Token API nội bộ không hợp lệ.");
  }

  let payload: ProductImportPayload;
  try {
    payload = (await request.json()) as ProductImportPayload;
  } catch {
    return badRequest("Body phải là JSON hợp lệ.");
  }

  const mode = payload.mode ?? "upsert";
  const product = payload.product;
  if (!product) {
    return badRequest("Thiếu object `product` trong payload.");
  }

  const slug = String(product.slug ?? "").trim();
  const name = String(product.name ?? "").trim();
  const productType = "general_product";
  const templateKey = "general_product";
  const status = product.status === "published" ? "published" : apiSettings.defaultStatus;
  const fulfillmentType = (product.fulfillmentType ?? "physical") as ProductFulfillmentType;

  if (!slug || !name) {
    return badRequest("Thiếu `slug` hoặc `name`.");
  }

  let categoryId = String(product.categoryId ?? "").trim() || undefined;
  const categorySlug = String(product.categorySlug ?? "").trim();

  if (!categoryId && categorySlug) {
    const category = await getProductCategoryBySlug(categorySlug);
    if (!category) {
      return badRequest(`Không tìm thấy category với slug \`${categorySlug}\`.`);
    }
    categoryId = category.id;
  }

  const existing = await getProductBySlug(slug);
  if (existing && existing.productType !== "general_product") {
    return Response.json(
      {
        ok: false,
        error: "product_type_locked",
        message: "API import nội bộ chỉ cập nhật sản phẩm thường, không cập nhật coded hoặc builder template.",
      },
      { status: 409 }
    );
  }

  if (mode === "create" && existing) {
    return Response.json({ ok: false, error: "already_exists", message: "Sản phẩm đã tồn tại." }, { status: 409 });
  }
  if (mode === "update" && !existing) {
    return Response.json({ ok: false, error: "not_found", message: "Không tìm thấy sản phẩm để cập nhật." }, { status: 404 });
  }

  const baseConfig = product.config && typeof product.config === "object" ? product.config : {};
  const config =
    productType === "general_product"
      ? {
          ...baseConfig,
          generalProduct: {
            ownerType: product.ownerType === "vendor" ? "vendor" : "internal",
            vendorUserId:
              product.ownerType === "vendor" && product.ownerVendorUserId
                ? String(product.ownerVendorUserId)
                : undefined,
          },
        }
      : {
          ...baseConfig,
          siteDefaults:
            product.siteDefaults && typeof product.siteDefaults === "object" ? product.siteDefaults : {},
        };

  try {
    const saved = existing
      ? await updateProduct(slug, {
          slug,
          categoryId,
          name,
          excerpt: product.excerpt,
          description: product.description,
          status,
          productType,
          templateKey,
          thumbnailUrl: product.thumbnailUrl,
          price: typeof product.price === "number" ? product.price : 0,
          fulfillmentType,
          trackInventory: Boolean(product.trackInventory),
          stockQuantity: typeof product.stockQuantity === "number" ? product.stockQuantity : 0,
          lowStockThreshold: typeof product.lowStockThreshold === "number" ? product.lowStockThreshold : 0,
          allowBackorder: Boolean(product.allowBackorder),
          config,
        })
      : await createProduct({
          slug,
          categoryId,
          name,
          excerpt: product.excerpt,
          description: product.description,
          status,
          productType,
          templateKey,
          thumbnailUrl: product.thumbnailUrl,
          price: typeof product.price === "number" ? product.price : 0,
          fulfillmentType,
          trackInventory: Boolean(product.trackInventory),
          stockQuantity: typeof product.stockQuantity === "number" ? product.stockQuantity : 0,
          lowStockThreshold: typeof product.lowStockThreshold === "number" ? product.lowStockThreshold : 0,
          allowBackorder: Boolean(product.allowBackorder),
          config,
        });

    if (!saved) {
      return Response.json({ ok: false, error: "save_failed", message: "Không thể lưu sản phẩm." }, { status: 500 });
    }

    return Response.json({
      ok: true,
      action: existing ? "updated" : "created",
      product: {
        id: saved.id,
        slug: saved.slug,
        name: saved.name,
        productType: saved.productType,
        status: saved.status,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_TEMPLATE_KEY_IN_USE") {
      return Response.json(
        {
          ok: false,
          error: "template_in_use",
          message: "Template này đang được gắn với một sản phẩm khác.",
        },
        { status: 409 }
      );
    }
    if (error instanceof Error && error.message === "PRODUCT_TYPE_LOCKED") {
      return Response.json(
        {
          ok: false,
          error: "product_type_locked",
          message: "Loại sản phẩm đã cố định theo luồng tạo ban đầu.",
        },
        { status: 409 }
      );
    }

    console.error("Failed to import internal product:", error);
    return Response.json({ ok: false, error: "internal_error", message: "Không thể import sản phẩm." }, { status: 500 });
  }
}
