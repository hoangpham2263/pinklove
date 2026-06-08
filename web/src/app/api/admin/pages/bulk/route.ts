import { requireAdmin } from "@/lib/auth";
import { updateManagedPage } from "@/lib/managed-pages";
import { ROUTES } from "@/lib/routes";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime = "nodejs";

function normalizeBulkAction(input: string) {
  const normalized = input.trim().toLowerCase();

  switch (normalized) {
    case "published":
    case "draft":
    case "admin_used":
    case "admin_unused":
      return normalized;
    case "admin_checked":
    case "checked":
    case "used":
    case "đã sử dụng":
    case "da su dung":
    case "đánh dấu đã sử dụng":
    case "danh dau da su dung":
      return "admin_used";
    case "admin_unchecked":
    case "unchecked":
    case "unused":
    case "chưa sử dụng":
    case "chua su dung":
    case "bỏ đánh dấu đã sử dụng":
    case "bo danh dau da su dung":
      return "admin_unused";
    default:
      return normalized;
  }
}

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const bulkAction = String(formData.get("bulkAction") ?? "").trim();
  const normalizedBulkAction = normalizeBulkAction(bulkAction);
  const slugs = formData
    .getAll("slugs")
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (slugs.length === 0) {
    return respondError(request, { error: "missing_selection", message: "Hãy chọn ít nhất một trang.", location: `${ROUTES.ADMIN.PAGES}?error=missing_selection` });
  }

  if (!["published", "draft", "admin_used", "admin_unused"].includes(normalizedBulkAction)) {
    return respondError(request, { error: "invalid_bulk_action", message: "Tác vụ hàng loạt không hợp lệ.", location: `${ROUTES.ADMIN.PAGES}?error=invalid_bulk_action` });
  }

  try {
    for (const slug of slugs) {
      if (normalizedBulkAction === "admin_used") {
        await updateManagedPage(slug, { adminUsed: true });
      } else if (normalizedBulkAction === "admin_unused") {
        await updateManagedPage(slug, { adminUsed: false });
      } else {
        await updateManagedPage(slug, { status: normalizedBulkAction });
      }
    }

    const actionLabel =
      normalizedBulkAction === "published"
        ? "Published"
        : normalizedBulkAction === "draft"
          ? "Draft"
          : normalizedBulkAction === "admin_used"
            ? "Used"
            : "Unused";

    return respondSuccess(request, {
      location: ROUTES.ADMIN.PAGES,
      message: `${slugs.length} trang đã chuyển sang ${actionLabel}.`,
      data: { count: slugs.length, bulk: normalizedBulkAction },
    });
  } catch (error) {
    console.error("Failed to apply bulk page action:", error);
    return respondError(request, { error: "bulk_failed", message: "Không thể áp dụng tác vụ hàng loạt cho trang.", location: `${ROUTES.ADMIN.PAGES}?error=bulk_failed` });
  }
}
