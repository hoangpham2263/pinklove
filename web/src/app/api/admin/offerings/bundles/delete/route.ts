import { revalidatePath } from "next/cache";

import { respondError, respondSuccess } from "@/lib/action-response";
import { requireAdmin } from "@/lib/auth";
import { deleteOfferingBundle } from "@/features/offerings/server/bundles";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const slug = String(formData.get("slug") ?? "").trim();

  if (!slug) {
    return respondError(request, {
      error: "bundle_slug_required",
      message: "Thiếu slug combo cần xóa.",
      location: ROUTES.ADMIN.OFFERING_BUNDLES,
    });
  }

  await deleteOfferingBundle(slug);
  revalidatePath(ROUTES.ADMIN.OFFERING_BUNDLES);

  return respondSuccess(request, {
    location: ROUTES.ADMIN.OFFERING_BUNDLES,
    message: "Đã xóa combo.",
  });
}
