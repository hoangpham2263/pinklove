import { createSupplierRequest } from "@/features/provider-offering-submissions/server/service";
import { respondError, respondSuccess } from "@/lib/action-response";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const provider = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const formData = await request.formData();
  const offeringId = String(formData.get("offeringId") ?? "").trim();

  if (!offeringId) {
    return respondError(request, {
      error: "missing_offering",
      message: "Thiếu mẫu cần xin cung cấp.",
      location: `${ROUTES.PROVIDER.AVAILABLE_TEMPLATES}?error=missing_offering`,
    });
  }

  try {
    await createSupplierRequest({
      offeringId,
      providerId: provider.id,
      purchaseCost: Math.max(0, Number(formData.get("purchaseCost") ?? "0")),
      providerSku: String(formData.get("providerSku") ?? ""),
      leadTimeDays: Math.max(0, Number(formData.get("leadTimeDays") ?? "0")),
      monthlyCapacity: Math.max(0, Number(formData.get("monthlyCapacity") ?? "0")),
      serviceArea: String(formData.get("serviceArea") ?? ""),
      sampleImageUrl: String(formData.get("sampleImageUrl") ?? ""),
      materialNote: String(formData.get("materialNote") ?? ""),
      qualityNote: String(formData.get("qualityNote") ?? ""),
      providerNote: String(formData.get("providerNote") ?? ""),
    });

    return respondSuccess(request, {
      location: `${ROUTES.PROVIDER.SUPPLY_REQUESTS}?submitted=1`,
      message: "Đã gửi yêu cầu cung cấp mẫu. Admin sẽ review chất lượng trước khi duyệt.",
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "request_failed";
    return respondError(request, {
      error: code,
      message:
        code === "OFFERING_NOT_AVAILABLE"
          ? "Mẫu này hiện chưa mở để provider xin cung cấp."
          : code === "SUPPLIER_ALREADY_EXISTS"
            ? "Bạn đã là supplier của mẫu này."
            : code === "SUPPLIER_REQUEST_ALREADY_OPEN"
              ? "Yêu cầu của bạn đang chờ admin review."
            : "Không thể gửi yêu cầu cung cấp mẫu.",
      location: `${ROUTES.PROVIDER.AVAILABLE_TEMPLATES}?error=${encodeURIComponent(code)}`,
    });
  }
}
