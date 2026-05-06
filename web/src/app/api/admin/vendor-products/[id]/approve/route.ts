import { respondError, respondSuccess } from "@/lib/action-response";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { approveVendorProductSubmission } from "@/features/vendor-product-submissions/server/service";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const formData = await request.formData();
  const adminSellPrice = Math.max(0, Number(formData.get("adminSellPrice") ?? "0"));
  const reviewNote = String(formData.get("reviewNote") ?? "");
  const productOwnership =
    String(formData.get("productOwnership") ?? "platform") === "vendor_originated"
      ? "vendor_originated"
      : "platform";
  const assignVendorSupplier = formData.get("assignVendorSupplier") !== "off";

  if (!Number.isFinite(adminSellPrice)) {
    return respondError(request, {
      error: "invalid_price",
      message: "Giá bán admin không hợp lệ.",
      location: ROUTES.ADMIN.VENDOR_PRODUCT(id),
    });
  }

  try {
    await approveVendorProductSubmission({
      submissionId: id,
      actorUserId: admin.id,
      adminSellPrice,
      reviewNote,
      productOwnership,
      assignVendorSupplier,
    });

    return respondSuccess(request, {
      location: ROUTES.ADMIN.VENDOR_PRODUCT(id),
      message: "Đã duyệt và áp dụng sản phẩm vào catalog.",
    });
  } catch (error) {
    return respondError(request, {
      error: error instanceof Error ? error.message : "approve_failed",
      message: "Không thể duyệt hồ sơ sản phẩm.",
      location: ROUTES.ADMIN.VENDOR_PRODUCT(id),
    });
  }
}
