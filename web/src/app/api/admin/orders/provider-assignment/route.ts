import { upsertProviderAssignment, ProviderAssignmentError } from "@/features/provider-orders/server/service";
import { respondError, respondSuccess } from "@/lib/action-response";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  const formData = await request.formData();
  const orderId = String(formData.get("orderId") ?? "").trim();
  const providerId = String(formData.get("providerId") ?? "").trim();
  const internalNote = String(formData.get("internalNote") ?? "");

  if (!orderId || !providerId) {
    return respondError(request, {
      error: "invalid_assignment",
      message: "Du lieu phan cong provider khong hop le.",
      location: `${ROUTES.ADMIN.ORDERS}?error=invalid_assignment`,
    });
  }

  try {
    await upsertProviderAssignment({
      orderId,
      providerId,
      internalNote,
      actorUserId: admin.id,
    });
  } catch (error) {
    if (error instanceof ProviderAssignmentError && error.code === "INVALID_PROVIDER") {
      return respondError(request, {
        error: "invalid_provider",
        message: "Provider duoc chon khong hop le.",
        location: `${ROUTES.ADMIN.ORDER(orderId)}?error=invalid_provider`,
      });
    }

    throw error;
  }

  return respondSuccess(request, {
    location: `${ROUTES.ADMIN.ORDER(orderId)}?providerSaved=1`,
    message: "Da luu phan cong provider.",
  });
}
