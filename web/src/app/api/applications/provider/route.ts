import { respondError, respondSuccess } from "@/lib/action-response";
import { ROUTES } from "@/lib/routes";
import { createProviderApplication } from "@/features/provider-applications/server/service";
import { getCurrentUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return respondError(request, {
      status: 401,
      error: "UNAUTHORIZED",
      message: "Vui lòng đăng nhập trước khi gửi hồ sơ provider.",
      location: `${ROUTES.AUTH.LOGIN}?returnTo=${encodeURIComponent(ROUTES.CUSTOMER.PROVIDER_APPLY)}`,
    });
  }

  const formData = await request.formData();
  const returnTo = String(formData.get("returnTo") ?? "").trim();
  const locationBase = returnTo.startsWith("/") && !returnTo.startsWith("//") && !returnTo.startsWith("/api/")
    ? returnTo
    : ROUTES.CUSTOMER.PROVIDER_APPLY;

  try {
    await createProviderApplication({
      userId: user.id,
      companyName: String(formData.get("companyName") ?? ""),
      contactName: String(formData.get("contactName") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? ""),
      city: String(formData.get("city") ?? ""),
      categories: String(formData.get("categories") ?? ""),
      website: String(formData.get("website") ?? ""),
      experience: String(formData.get("experience") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    });

    return respondSuccess(request, {
      location: `${locationBase}?submitted=1`,
      message: "Đã gửi hồ sơ đăng ký đối tác. Đội ngũ quản trị sẽ liên hệ lại sau khi review.",
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "apply_failed";
    const message =
      code === "MISSING_REQUIRED_FIELDS"
        ? "Vui lòng điền đủ các trường bắt buộc."
        : code === "INVALID_EMAIL"
          ? "Email chưa đúng định dạng."
          : code === "APPLICATION_ALREADY_EXISTS"
            ? "Email này đã có hồ sơ đăng ký đang được xử lý."
            : "Không thể gửi hồ sơ đăng ký lúc này.";

    return respondError(request, {
      error: code,
      message,
      location: `${locationBase}?error=${encodeURIComponent(code)}`,
    });
  }
}
