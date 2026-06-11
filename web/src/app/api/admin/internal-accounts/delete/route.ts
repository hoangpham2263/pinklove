import { requireAdmin } from "@/lib/auth";
import { respondError, respondSuccess } from "@/lib/action-response";
import { deleteInternalAccount } from "@/lib/internal-accounts";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return respondError(request, {
      status: 401,
      error: "UNAUTHORIZED",
      message: "Vui lòng đăng nhập admin.",
      location: ROUTES.ADMIN.LOGIN,
    });
  }

  const formData = await request.formData();
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    return respondError(request, {
      error: "invalid_input",
      message: "Thiếu mã tài khoản cần xóa.",
      location: ROUTES.ADMIN.INTERNAL_ACCOUNTS,
    });
  }

  try {
    const deleted = await deleteInternalAccount(id);
    if (!deleted) {
      return respondError(request, {
        status: 404,
        error: "not_found",
        message: "Không tìm thấy tài khoản để xóa.",
        location: ROUTES.ADMIN.INTERNAL_ACCOUNTS,
      });
    }

    return respondSuccess(request, {
      location: ROUTES.ADMIN.INTERNAL_ACCOUNTS,
      message: "Đã xóa tài khoản nội bộ.",
    });
  } catch (error) {
    console.error("Failed to delete internal account:", error);
    return respondError(request, {
      status: 500,
      error: "delete_failed",
      message: "Không thể xóa tài khoản nội bộ lúc này.",
      location: ROUTES.ADMIN.INTERNAL_ACCOUNTS,
    });
  }
}
