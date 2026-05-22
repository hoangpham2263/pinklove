import { createOffering, getOfferingBySlug, getOfferingCategoryBySlug, updateOffering } from "@/features/offerings/server/service";
import type { OfferingFulfillmentType, OfferingOwnerType } from "@/features/offerings/types";
import { getSystemSettings } from "@/lib/system-settings";

export const runtime = "nodejs";

type OfferingImportPayload = {
  mode?: "upsert" | "create" | "update";
  offering?: {
    slug?: string;
    name?: string;
    categoryId?: string;
    categorySlug?: string;
    excerpt?: string;
    description?: string;
    status?: "draft" | "published";
    thumbnailUrl?: string;
    price?: number;
    fulfillmentType?: OfferingFulfillmentType;
    trackInventory?: boolean;
    stockQuantity?: number;
    lowStockThreshold?: number;
    allowBackorder?: boolean;
    costPrice?: number;
    vendorSku?: string;
    allowVendorSupply?: boolean;
    ownerType?: OfferingOwnerType;
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
  const apiSettings = settings.internalApis.offeringsImport;

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

  let payload: OfferingImportPayload;
  try {
    payload = (await request.json()) as OfferingImportPayload;
  } catch {
    return badRequest("Body phải là JSON hợp lệ.");
  }

  const mode = payload.mode ?? "upsert";
  const offering = payload.offering;
  if (!offering) {
    return badRequest("Thiếu object `offering` trong payload.");
  }

  const slug = String(offering.slug ?? "").trim();
  const name = String(offering.name ?? "").trim();
  const offeringType = "physical_product";
  const templateKey = "physical_product";
  const status = offering.status === "published" ? "published" : apiSettings.defaultStatus;
  const fulfillmentType = (offering.fulfillmentType ?? "physical") as OfferingFulfillmentType;

  if (!slug || !name) {
    return badRequest("Thiếu `slug` hoặc `name`.");
  }

  let categoryId = String(offering.categoryId ?? "").trim() || undefined;
  const categorySlug = String(offering.categorySlug ?? "").trim();

  if (!categoryId && categorySlug) {
    const category = await getOfferingCategoryBySlug(categorySlug);
    if (!category) {
      return badRequest(`Không tìm thấy category với slug \`${categorySlug}\`.`);
    }
    categoryId = category.id;
  }

  const existing = await getOfferingBySlug(slug);
  if (existing && existing.offeringType !== "physical_product") {
    return Response.json(
      {
        ok: false,
        error: "offering_type_locked",
        message: "API import nội bộ chỉ cập nhật sản phẩm thường, không cập nhật coded hoặc builder.",
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

  const baseConfig = offering.config && typeof offering.config === "object" ? { ...offering.config } : {};
  delete baseConfig.generalOffering;
  delete baseConfig.vendorSupply;
  const config =
    offeringType === "physical_product"
      ? baseConfig
      : {
          ...baseConfig,
          siteDefaults:
            offering.siteDefaults && typeof offering.siteDefaults === "object" ? offering.siteDefaults : {},
        };

  try {
    const saved = existing
      ? await updateOffering(slug, {
          slug,
          categoryId,
          name,
          excerpt: offering.excerpt,
          description: offering.description,
          status,
          offeringType,
          templateKey,
          thumbnailUrl: offering.thumbnailUrl,
          price: typeof offering.price === "number" ? offering.price : 0,
          fulfillmentType,
          trackInventory: Boolean(offering.trackInventory),
          stockQuantity: typeof offering.stockQuantity === "number" ? offering.stockQuantity : 0,
          lowStockThreshold: typeof offering.lowStockThreshold === "number" ? offering.lowStockThreshold : 0,
          allowBackorder: Boolean(offering.allowBackorder),
          costPrice: typeof offering.costPrice === "number" ? offering.costPrice : 0,
          vendorSku: typeof offering.vendorSku === "string" ? offering.vendorSku : "",
          allowVendorSupply: Boolean(offering.allowVendorSupply),
          ownerType: offering.ownerType === "vendor" ? "vendor" : "internal",
          ownerVendorUserId: offering.ownerType === "vendor" ? String(offering.ownerVendorUserId ?? "") : undefined,
          config,
        })
      : await createOffering({
          slug,
          categoryId,
          name,
          excerpt: offering.excerpt,
          description: offering.description,
          status,
          offeringType,
          templateKey,
          thumbnailUrl: offering.thumbnailUrl,
          price: typeof offering.price === "number" ? offering.price : 0,
          fulfillmentType,
          trackInventory: Boolean(offering.trackInventory),
          stockQuantity: typeof offering.stockQuantity === "number" ? offering.stockQuantity : 0,
          lowStockThreshold: typeof offering.lowStockThreshold === "number" ? offering.lowStockThreshold : 0,
          allowBackorder: Boolean(offering.allowBackorder),
          costPrice: typeof offering.costPrice === "number" ? offering.costPrice : 0,
          vendorSku: typeof offering.vendorSku === "string" ? offering.vendorSku : "",
          allowVendorSupply: Boolean(offering.allowVendorSupply),
          ownerType: offering.ownerType === "vendor" ? "vendor" : "internal",
          ownerVendorUserId: offering.ownerType === "vendor" ? String(offering.ownerVendorUserId ?? "") : undefined,
          config,
        });

    if (!saved) {
      return Response.json({ ok: false, error: "save_failed", message: "Không thể lưu sản phẩm." }, { status: 500 });
    }

    return Response.json({
      ok: true,
      action: existing ? "updated" : "created",
      offering: {
        id: saved.id,
        slug: saved.slug,
        name: saved.name,
        offeringType: saved.offeringType,
        status: saved.status,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "OFFERING_TEMPLATE_KEY_IN_USE") {
      return Response.json(
        {
          ok: false,
          error: "template_in_use",
          message: "Template này đang được gắn với một sản phẩm khác.",
        },
        { status: 409 }
      );
    }
    if (error instanceof Error && error.message === "OFFERING_TYPE_LOCKED") {
      return Response.json(
        {
          ok: false,
          error: "offering_type_locked",
          message: "Loại sản phẩm đã cố định theo luồng tạo ban đầu.",
        },
        { status: 409 }
      );
    }

    console.error("Failed to import internal offering:", error);
    return Response.json({ ok: false, error: "internal_error", message: "Không thể import sản phẩm." }, { status: 500 });
  }
}
