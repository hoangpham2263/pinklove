import { requireAdmin } from "@/lib/auth";
import { deleteOffering } from "@/features/offerings/server/service";
import { ROUTES } from "@/lib/routes";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const slug = String(formData.get("slug") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? "").trim() || ROUTES.ADMIN.OFFERING_LIST;

  if (!slug) {
    return respondError(request, { error: "missing_slug", message: "Thiếu slug sản phẩm để xóa.", location: `${returnTo}?error=missing_slug` });
  }

  try {
    await deleteOffering(slug);
  } catch (error) {
    if (error instanceof Error && error.message === "SYSTEM_TEMPLATE_DELETE_BLOCKED") {
      return respondError(request, {
        error: "system_template_delete_blocked",
        message: "Mẫu hệ thống là template gốc trong code, không thể xóa từ admin.",
        location: `${returnTo}?error=system_template_delete_blocked`,
      });
    }

    throw error;
  }

  return respondSuccess(request, { location: returnTo, message: "Đã xóa sản phẩm." });
}
