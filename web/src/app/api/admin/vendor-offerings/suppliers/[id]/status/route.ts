import { updateOfferingVendorSupplierStatus } from "@/features/vendor-offering-submissions/server/service";
import type { OfferingVendorSupplierStatus } from "@/features/vendor-offering-submissions/types";
import { respondError, respondSuccess } from "@/lib/action-response";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

const ALLOWED_STATUSES = new Set<OfferingVendorSupplierStatus>(["active", "paused", "suspended", "revoked"]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const formData = await request.formData();
  const nextStatus = String(formData.get("nextStatus") ?? "").trim() as OfferingVendorSupplierStatus;
  const reviewNote = String(formData.get("reviewNote") ?? "");

  if (!ALLOWED_STATUSES.has(nextStatus)) {
    return respondError(request, {
      error: "invalid_status",
      message: "Trạng thái supplier không hợp lệ.",
      location: `${ROUTES.ADMIN.VENDOR_OFFERINGS}?tab=suppliers`,
    });
  }

  try {
    await updateOfferingVendorSupplierStatus({
      supplierId: id,
      actorUserId: admin.id,
      nextStatus,
      reviewNote,
    });

    return respondSuccess(request, {
      location: `${ROUTES.ADMIN.VENDOR_OFFERINGS}?tab=suppliers`,
      message: "Đã cập nhật trạng thái supplier.",
    });
  } catch (error) {
    return respondError(request, {
      error: error instanceof Error ? error.message : "supplier_status_failed",
      message: "Không thể cập nhật trạng thái supplier.",
      location: `${ROUTES.ADMIN.VENDOR_OFFERINGS}?tab=suppliers`,
    });
  }
}
