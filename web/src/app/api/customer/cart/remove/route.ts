import { requireAppUser } from "@/lib/auth";
import { respondError, respondSuccess } from "@/lib/action-response";
import { removeCartItem } from "@/features/commerce/server/service";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const formData = await request.formData();
  const productId = String(formData.get("productId") ?? "").trim();

  if (!productId) {
    return respondError(request, {
      error: "missing_product",
      message: "Thiếu sản phẩm cần xóa khỏi giỏ hàng.",
      location: ROUTES.CHECKOUT.CART,
    });
  }

  await removeCartItem(user.id, productId);
  return respondSuccess(request, {
    location: ROUTES.CHECKOUT.CART,
    message: "Đã xóa sản phẩm khỏi giỏ hàng.",
  });
}
