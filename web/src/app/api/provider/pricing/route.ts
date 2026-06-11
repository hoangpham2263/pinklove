import { setProviderPricing } from "@/features/providers/server/marketplace";
import { getProviderByUserId } from "@/features/providers/server/service";
import { deleteProviderPricing } from "@/features/providers/server/workspace";
import { respondError, respondSuccess } from "@/lib/action-response";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const provider = await getProviderByUserId(user.id);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "save");

  if (!provider) {
    return respondError(request, {
      error: "provider_missing",
      message: "Chưa có hồ sơ provider.",
      location: ROUTES.PROVIDER.PRICING,
    });
  }

  if (intent === "delete") {
    await deleteProviderPricing(provider.id, String(formData.get("pricingId") ?? "").trim());
    return respondSuccess(request, { location: ROUTES.PROVIDER.PRICING, message: "Đã xóa dòng giá." });
  }

  await setProviderPricing({
    providerId: provider.id,
    offeringId: String(formData.get("offeringId") ?? "").trim() || null,
    priceType: String(formData.get("priceType") ?? "base") as never,
    amount: Number(formData.get("amount") ?? 0),
    currency: String(formData.get("currency") ?? "VND").trim() || "VND",
    metadata: { note: String(formData.get("note") ?? "").trim() },
  });
  return respondSuccess(request, { location: ROUTES.PROVIDER.PRICING, message: "Đã lưu bảng giá." });
}
