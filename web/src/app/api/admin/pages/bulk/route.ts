import { requireAdmin } from "@/lib/auth";
import { updateManagedPage } from "@/lib/managed-pages";
import { ROUTES } from "@/lib/routes";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const bulkAction = String(formData.get("bulkAction") ?? "").trim();
  const slugs = formData
    .getAll("slugs")
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (slugs.length === 0) {
    return respondError(request, { error: "missing_selection", message: "Hãy chọn ít nhất một trang.", location: `${ROUTES.ADMIN.PAGES}?error=missing_selection` });
  }

  if (!["published", "draft"].includes(bulkAction)) {
    return respondError(request, { error: "invalid_bulk_action", message: "Tác vụ hàng loạt không hợp lệ.", location: `${ROUTES.ADMIN.PAGES}?error=invalid_bulk_action` });
  }

  try {
    for (const slug of slugs) {
      await updateManagedPage(slug, { status: bulkAction });
    }

    return respondSuccess(request, {
      location: ROUTES.ADMIN.PAGES,
      message: `${slugs.length} trang đã chuyển sang ${bulkAction === "published" ? "Published" : "Draft"}.`,
      data: { count: slugs.length, bulk: bulkAction },
    });
  } catch (error) {
    console.error("Failed to apply bulk page action:", error);
    return respondError(request, { error: "bulk_failed", message: "Không thể áp dụng tác vụ hàng loạt cho trang.", location: `${ROUTES.ADMIN.PAGES}?error=bulk_failed` });
  }
}
