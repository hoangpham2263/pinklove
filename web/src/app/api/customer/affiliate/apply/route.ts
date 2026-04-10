import { requireAppUser } from "@/lib/auth";
import { applyForAffiliate } from "@/features/affiliate/server/service";
import { ROUTES } from "@/lib/routes";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const formData = await request.formData();
  const preferredCode = String(formData.get("preferredCode") ?? "");

  try {
    await applyForAffiliate({
      userId: user.id,
      username: user.username,
      preferredCode,
    });
    return respondSuccess(request, {
      location: ROUTES.CUSTOMER.AFFILIATE,
      message: "Yêu cầu tham gia affiliate đã được gửi. Admin cần duyệt trước khi link của bạn hoạt động.",
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "apply_failed";
    const message =
      code === "AFFILIATE_ALREADY_EXISTS"
        ? "Tài khoản này đã đăng ký affiliate rồi."
        : code === "AFFILIATE_CODE_TAKEN"
          ? "Mã affiliate đã được sử dụng."
          : code === "AFFILIATE_CODE_INVALID"
            ? "Mã affiliate chưa hợp lệ. Cần tối thiểu 3 ký tự a-z, 0-9 hoặc dấu gạch ngang."
            : "Không thể xử lý yêu cầu affiliate lúc này.";
    return respondError(request, {
      error: code,
      message,
      location: `${ROUTES.CUSTOMER.AFFILIATE}?error=${encodeURIComponent(code)}`,
    });
  }
}
