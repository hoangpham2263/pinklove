import { getCurrentUserFromRequest } from "@/lib/auth";
import { respondError, respondSuccess } from "@/lib/action-response";
import { syncCartWithWishlist } from "@/features/ecommerce/server/service";
import { getOfferingById } from "@/features/offerings/server/service";
import { addUserWishlistOffering, removeUserWishlistOffering, toggleUserWishlistOffering } from "@/features/offerings/server/wishlist-service";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUserFromRequest(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "toggle").trim();
  const offeringId = String(formData.get("offeringId") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? ROUTES.WISHLIST).trim() || ROUTES.WISHLIST;
  const loginHref = `${ROUTES.AUTH.LOGIN}?returnTo=${encodeURIComponent(returnTo)}`;

  if (!user) {
    return respondError(request, {
      status: 401,
      error: "unauthorized",
      message: "Vui lòng đăng nhập trước.",
      location: loginHref,
    });
  }

  if (!offeringId) {
    return respondError(request, {
      error: "missing_offering",
      message: "Thiếu sản phẩm để cập nhật Yêu thích.",
      location: returnTo,
    });
  }

  if (intent === "remove") {
    const result = await removeUserWishlistOffering(user.id, offeringId);
    await syncCartWithWishlist(user.id);
    return respondSuccess(request, {
      location: returnTo,
      message: result.removed ? "Đã xóa sản phẩm khỏi Yêu thích." : "Yêu thích không thay đổi.",
      data: {
        removed: result.removed,
        offeringIds: result.offeringIds,
        count: result.offeringIds.length,
      },
    });
  }

  const offering = await getOfferingById(offeringId);
  if (!offering || offering.status !== "published") {
    return respondError(request, {
      error: "offering_not_found",
      message: "Không tìm thấy sản phẩm khả dụng.",
      location: returnTo,
    });
  }

  const result = intent === "add"
    ? await addUserWishlistOffering(user.id, offering.id)
    : await toggleUserWishlistOffering(user.id, offering.id);
  await syncCartWithWishlist(user.id);

  return respondSuccess(request, {
    location: returnTo,
    message: result.added ? "Đã thêm sản phẩm vào Yêu thích." : intent === "add" ? "Sản phẩm đã có trong Yêu thích." : "Đã xóa sản phẩm khỏi Yêu thích.",
    data: {
      added: result.added,
      offeringIds: result.offeringIds,
      count: result.offeringIds.length,
    },
  });
}
