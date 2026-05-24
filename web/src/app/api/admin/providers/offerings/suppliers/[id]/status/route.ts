import { updateOfferingProviderSupplierStatus } from "@/features/provider-offering-submissions/server/service";
import type { OfferingProviderSupplierStatus } from "@/features/provider-offering-submissions/types";
import { respondError, respondSuccess } from "@/lib/action-response";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

const ALLOWED_STATUSES = new Set<OfferingProviderSupplierStatus>(["active", "paused", "suspended", "revoked"]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const formData = await request.formData();
  const nextStatus = String(formData.get("nextStatus") ?? "").trim() as OfferingProviderSupplierStatus;
  const reviewNote = String(formData.get("reviewNote") ?? "");

  if (!ALLOWED_STATUSES.has(nextStatus)) {
    return respondError(request, {
      error: "invalid_status",
      message: "Trạng thái supplier không hợp lệ.",
      location: `${ROUTES.ADMIN.PROVIDER_OFFERINGS}?tab=suppliers`,
    });
  }

  try {
    await updateOfferingProviderSupplierStatus({
      supplierId: id,
      actorUserId: admin.id,
      nextStatus,
      reviewNote,
    });

    return respondSuccess(request, {
      location: `${ROUTES.ADMIN.PROVIDER_OFFERINGS}?tab=suppliers`,
      message: "Đã cập nhật trạng thái supplier.",
    });
  } catch (error) {
    return respondError(request, {
      error: error instanceof Error ? error.message : "supplier_status_failed",
      message: "Không thể cập nhật trạng thái supplier.",
      location: `${ROUTES.ADMIN.PROVIDER_OFFERINGS}?tab=suppliers`,
    });
  }
}
