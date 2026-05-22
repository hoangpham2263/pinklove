import { requireAppUser } from "@/lib/auth";
import { getPublishedDigitalTemplateOfferingBySlug } from "@/features/offerings/server/service";
import { ROUTES } from "@/lib/routes";
import { createBuilderInvitation, createInvitationFromOffering } from "@/features/invitations/server/service";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const formData = await request.formData();
  const offeringSlug = String(formData.get("offeringSlug") ?? "");

  const site = offeringSlug
      ? await (async () => {
        const offering = await getPublishedDigitalTemplateOfferingBySlug(offeringSlug, "builder");
        if (!offering) {
          return null;
        }

        return createInvitationFromOffering({
          userId: user.id,
          offering,
        });
      })()
    : await createBuilderInvitation(user.id);

  if (!site) {
    return respondError(request, { error: "offering_not_found", message: "Không tìm thấy builder khả dụng.", location: `${ROUTES.BUILDER}?error=offering_not_found` });
  }

  return respondSuccess(request, { location: ROUTES.CUSTOMER.DESIGN(site.id), message: "Đã tạo thiệp builder." });
}
