import {
  VENDOR_LEAD_STATUSES,
  createVendorQuote,
  updateVendorLeadStatus,
} from "@/features/providers/server/leads";
import { getProviderByUserId } from "@/features/providers/server/service";
import { respondError, respondSuccess } from "@/lib/action-response";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const provider = await getProviderByUserId(user.id);
  const formData = await request.formData();
  if (!provider) {
    return respondError(request, {
      error: "provider_not_found",
      message: "Chưa có hồ sơ provider.",
      location: ROUTES.PROVIDER.LEADS,
    });
  }

  const intent = String(formData.get("intent") ?? "");
  const leadId = String(formData.get("leadId") ?? "");
  if (intent === "update_status") {
    const status = String(formData.get("status") ?? "");
    if (!VENDOR_LEAD_STATUSES.includes(status as never)) {
      return respondError(request, { error: "invalid_status", message: "Trạng thái không hợp lệ.", location: ROUTES.PROVIDER.LEADS });
    }
    await updateVendorLeadStatus(provider.id, leadId, status);
  } else if (intent === "create_quote") {
    await createVendorQuote({
      providerId: provider.id,
      leadId,
      amount: Number(formData.get("amount") ?? 0),
      message: String(formData.get("message") ?? ""),
      status: "sent",
    });
  } else {
    return respondError(request, { error: "invalid_intent", message: "Tác vụ không hợp lệ.", location: ROUTES.PROVIDER.LEADS });
  }

  return respondSuccess(request, { location: ROUTES.PROVIDER.LEADS, message: "Đã cập nhật lead." });
}
