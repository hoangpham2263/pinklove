import { getCurrentUserFromRequest } from "@/lib/auth";
import { respondError, respondSuccess } from "@/lib/action-response";
import { syncCartWithWishlist } from "@/features/ecommerce/server/service";
import { getProductById } from "@/features/products/server/service";
import { addUserWishlistProduct, removeUserWishlistProduct, toggleUserWishlistProduct } from "@/features/products/server/wishlist-service";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUserFromRequest(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "toggle").trim();
  const productId = String(formData.get("productId") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? ROUTES.WISHLIST).trim() || ROUTES.WISHLIST;
  const loginHref = `${ROUTES.AUTH.LOGIN}?returnTo=${encodeURIComponent(returnTo)}`;

  if (!user) {
    return respondError(request, {
      status: 401,
      error: "unauthorized",
      message: "Please login first.",
      location: loginHref,
    });
  }

  if (!productId) {
    return respondError(request, {
      error: "missing_product",
      message: "Thiếu sản phẩm để cập nhật wishlist.",
      location: returnTo,
    });
  }

  if (intent === "remove") {
    const result = await removeUserWishlistProduct(user.id, productId);
    await syncCartWithWishlist(user.id);
    return respondSuccess(request, {
      location: returnTo,
      message: result.removed ? "Đã xóa sản phẩm khỏi wishlist." : "Wishlist không thay đổi.",
      data: {
        removed: result.removed,
        productIds: result.productIds,
        count: result.productIds.length,
      },
    });
  }

  const product = await getProductById(productId);
  if (!product || product.status !== "published") {
    return respondError(request, {
      error: "product_not_found",
      message: "Không tìm thấy sản phẩm khả dụng.",
      location: returnTo,
    });
  }

  const result = intent === "add"
    ? await addUserWishlistProduct(user.id, product.id)
    : await toggleUserWishlistProduct(user.id, product.id);
  await syncCartWithWishlist(user.id);

  return respondSuccess(request, {
    location: returnTo,
    message: result.added ? "Đã thêm sản phẩm vào wishlist." : intent === "add" ? "Sản phẩm đã có trong wishlist." : "Đã xóa sản phẩm khỏi wishlist.",
    data: {
      added: result.added,
      productIds: result.productIds,
      count: result.productIds.length,
    },
  });
}
