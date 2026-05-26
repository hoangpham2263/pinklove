import { reviewSupplierRequest } from "@/features/provider-offering-submissions/server/service";
import { respondError, respondSuccess } from "@/lib/action-response";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

const ALLOWED_STATUSES = new Set(["under_review", "changes_requested", "approved", "rejected", "archived"]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const formData = await request.formData();
  const nextStatus = String(formData.get("nextStatus") ?? "").trim();
  const adminSellPrice = Number(formData.get("adminSellPrice") ?? "0");
  const reviewNote = String(formData.get("reviewNote") ?? "");

  if (!ALLOWED_STATUSES.has(nextStatus)) {
    return respondError(request, {
      error: "invalid_status",
      message: "Trạng thái supplier request không hợp lệ.",
      location: ROUTES.ADMIN.PROVIDER_SOURCING_REQUESTS,
    });
  }

  try {
    await reviewSupplierRequest({
      requestId: id,
      actorUserId: admin.id,
      nextStatus: nextStatus as "under_review" | "changes_requested" | "approved" | "rejected" | "archived",
      adminSellPrice,
      reviewNote,
    });

    return respondSuccess(request, {
      location: ROUTES.ADMIN.PROVIDER_SOURCING_REQUESTS,
      message: "Đã cập nhật supplier request.",
    });
  } catch (error) {
    return respondError(request, {
      error: error instanceof Error ? error.message : "review_failed",
      message: "Không thể cập nhật supplier request.",
      location: ROUTES.ADMIN.PROVIDER_SOURCING_REQUESTS,
    });
  }
}
