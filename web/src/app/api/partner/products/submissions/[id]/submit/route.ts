import { respondError, respondSuccess } from "@/lib/action-response";
import { requireVendor } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { submitVendorProductSubmission } from "@/features/vendor-product-submissions/server/service";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const vendor = await requireVendor(ROUTES.PARTNER.LOGIN);
  const { id } = await params;

  try {
    await submitVendorProductSubmission(vendor.id, id);
    return respondSuccess(request, {
      location: ROUTES.PARTNER.PRODUCT(id),
      message: "Đã gửi duyệt sản phẩm.",
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "unknown_error";
    const message =
      code === "SUBMISSION_LOCKED"
        ? "Hồ sơ này không thể gửi duyệt ở trạng thái hiện tại."
        : "Không thể gửi duyệt sản phẩm.";

    return respondError(request, {
      error: code,
      message,
      location: ROUTES.PARTNER.PRODUCT(id),
    });
  }
}
