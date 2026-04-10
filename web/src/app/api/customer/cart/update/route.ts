import { requireAppUser } from "@/lib/auth";
import { respondError, respondSuccess } from "@/lib/action-response";
import { updateCartItemQuantity } from "@/features/commerce/server/service";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const formData = await request.formData();
  const productId = String(formData.get("productId") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? "1");

  if (!productId) {
    return respondError(request, {
      error: "missing_product",
      message: "Thiếu thông tin sản phẩm trong giỏ hàng.",
      location: ROUTES.CHECKOUT.CART,
    });
  }

  await updateCartItemQuantity(user.id, productId, quantity);
  return respondSuccess(request, {
    location: ROUTES.CHECKOUT.CART,
    message: "Đã cập nhật giỏ hàng.",
  });
}
