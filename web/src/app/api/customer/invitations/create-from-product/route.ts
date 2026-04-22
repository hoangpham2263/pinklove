import { requireAppUser } from "@/lib/auth";
import { getProductBySlug } from "@/features/products/server/service";
import { ROUTES } from "@/lib/routes";
import { createInvitationFromProduct } from "@/features/invitations/server/service";
import { respondError, respondSuccess } from "@/lib/action-response";
import { userHasActiveEntitlement } from "@/features/ecommerce/server/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const formData = await request.formData();
  const productSlug = String(formData.get("productSlug") ?? "");
  const product = await getProductBySlug(productSlug);

  if (!product || product.status !== "published") {
    return respondError(request, { error: "product_not_found", message: "Không tìm thấy template khả dụng.", location: `${ROUTES.TEMPLATES}?error=product_not_found` });
  }

  if (product.productType === "general_product") {
    return respondError(request, {
      error: "not_invitation_product",
      message: "Sản phẩm này không tạo thiệp web trong hệ thống.",
      location: ROUTES.WISHLIST,
    });
  }

  const entitled = await userHasActiveEntitlement(user.id, product.id);
  if (!entitled) {
    return respondError(request, {
      error: "entitlement_required",
      message: "Bạn cần mua sản phẩm trước khi tạo thiệp từ template này.",
      location: ROUTES.WISHLIST,
    });
  }

  const site = await createInvitationFromProduct({
    userId: user.id,
    product,
  });

  const nextLocation =
    site.siteType === "builder_template"
      ? ROUTES.CUSTOMER.DESIGN(site.id)
      : `${ROUTES.CUSTOMER.INVITATIONS}/${site.id}`;

  return respondSuccess(request, { location: nextLocation, message: "Đã tạo thiệp mời từ template." });
}
