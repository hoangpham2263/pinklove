import { respondError, respondSuccess } from "@/lib/action-response";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { submitProviderOfferingSubmission } from "@/features/provider-offering-submissions/server/service";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const provider = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const { id } = await params;

  try {
    await submitProviderOfferingSubmission(provider.id, id);
    return respondSuccess(request, {
      location: ROUTES.PROVIDER.OFFERING(id),
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
      location: ROUTES.PROVIDER.OFFERING(id),
    });
  }
}
