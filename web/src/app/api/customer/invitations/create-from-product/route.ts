import { requireAppUser } from "@/lib/auth";
import { getProductBySlug } from "@/features/products/server/service";
import { ROUTES } from "@/lib/routes";
import { createInvitationFromProduct } from "@/features/invitations/server/service";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const formData = await request.formData();
  const productSlug = String(formData.get("productSlug") ?? "");
  const product = await getProductBySlug(productSlug);

  if (!product || product.status !== "published") {
    return respondError(request, { error: "product_not_found", message: "Không tìm thấy template khả dụng.", location: `${ROUTES.TEMPLATES}?error=product_not_found` });
  }

  const site = await createInvitationFromProduct({
    userId: user.id,
    product,
  });

  return respondSuccess(request, { location: `${ROUTES.CUSTOMER.INVITATIONS}/${site.id}`, message: "Đã tạo thiệp mời từ template." });
}
