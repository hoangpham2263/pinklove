import { respondError, respondSuccess } from "@/lib/action-response";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { reviewVendorProductSubmission } from "@/features/vendor-product-submissions/server/service";

export const runtime = "nodejs";

type ReviewActionStatus = "under_review" | "changes_requested" | "rejected" | "archived";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const formData = await request.formData();
  const nextStatus = String(formData.get("nextStatus") ?? "").trim() as ReviewActionStatus;
  const reviewNote = String(formData.get("reviewNote") ?? "");

  if (!["under_review", "changes_requested", "rejected", "archived"].includes(nextStatus)) {
    return respondError(request, {
      error: "invalid_status",
      message: "Trạng thái review không hợp lệ.",
      location: ROUTES.ADMIN.VENDOR_PRODUCT(id),
    });
  }

  try {
    await reviewVendorProductSubmission({
      submissionId: id,
      actorUserId: admin.id,
      nextStatus,
      reviewNote,
    });

    return respondSuccess(request, {
      location: ROUTES.ADMIN.VENDOR_PRODUCT(id),
      message: "Đã cập nhật review.",
    });
  } catch (error) {
    return respondError(request, {
      error: error instanceof Error ? error.message : "review_failed",
      message: "Không thể cập nhật review.",
      location: ROUTES.ADMIN.VENDOR_PRODUCT(id),
    });
  }
}
