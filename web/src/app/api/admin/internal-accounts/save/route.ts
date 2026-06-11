import { requireAdmin } from "@/lib/auth";
import { respondError, respondSuccess } from "@/lib/action-response";
import { createInternalAccount, updateInternalAccount } from "@/lib/internal-accounts";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

function parseSortOrder(value: FormDataEntryValue | null) {
  const parsed = Number(String(value ?? "").trim() || "0");
  return Number.isFinite(parsed) ? parsed : 0;
}

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
  const platform = String(formData.get("platform") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();

  if (!platform || !label) {
    return respondError(request, {
      error: "invalid_input",
      message: "Nền tảng và tên tài khoản là bắt buộc.",
      location: ROUTES.ADMIN.INTERNAL_ACCOUNTS,
    });
  }

  try {
    if (id) {
      const updated = await updateInternalAccount({
        id,
        platform,
        label,
        loginUsername: String(formData.get("loginUsername") ?? ""),
        loginPassword: String(formData.get("loginPassword") ?? ""),
        loginUrl: String(formData.get("loginUrl") ?? ""),
        notes: String(formData.get("notes") ?? ""),
        sortOrder: parseSortOrder(formData.get("sortOrder")),
      });

      if (!updated) {
        return respondError(request, {
          status: 404,
          error: "not_found",
          message: "Không tìm thấy tài khoản để cập nhật.",
          location: ROUTES.ADMIN.INTERNAL_ACCOUNTS,
        });
      }

      return respondSuccess(request, {
        location: ROUTES.ADMIN.INTERNAL_ACCOUNT(updated.id),
        message: "Đã cập nhật tài khoản nội bộ.",
      });
    }

    const created = await createInternalAccount({
      platform,
      label,
      loginUsername: String(formData.get("loginUsername") ?? ""),
      loginPassword: String(formData.get("loginPassword") ?? ""),
      loginUrl: String(formData.get("loginUrl") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      sortOrder: parseSortOrder(formData.get("sortOrder")),
    });

    return respondSuccess(request, {
      location: ROUTES.ADMIN.INTERNAL_ACCOUNT(created.id),
      message: "Đã thêm tài khoản nội bộ.",
    });
  } catch (error) {
    console.error("Failed to save internal account:", error);
    return respondError(request, {
      status: 500,
      error: "save_failed",
      message: "Không thể lưu tài khoản nội bộ lúc này.",
      location: ROUTES.ADMIN.INTERNAL_ACCOUNTS,
    });
  }
}
