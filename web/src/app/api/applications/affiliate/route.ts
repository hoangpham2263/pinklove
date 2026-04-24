import { respondError, respondSuccess } from "@/lib/action-response";
import { ROUTES } from "@/lib/routes";
import { createAffiliateApplication } from "@/features/affiliate-applications/server/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();

  try {
    await createAffiliateApplication({
      fullName: String(formData.get("fullName") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? ""),
      preferredCode: String(formData.get("preferredCode") ?? ""),
      city: String(formData.get("city") ?? ""),
      channelLink: String(formData.get("channelLink") ?? ""),
      audienceNote: String(formData.get("audienceNote") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    });

    return respondSuccess(request, {
      location: `${ROUTES.AFFILIATE_APPLY}?submitted=1`,
      message: "Đã gửi yêu cầu affiliate. Đội ngũ quản trị sẽ review và liên hệ lại sau khi kiểm tra.",
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "apply_failed";
    const message =
      code === "MISSING_REQUIRED_FIELDS"
        ? "Vui lòng điền đủ các trường bắt buộc."
        : code === "INVALID_EMAIL"
          ? "Email chưa đúng định dạng."
          : code === "AFFILIATE_CODE_INVALID"
            ? "Mã affiliate chưa hợp lệ. Cần tối thiểu 3 ký tự a-z, 0-9 hoặc dấu gạch ngang."
            : code === "AFFILIATE_CODE_TAKEN"
              ? "Mã affiliate mong muốn đã được sử dụng."
              : code === "APPLICATION_ALREADY_EXISTS"
                ? "Email này đã có hồ sơ affiliate đang được xử lý."
                : "Không thể gửi yêu cầu affiliate lúc này.";

    return respondError(request, {
      error: code,
      message,
      location: `${ROUTES.AFFILIATE_APPLY}?error=${encodeURIComponent(code)}`,
    });
  }
}
