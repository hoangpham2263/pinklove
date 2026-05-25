import { respondError, respondSuccess } from "@/lib/action-response";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { approveProviderOfferingSubmission } from "@/features/provider-offering-submissions/server/service";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const formData = await request.formData();
  const adminSellPrice = Number(formData.get("adminSellPrice") ?? "0");
  const reviewNote = String(formData.get("reviewNote") ?? "");
  const assignProviderSupplier = formData.get("assignProviderSupplier") !== "off";

  if (!Number.isFinite(adminSellPrice) || adminSellPrice <= 0) {
    return respondError(request, {
      error: "invalid_price",
      message: "Giá bán admin phải lớn hơn 0.",
      location: `${ROUTES.ADMIN.PROVIDER_OFFERING(id)}?error=invalid_price`,
    });
  }

  try {
    await approveProviderOfferingSubmission({
      submissionId: id,
      actorUserId: admin.id,
      adminSellPrice,
      reviewNote,
      assignProviderSupplier,
    });

    return respondSuccess(request, {
      location: `${ROUTES.ADMIN.PROVIDER_OFFERING(id)}?updated=1`,
      message: "Đã áp dụng hồ sơ sản phẩm vào catalog.",
    });
  } catch (error) {
    const errorCode = error instanceof Error ? error.message : "approve_failed";

    return respondError(request, {
      error: errorCode,
      message: "Không thể duyệt hồ sơ sản phẩm.",
      location: `${ROUTES.ADMIN.PROVIDER_OFFERING(id)}?error=${encodeURIComponent(errorCode)}`,
    });
  }
}
