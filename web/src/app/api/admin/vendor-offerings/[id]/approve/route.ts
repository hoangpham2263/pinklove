import { respondError, respondSuccess } from "@/lib/action-response";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { approveVendorOfferingSubmission } from "@/features/vendor-offering-submissions/server/service";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const formData = await request.formData();
  const adminSellPrice = Math.max(0, Number(formData.get("adminSellPrice") ?? "0"));
  const reviewNote = String(formData.get("reviewNote") ?? "");
  const offeringOwnership =
    String(formData.get("offeringOwnership") ?? "platform") === "vendor_originated"
      ? "vendor_originated"
      : "platform";
  const assignVendorSupplier = formData.get("assignVendorSupplier") !== "off";

  if (!Number.isFinite(adminSellPrice)) {
    return respondError(request, {
      error: "invalid_price",
      message: "Giá bán admin không hợp lệ.",
      location: ROUTES.ADMIN.VENDOR_OFFERING(id),
    });
  }

  try {
    await approveVendorOfferingSubmission({
      submissionId: id,
      actorUserId: admin.id,
      adminSellPrice,
      reviewNote,
      offeringOwnership,
      assignVendorSupplier,
    });

    return respondSuccess(request, {
      location: ROUTES.ADMIN.VENDOR_OFFERING(id),
      message: "Đã duyệt và áp dụng sản phẩm vào catalog.",
    });
  } catch (error) {
    return respondError(request, {
      error: error instanceof Error ? error.message : "approve_failed",
      message: "Không thể duyệt hồ sơ sản phẩm.",
      location: ROUTES.ADMIN.VENDOR_OFFERING(id),
    });
  }
}
