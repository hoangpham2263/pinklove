import { requireAdmin } from "@/lib/auth";
import { deleteProductCategories, updateProductCategoriesStatus } from "@/features/products/server/service";
import { ROUTES } from "@/lib/routes";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime = "nodejs";

type BulkAction = "publish" | "draft" | "delete";

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const action = String(formData.get("bulkAction") ?? "").trim() as BulkAction;
  const slugs = formData
    .getAll("slugs")
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (slugs.length === 0) {
    return respondError(request, {
      error: "missing_selection",
      message: "Hãy chọn ít nhất một product category.",
      location: `${ROUTES.ADMIN.PRODUCT_CATEGORIES}?error=missing_selection`,
    });
  }

  if (!["publish", "draft", "delete"].includes(action)) {
    return respondError(request, {
      error: "invalid_bulk_action",
      message: "Tác vụ hàng loạt không hợp lệ.",
      location: `${ROUTES.ADMIN.PRODUCT_CATEGORIES}?error=invalid_bulk_action`,
    });
  }

  if (action === "delete") {
    const count = await deleteProductCategories(slugs);
    return respondSuccess(request, {
      location: ROUTES.ADMIN.PRODUCT_CATEGORIES,
      message: `${count} product category đã bị xóa.`,
      data: { count, bulk: "deleted" },
    });
  }

  const count = await updateProductCategoriesStatus(slugs, action === "publish" ? "published" : "draft");
  return respondSuccess(request, {
    location: ROUTES.ADMIN.PRODUCT_CATEGORIES,
    message: `${count} product category đã chuyển sang ${action === "publish" ? "Published" : "Draft"}.`,
    data: { count, bulk: action },
  });
}
