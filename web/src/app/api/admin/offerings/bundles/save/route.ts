import { revalidatePath } from "next/cache";

import { respondError, respondSuccess } from "@/lib/action-response";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { slugify } from "@/lib/utils";
import { saveOfferingBundle, type OfferingBundleStatus } from "@/features/offerings/server/bundles";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const currentSlug = slugify(String(formData.get("currentSlug") ?? ""));
  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? name));
  const rawStatus = String(formData.get("status") ?? "draft");
  const status: OfferingBundleStatus = rawStatus === "published" || rawStatus === "archived" ? rawStatus : "draft";
  const selectedOfferingIds = formData
    .getAll("offeringIds")
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (!name || !slug) {
    return respondError(request, {
      error: "bundle_name_required",
      message: "Vui lòng nhập tên combo.",
      location: currentSlug ? ROUTES.ADMIN.OFFERING_BUNDLE(currentSlug) : ROUTES.ADMIN.OFFERING_BUNDLE_NEW,
    });
  }

  if (selectedOfferingIds.length === 0) {
    return respondError(request, {
      error: "bundle_items_required",
      message: "Vui lòng chọn ít nhất một dịch vụ/sản phẩm cho combo.",
      location: currentSlug ? ROUTES.ADMIN.OFFERING_BUNDLE(currentSlug) : ROUTES.ADMIN.OFFERING_BUNDLE_NEW,
    });
  }

  const price = Number(formData.get("price") ?? "0");
  const items = selectedOfferingIds.map((offeringId, index) => {
    const quantity = Number(formData.get(`quantity_${offeringId}`) ?? "1");

    return {
      offeringId,
      quantity: Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1,
      sortOrder: index,
    };
  });

  await saveOfferingBundle({
    slug,
    name,
    description: String(formData.get("description") ?? "").trim(),
    status,
    price: Number.isFinite(price) && price >= 0 ? price : 0,
    currency: String(formData.get("currency") ?? "VND").trim() || "VND",
    items,
  }, currentSlug || undefined);

  revalidatePath(ROUTES.ADMIN.OFFERING_BUNDLES);
  revalidatePath(ROUTES.ADMIN.OFFERING_BUNDLE(slug));

  return respondSuccess(request, {
    location: ROUTES.ADMIN.OFFERING_BUNDLE(slug),
    message: "Đã lưu combo.",
  });
}
