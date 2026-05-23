import type { ProviderAssignmentStatus } from "@/features/provider-orders/types";
import { updateProviderAssignmentByProvider, ProviderAssignmentError } from "@/features/provider-orders/server/service";
import { respondError, respondSuccess } from "@/lib/action-response";
import { ensureProviderPortalSlug, requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

const VALID_STATUSES: ProviderAssignmentStatus[] = [
  "pending_confirmation",
  "accepted",
  "in_progress",
  "ready_for_review",
  "completed",
  "cancelled",
];

export const runtime = "nodejs";

export async function POST(request: Request) {
  const provider = await requireProvider(ROUTES.PARTNER.LOGIN);
  const portalSlug = await ensureProviderPortalSlug(provider.id);
  const portalHref = portalSlug ? ROUTES.PARTNER.PORTAL(portalSlug) : ROUTES.PARTNER.ROOT;
  const formData = await request.formData();
  const assignmentId = String(formData.get("assignmentId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() as ProviderAssignmentStatus;
  const providerNote = String(formData.get("providerNote") ?? "");
  const providerReference = String(formData.get("providerReference") ?? "");

  if (!assignmentId || !VALID_STATUSES.includes(status)) {
    return respondError(request, {
      error: "invalid_payload",
      message: "Du lieu cap nhat provider khong hop le.",
      location: `${portalHref}?error=invalid_payload`,
    });
  }

  try {
    await updateProviderAssignmentByProvider({
      assignmentId,
      providerId: provider.id,
      status,
      providerNote,
      providerReference,
    });
  } catch (error) {
    if (error instanceof ProviderAssignmentError && error.code === "ASSIGNMENT_NOT_FOUND") {
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
    message: "Da luu cap nhat provider.",
  });
}
