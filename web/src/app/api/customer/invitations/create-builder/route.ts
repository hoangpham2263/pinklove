import { requireAppUser } from "@/lib/auth";
import { getPublishedProductBySlugAndType } from "@/features/products/server/service";
import { ROUTES } from "@/lib/routes";
import { createBuilderInvitation, createInvitationFromProduct } from "@/features/invitations/server/service";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const formData = await request.formData();
  const productSlug = String(formData.get("productSlug") ?? "");

  const site = productSlug
      ? await (async () => {
        const product = await getPublishedProductBySlugAndType(productSlug, "builder");
        if (!product) {
          return null;
        }

        return createInvitationFromProduct({
          userId: user.id,
          product,
        });
      })()
    : await createBuilderInvitation(user.id);

  if (!site) {
    return respondError(request, { error: "product_not_found", message: "Không tìm thấy builder khả dụng.", location: `${ROUTES.BUILDER}?error=product_not_found` });
  }

  return respondSuccess(request, { location: ROUTES.CUSTOMER.DESIGN(site.id), message: "Đã tạo thiệp builder." });
}
