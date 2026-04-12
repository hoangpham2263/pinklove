import { upsertVendorAssignment, VendorAssignmentError } from "@/features/vendor-orders/server/service";
import { respondError, respondSuccess } from "@/lib/action-response";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  const formData = await request.formData();
  const orderId = String(formData.get("orderId") ?? "").trim();
  const vendorUserId = String(formData.get("vendorUserId") ?? "").trim();
  const internalNote = String(formData.get("internalNote") ?? "");

  if (!orderId || !vendorUserId) {
    return respondError(request, {
      error: "invalid_assignment",
      message: "Du lieu phan cong vendor khong hop le.",
      location: `${ROUTES.ADMIN.ORDERS}?error=invalid_assignment`,
    });
  }

  try {
    await upsertVendorAssignment({
      orderId,
      vendorUserId,
      internalNote,
      actorUserId: admin.id,
    });
  } catch (error) {
    if (error instanceof VendorAssignmentError && error.code === "INVALID_VENDOR") {
      return respondError(request, {
        error: "invalid_vendor",
        message: "Vendor duoc chon khong hop le.",
        location: `${ROUTES.ADMIN.ORDER(orderId)}?error=invalid_vendor`,
      });
    }

    throw error;
  }

  return respondSuccess(request, {
    location: `${ROUTES.ADMIN.ORDER(orderId)}?vendorSaved=1`,
    message: "Da luu phan cong vendor.",
  });
}
