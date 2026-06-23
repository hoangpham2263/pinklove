import { NextResponse } from "next/server";

import { getUserAddressById } from "@/features/account/server/address-service";
import { AFFILIATE_REF_COOKIE_NAME } from "@/features/affiliate/server/service";
import { createPay2sPayment } from "@/features/ecommerce/server/pay2s.service";
import {
  createOrderFromCart,
  getOrderByIdOrNumberForUser,
  getOrderByIdForUser,
  getPaymentById,
  listCartItems,
  syncCartWithWishlist,
} from "@/features/ecommerce/server/service";
import { requireAppUser } from "@/lib/auth";
import { getPay2sConfig } from "@/lib/pay2s";
import { getEnabledPaymentMethods } from "@/lib/payment-methods";
import { getSiteUrlFromRequest } from "@/lib/seo";
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

async function readCreateInput(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await request.formData();
    return { formData, body: null };
  }

  const body = (await request.json().catch(() => null)) as
    | { orderId?: string; paymentId?: string; amount?: number }
    | null;
  return { formData: null, body };
}

export async function POST(request: Request) {
  const user = await requireAppUser();
  const { formData, body } = await readCreateInput(request);
  const settings = await getSystemSettings();

  if (formData) {
    const selectedOfferingIds = formData
      .getAll("selectedOfferingIds")
      .map((value) => String(value).trim())
      .filter(Boolean);
    await syncCartWithWishlist(user.id, selectedOfferingIds);

    const cartItems = await listCartItems(user.id);
    const requiresShipping =
      settings.ecommerce.supportShipping && cartItems.some((item) => item.fulfillmentType === "physical");
    const selectedPaymentMethod = getEnabledPaymentMethods(settings.ecommerce, requiresShipping).find(
      (item) => item.code === "pay2s" && item.provider === "pay2s"
    );
    const config = selectedPaymentMethod ? getPay2sConfig(selectedPaymentMethod) : null;

    if (!selectedPaymentMethod || !config) {
      return NextResponse.json({ error: "pay2s_not_configured", message: "Pay2S chưa được cấu hình." }, { status: 400 });
    }

    const addressId = String(formData.get("addressId") ?? "").trim();
    const savedAddress = requiresShipping && addressId ? await getUserAddressById(user.id, addressId) : null;

    if (requiresShipping && !savedAddress) {
      return NextResponse.json({ error: "address_required", message: "Vui lòng chọn địa chỉ giao hàng đã lưu." }, { status: 400 });
    }

    const order = await createOrderFromCart({
      userId: user.id,
      customerName: String(formData.get("customerName") ?? "").trim(),
      customerEmail: String(formData.get("customerEmail") ?? "").trim() || user.email,
      customerPhone: String(formData.get("customerPhone") ?? "").trim(),
      paymentMethod: selectedPaymentMethod.code,
      paymentProvider: selectedPaymentMethod.provider,
      paymentType: selectedPaymentMethod.type,
      notes: String(formData.get("notes") ?? ""),
      requestVatInvoice: settings.ecommerce.enableVatInvoiceRequest && formData.get("requestVatInvoice") === "on",
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
    const payment = order.payments[0];

    if (!payment || payment.provider !== "pay2s") {
      return NextResponse.json({ error: "payment_not_found", message: "Không tìm thấy payment Pay2S." }, { status: 500 });
    }

    try {
      const result = await createPay2sPayment({
        order,
        payment,
        config,
        siteUrl: getSiteUrlFromRequest(request),
      });

      return NextResponse.json({
        ok: true,
        paymentUrl: result.paymentUrl,
        location: result.paymentUrl,
        orderId: order.orderNumber,
        paymentId: payment.id,
      });
    } catch (error) {
      return NextResponse.json(
        {
          error: "pay2s_create_failed",
          message: error instanceof Error ? `Không thể tạo thanh toán Pay2S: ${error.message}.` : "Không thể tạo thanh toán Pay2S.",
          orderId: order.orderNumber,
          paymentId: payment.id,
        },
        { status: 400 }
      );
    }
  }

  const orderKey = String(body?.orderId ?? "").trim();
  const paymentId = String(body?.paymentId ?? "").trim();

  let order = orderKey ? await getOrderByIdOrNumberForUser(user.id, orderKey) : null;
  let payment = paymentId ? await getPaymentById(paymentId) : null;

  if (payment && !order) {
    order = await getOrderByIdForUser(user.id, payment.orderId);
  }
  if (!payment && order) {
    payment = order.payments.find((item) => item.provider === "pay2s" && item.status === "pending") ?? null;
  }

  if (!order || !payment || payment.provider !== "pay2s") {
    return NextResponse.json({ error: "order_not_found", message: "Không tìm thấy đơn Pay2S hợp lệ." }, { status: 404 });
  }

  if (typeof body?.amount === "number" && Math.round(body.amount) !== Math.round(payment.amount)) {
    return NextResponse.json({ error: "invalid_amount", message: "Số tiền thanh toán không khớp." }, { status: 400 });
  }

  const method = settings.ecommerce.paymentMethods.find(
    (item) => item.code === payment.method && item.provider === "pay2s"
  );
  const config = method ? getPay2sConfig(method) : null;

  if (!config) {
    return NextResponse.json({ error: "pay2s_not_configured", message: "Pay2S chưa được cấu hình." }, { status: 400 });
  }

  try {
    const result = await createPay2sPayment({
      order,
      payment,
      config,
      siteUrl: getSiteUrlFromRequest(request),
    });

    return NextResponse.json({
      ok: true,
      paymentUrl: result.paymentUrl,
      location: result.paymentUrl,
      orderId: order.orderNumber,
      paymentId: payment.id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "pay2s_create_failed",
        message: error instanceof Error ? `Không thể tạo thanh toán Pay2S: ${error.message}.` : "Không thể tạo thanh toán Pay2S.",
        orderId: order.orderNumber,
        paymentId: payment.id,
      },
      { status: 400 }
    );
  }
}
