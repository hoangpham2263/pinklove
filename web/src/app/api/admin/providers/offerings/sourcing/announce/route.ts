import { announceProviderSupplySourcing } from "@/features/provider-offering-submissions/server/service";
import { respondError, respondSuccess } from "@/lib/action-response";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  const formData = await request.formData();
  const offeringId = String(formData.get("offeringId") ?? "").trim();
  const note = String(formData.get("note") ?? "");

  if (!offeringId) {
    return respondError(request, {
      error: "missing_offering",
      message: "Thiếu sản phẩm cần tìm nguồn hàng.",
      location: `${ROUTES.ADMIN.PROVIDER_SOURCING_OFFERINGS}?error=missing_offering`,
    });
  }

  try {
    await announceProviderSupplySourcing({
      offeringId,
      actorUserId: admin.id,
      note,
    });

    return respondSuccess(request, {
      location: ROUTES.ADMIN.PROVIDER_SOURCING_OFFERINGS,
      message: "Đã thông báo tìm nguồn hàng cho provider.",
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "announce_failed";

    return respondError(request, {
      error: code,
      message: "Không thể thông báo tìm nguồn hàng.",
      location: `${ROUTES.ADMIN.PROVIDER_SOURCING_OFFERINGS}?error=${encodeURIComponent(code)}`,
    });
  }
}
