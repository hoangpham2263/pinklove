import { requireAppUser } from "@/lib/auth";
import { respondError, respondSuccess } from "@/lib/action-response";
import { getProductBySlug } from "@/features/products/server/service";
import { addCartItem } from "@/features/ecommerce/server/service";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const formData = await request.formData();
  const productSlug = String(formData.get("productSlug") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? "1");
  const redirectTo = String(formData.get("redirectTo") ?? ROUTES.CHECKOUT.CART).trim() || ROUTES.CHECKOUT.CART;
  const product = await getProductBySlug(productSlug);

  if (!product || product.status !== "published") {
    return respondError(request, {
      error: "product_not_found",
      message: "Không tìm thấy sản phẩm khả dụng.",
      location: redirectTo,
    });
  }

  await addCartItem(user.id, product, quantity);
  return respondSuccess(request, {
    location: redirectTo,
    message: "Đã thêm sản phẩm vào giỏ hàng.",
  });
}
