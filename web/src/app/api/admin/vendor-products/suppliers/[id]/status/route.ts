import { updateProductVendorSupplierStatus } from "@/features/vendor-product-submissions/server/service";
import type { ProductVendorSupplierStatus } from "@/features/vendor-product-submissions/types";
import { respondError, respondSuccess } from "@/lib/action-response";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

const ALLOWED_STATUSES = new Set<ProductVendorSupplierStatus>(["active", "paused", "suspended", "revoked"]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const formData = await request.formData();
  const nextStatus = String(formData.get("nextStatus") ?? "").trim() as ProductVendorSupplierStatus;
  const reviewNote = String(formData.get("reviewNote") ?? "");

  if (!ALLOWED_STATUSES.has(nextStatus)) {
    return respondError(request, {
      error: "invalid_status",
      message: "Trạng thái supplier không hợp lệ.",
      location: `${ROUTES.ADMIN.VENDOR_PRODUCTS}?tab=suppliers`,
    });
  }

  try {
    await updateProductVendorSupplierStatus({
      supplierId: id,
      actorUserId: admin.id,
      nextStatus,
      reviewNote,
    });

    return respondSuccess(request, {
      location: `${ROUTES.ADMIN.VENDOR_PRODUCTS}?tab=suppliers`,
      message: "Đã cập nhật trạng thái supplier.",
    });
  } catch (error) {
    return respondError(request, {
      error: error instanceof Error ? error.message : "supplier_status_failed",
      message: "Không thể cập nhật trạng thái supplier.",
      location: `${ROUTES.ADMIN.VENDOR_PRODUCTS}?tab=suppliers`,
    });
  }
}
