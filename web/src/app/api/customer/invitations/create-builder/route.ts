import { requireAppUser } from "@/lib/auth";
import { getPublishedProductBySlugAndType } from "@/features/products/server/service";
import { ROUTES } from "@/lib/routes";
import { createBuilderInvitation, createInvitationFromProduct } from "@/features/invitations/server/service";
import { respondError, respondSuccess } from "@/lib/action-response";
import { userHasActiveEntitlement } from "@/features/ecommerce/server/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const formData = await request.formData();
  const productSlug = String(formData.get("productSlug") ?? "");

  const site = productSlug
    ? await (async () => {
        const product = await getPublishedProductBySlugAndType(productSlug, "builder_template");
        if (!product) {
          return null;
        }

        const entitled = await userHasActiveEntitlement(user.id, product.id);
        if (!entitled) {
          return "ENTITLEMENT_REQUIRED" as const;
        }

        return createInvitationFromProduct({
          userId: user.id,
          product,
        });
      })()
    : await createBuilderInvitation(user.id);

  if (site === "ENTITLEMENT_REQUIRED") {
    return respondError(request, {
      error: "entitlement_required",
      message: "Bạn cần mua builder starter trước khi tạo thiệp builder.",
      location: ROUTES.WISHLIST,
    });
  }

  if (!site) {
    return respondError(request, { error: "product_not_found", message: "Không tìm thấy builder template khả dụng.", location: `${ROUTES.BUILDER}?error=product_not_found` });
  }

  return respondSuccess(request, { location: ROUTES.CUSTOMER.DESIGN(site.id), message: "Đã tạo thiệp builder." });
}
