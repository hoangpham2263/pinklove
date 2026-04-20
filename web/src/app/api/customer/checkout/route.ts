import { requireAppUser } from "@/lib/auth";
import { respondError, respondSuccess } from "@/lib/action-response";
import { createOrderFromCart, syncCartWithWishlist } from "@/features/ecommerce/server/service";
import { AFFILIATE_REF_COOKIE_NAME } from "@/features/affiliate/server/service";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings } from "@/lib/system-settings";

export const runtime = "nodejs";

function getCookieValue(request: Request, name: string) {
  return (
    request.headers
      .get("cookie")
      ?.split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${name}=`))
      ?.split("=")[1] ?? ""
  );
}

export async function POST(request: Request) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  await syncCartWithWishlist(user.id);
  const settings = await getSystemSettings();
  const formData = await request.formData();

  if (!settings.ecommerce.enabled) {
    return respondError(request, {
      error: "ecommerce_disabled",
      message: "Checkout hiện đang tạm khóa.",
      location: ROUTES.WISHLIST,
    });
  }

  const paymentMethod = String(formData.get("paymentMethod") ?? "mock_online");
  if (paymentMethod === "bank_transfer" && !settings.ecommerce.allowBankTransfer) {
    return respondError(request, {
      error: "payment_method_disabled",
      message: "Phương thức chuyển khoản hiện chưa được bật.",
      location: ROUTES.CHECKOUT.INDEX,
    });
  }

  if (paymentMethod === "cod" && !settings.ecommerce.allowCod) {
    return respondError(request, {
      error: "payment_method_disabled",
      message: "Phương thức COD hiện chưa được bật.",
      location: ROUTES.CHECKOUT.INDEX,
    });
  }

  try {
    const order = await createOrderFromCart({
      userId: user.id,
      customerName: String(formData.get("customerName") ?? "").trim(),
      customerEmail: String(formData.get("customerEmail") ?? "").trim() || `${user.username}@pinklove.local`,
      customerPhone: String(formData.get("customerPhone") ?? "").trim(),
      paymentMethod: paymentMethod === "bank_transfer" || paymentMethod === "cod" ? paymentMethod : "mock_online",
      notes: String(formData.get("notes") ?? ""),
      affiliateCode: decodeURIComponent(getCookieValue(request, AFFILIATE_REF_COOKIE_NAME)),
      shippingName: String(formData.get("shippingName") ?? "").trim(),
      shippingPhone: String(formData.get("shippingPhone") ?? "").trim(),
      shippingLine1: String(formData.get("shippingLine1") ?? "").trim(),
      shippingLine2: String(formData.get("shippingLine2") ?? "").trim(),
      shippingWard: String(formData.get("shippingWard") ?? "").trim(),
      shippingDistrict: String(formData.get("shippingDistrict") ?? "").trim(),
      shippingCity: String(formData.get("shippingCity") ?? "").trim(),
      shippingPostalCode: String(formData.get("shippingPostalCode") ?? "").trim(),
      shippingCountry: String(formData.get("shippingCountry") ?? "VN").trim() || "VN",
    });

    return respondSuccess(request, {
      location: ROUTES.CHECKOUT.SUCCESS(order.orderNumber),
      message: "Đã tạo đơn hàng thành công.",
    });
  } catch (error) {
    const message = error instanceof Error && error.message === "CART_EMPTY"
      ? "Danh sách yêu thích đang trống."
      : "Không thể tạo đơn hàng.";

    return respondError(request, {
      error: "checkout_failed",
      message,
      location: ROUTES.WISHLIST,
    });
  }
}
