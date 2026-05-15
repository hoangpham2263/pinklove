import { requireAppUser } from "@/lib/auth";
import { respondError, respondSuccess } from "@/lib/action-response";
import { getUserAddressById } from "@/features/account/server/address-service";
import { createOrderFromCart, listCartItems, syncCartWithWishlist } from "@/features/ecommerce/server/service";
import { createPay2sPayment } from "@/features/ecommerce/server/pay2s.service";
import { AFFILIATE_REF_COOKIE_NAME } from "@/features/affiliate/server/service";
import { getPay2sConfig } from "@/lib/pay2s";
import { getEnabledPaymentMethods } from "@/lib/payment-methods";
import { ROUTES } from "@/lib/routes";
import { getSiteUrlFromRequest } from "@/lib/seo";
import { getSystemSettings } from "@/lib/system-settings";
import {
  createVnpayPaymentUrl,
  getVnpayConfig,
  getVnpayRequestIp,
} from "@/lib/vnpay";

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
  const formData = await request.formData();
  const selectedProductIds = formData
    .getAll("selectedProductIds")
    .map((value) => String(value).trim())
    .filter(Boolean);
  await syncCartWithWishlist(user.id, selectedProductIds);
  const settings = await getSystemSettings();

  if (!settings.ecommerce.enabled) {
    return respondError(request, {
      error: "ecommerce_disabled",
      message: "Checkout hiện đang tạm khóa.",
      location: ROUTES.WISHLIST,
    });
  }

  const cartItems = await listCartItems(user.id);
  const requiresShipping =
    settings.ecommerce.supportShipping && cartItems.some((item) => item.fulfillmentType === "physical");
  const enabledPaymentMethods = getEnabledPaymentMethods(settings.ecommerce, requiresShipping);
  const requestedPaymentMethod = String(formData.get("paymentMethod") ?? "").trim();
  const paymentMethod = requestedPaymentMethod || enabledPaymentMethods[0]?.code || "";
  const selectedPaymentMethod = enabledPaymentMethods.find((item) => item.code === paymentMethod);

  if (!selectedPaymentMethod) {
    return respondError(request, {
      error: "payment_method_disabled",
      message: "Phương thức thanh toán hiện không khả dụng.",
      location: ROUTES.CHECKOUT.INDEX,
    });
  }

  const vnpayConfig = selectedPaymentMethod.provider === "vnpay" ? getVnpayConfig(selectedPaymentMethod) : null;
  const pay2sConfig = selectedPaymentMethod.provider === "pay2s" ? getPay2sConfig(selectedPaymentMethod) : null;
  if (selectedPaymentMethod.provider === "vnpay" && !vnpayConfig) {
    return respondError(request, {
      error: "vnpay_not_configured",
      message: "VNPAY chưa được cấu hình. Vui lòng cấu hình VNPAY trong Payment Methods.",
      location: ROUTES.CHECKOUT.INDEX,
    });
  }
  if (selectedPaymentMethod.provider === "pay2s" && !pay2sConfig) {
    return respondError(request, {
      error: "pay2s_not_configured",
      message: "Pay2S chưa được cấu hình. Vui lòng cấu hình Pay2S trong Payment Methods hoặc biến môi trường.",
      location: ROUTES.CHECKOUT.INDEX,
    });
  }

  try {
    const addressId = String(formData.get("addressId") ?? "").trim();
    const savedAddress = requiresShipping && addressId ? await getUserAddressById(user.id, addressId) : null;

    if (requiresShipping && addressId && !savedAddress) {
      return respondError(request, {
        error: "address_not_found",
        message: "Địa chỉ giao hàng không tồn tại hoặc không thuộc tài khoản của bạn.",
        location: ROUTES.CHECKOUT.INDEX,
      });
    }

    if (requiresShipping && !savedAddress) {
      return respondError(request, {
        error: "address_required",
        message: "Vui lòng chọn địa chỉ giao hàng đã lưu.",
        location: ROUTES.CHECKOUT.INDEX,
      });
    }

    const order = await createOrderFromCart({
      userId: user.id,
      customerName: String(formData.get("customerName") ?? "").trim(),
      customerEmail: String(formData.get("customerEmail") ?? "").trim() || `${user.username}@pinklove.local`,
      customerPhone: String(formData.get("customerPhone") ?? "").trim(),
      paymentMethod: selectedPaymentMethod.code,
      paymentProvider: selectedPaymentMethod.provider,
      paymentType: selectedPaymentMethod.type,
      notes: String(formData.get("notes") ?? ""),
      affiliateCode: decodeURIComponent(getCookieValue(request, AFFILIATE_REF_COOKIE_NAME)),
      shippingName: savedAddress?.recipientName,
      shippingPhone: savedAddress?.phone,
      shippingLine1: savedAddress?.line1,
      shippingLine2: savedAddress?.line2,
      shippingWard: savedAddress?.ward,
      shippingDistrict: savedAddress?.district,
      shippingCity: savedAddress?.city,
      shippingPostalCode: savedAddress?.postalCode,
      shippingCountry: savedAddress?.country,
    });

    if (selectedPaymentMethod.provider === "vnpay") {
      const primaryPayment = order.payments[0];

      if (!vnpayConfig || !primaryPayment) {
        return respondError(request, {
          error: "vnpay_not_configured",
          message: "VNPAY chưa được cấu hình. Vui lòng cấu hình VNPAY trong Payment Methods.",
          location: ROUTES.CHECKOUT.SUCCESS(order.orderNumber),
        });
      }

      const paymentUrl = createVnpayPaymentUrl({
        order,
        paymentId: primaryPayment.id,
        requestIp: getVnpayRequestIp(request),
        returnUrl: `${getSiteUrlFromRequest(request)}${ROUTES.API.PAYMENTS.VNPAY.RETURN}`,
        config: vnpayConfig,
      });

      return respondSuccess(request, {
        location: paymentUrl,
        message: "Chuyển sang VNPAY để thanh toán.",
      });
    }

    if (selectedPaymentMethod.provider === "pay2s") {
      const primaryPayment = order.payments[0];

      if (!pay2sConfig || !primaryPayment) {
        return respondError(request, {
          error: "pay2s_not_configured",
          message: "Pay2S chưa được cấu hình. Vui lòng cấu hình Pay2S trong Payment Methods.",
          location: ROUTES.CHECKOUT.SUCCESS(order.orderNumber),
        });
      }

      const pay2sPayment = await createPay2sPayment({
        order,
        payment: primaryPayment,
        config: pay2sConfig,
        siteUrl: getSiteUrlFromRequest(request),
      });

      return respondSuccess(request, {
        location: pay2sPayment.paymentUrl,
        message: "Chuyển sang Pay2S để thanh toán.",
      });
    }

    return respondSuccess(request, {
      location: ROUTES.PAYMENT.ORDER(order.orderNumber),
      message: "Chuyển sang bước thanh toán.",
    });
  } catch (error) {
    console.error("[customer-checkout] create order failed", error);

    const rawMessage = error instanceof Error ? error.message : "";
    const message =
      rawMessage === "CART_EMPTY"
        ? "Danh sách yêu thích đang trống."
        : rawMessage === "SHIPPING_ADDRESS_REQUIRED"
          ? "Vui lòng chọn hoặc nhập đầy đủ địa chỉ giao hàng."
        : rawMessage.startsWith("OUT_OF_STOCK:")
          ? `Sản phẩm đã hết hàng hoặc không đủ tồn kho: ${rawMessage.replace("OUT_OF_STOCK:", "")}.`
        : rawMessage
          ? `Không thể tạo thanh toán: ${rawMessage}.`
          : "Không thể tạo đơn hàng.";

    return respondError(request, {
      error: "checkout_failed",
      message,
      location: ROUTES.CHECKOUT.INDEX,
    });
  }
}
