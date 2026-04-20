import { requireAdmin } from "@/lib/auth";
import { deleteProducts, updateProductsStatus } from "@/features/products/server/service";
import { ROUTES } from "@/lib/routes";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime = "nodejs";

type BulkAction = "publish" | "draft" | "delete";

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const action = String(formData.get("bulkAction") ?? "").trim() as BulkAction;
  const returnTo = String(formData.get("returnTo") ?? "").trim() || ROUTES.ADMIN.PRODUCT_LIST;
  const slugs = formData
    .getAll("slugs")
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (slugs.length === 0) {
    return respondError(request, { error: "missing_selection", message: "Hãy chọn ít nhất một sản phẩm.", location: `${returnTo}?error=missing_selection` });
  }

  if (!["publish", "draft", "delete"].includes(action)) {
    return respondError(request, { error: "invalid_bulk_action", message: "Tác vụ hàng loạt không hợp lệ.", location: `${returnTo}?error=invalid_bulk_action` });
  }

  if (action === "delete") {
    const count = await deleteProducts(slugs);
    return respondSuccess(request, { location: returnTo, message: `${count} sản phẩm đã bị xóa.`, data: { count, bulk: "deleted" } });
  }

  const count = await updateProductsStatus(slugs, action === "publish" ? "published" : "draft");
  return respondSuccess(request, {
    location: returnTo,
    message: `${count} sản phẩm đã chuyển sang ${action === "publish" ? "Published" : "Draft"}.`,
    data: { count, bulk: action },
  });
}
