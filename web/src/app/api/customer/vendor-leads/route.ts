import { acceptVendorQuote, createVendorLead } from "@/features/providers/server/leads";
import { respondError, respondSuccess } from "@/lib/action-response";
import { requireAppUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");

  if (intent === "accept_quote") {
    const leadId = String(formData.get("leadId") ?? "");
    const booking = await acceptVendorQuote({ userId: user.id, leadId });
    return respondSuccess(request, {
      location: ROUTES.CUSTOMER.VENDOR_LEADS,
      message: "Đã chấp nhận báo giá và tạo booking.",
      data: { bookingId: booking.id },
    });
  }

  if (intent === "create_lead") {
    const [providerId = "", offeringId = ""] = String(formData.get("target") ?? "").split("|", 2);
    const message = String(formData.get("message") ?? "").trim();
    if (!providerId || !message) {
      return respondError(request, {
        error: "invalid_lead",
        message: "Nhà cung cấp và nội dung yêu cầu là bắt buộc.",
        location: ROUTES.CUSTOMER.VENDOR_LEADS,
      });
    }
    await createVendorLead({
      providerId,
      userId: user.id,
      offeringId: offeringId || null,
      budget: Number(formData.get("budget") ?? 0),
      eventDate: String(formData.get("eventDate") ?? "") || null,
      message,
    });
    return respondSuccess(request, { location: ROUTES.CUSTOMER.VENDOR_LEADS, message: "Đã gửi yêu cầu đến nhà cung cấp." });
  }

  return respondError(request, {
    error: "invalid_intent",
    message: "Tác vụ không hợp lệ.",
    location: ROUTES.CUSTOMER.VENDOR_LEADS,
  });
}
