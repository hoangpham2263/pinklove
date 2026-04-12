import type { VendorAssignmentStatus } from "@/features/vendor-orders/types";
import { updateVendorAssignmentByVendor, VendorAssignmentError } from "@/features/vendor-orders/server/service";
import { respondError, respondSuccess } from "@/lib/action-response";
import { ensureVendorPortalSlug, requireVendor } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

const VALID_STATUSES: VendorAssignmentStatus[] = [
  "pending_confirmation",
  "accepted",
  "in_progress",
  "ready_for_review",
  "completed",
  "cancelled",
];

export const runtime = "nodejs";

export async function POST(request: Request) {
  const vendor = await requireVendor(ROUTES.PARTNER.LOGIN);
  const portalSlug = await ensureVendorPortalSlug(vendor.id);
  const portalHref = portalSlug ? ROUTES.PARTNER.PORTAL(portalSlug) : ROUTES.PARTNER.ROOT;
  const formData = await request.formData();
  const assignmentId = String(formData.get("assignmentId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() as VendorAssignmentStatus;
  const vendorNote = String(formData.get("vendorNote") ?? "");
  const vendorReference = String(formData.get("vendorReference") ?? "");

  if (!assignmentId || !VALID_STATUSES.includes(status)) {
    return respondError(request, {
      error: "invalid_payload",
      message: "Du lieu cap nhat vendor khong hop le.",
      location: `${portalHref}?error=invalid_payload`,
    });
  }

  try {
    await updateVendorAssignmentByVendor({
      assignmentId,
      vendorUserId: vendor.id,
      status,
      vendorNote,
      vendorReference,
    });
  } catch (error) {
    if (error instanceof VendorAssignmentError && error.code === "ASSIGNMENT_NOT_FOUND") {
      return respondError(request, {
        error: "assignment_not_found",
        message: "Assignment khong ton tai hoac ban khong con quyen truy cap.",
        location: `${portalHref}?error=assignment_not_found`,
      });
    }

    throw error;
  }

  return respondSuccess(request, {
    location: `${ROUTES.PARTNER.ORDER(assignmentId)}?saved=1`,
    message: "Da luu cap nhat vendor.",
  });
}
