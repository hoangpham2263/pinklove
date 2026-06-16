import { notFound, redirect } from "next/navigation";
import { CustomerLinkButton } from "@/features/customer/ui/customer-buttons";
import { requireAppUser } from "@/lib/auth";
import { getInvitationPath } from "@/lib/public-paths";
import { ROUTES } from "@/lib/routes";
import { getInvitationByIdForUser } from "@/features/invitations/server/service";
import { InvitationEditorForm } from "@/features/invitations/components/invitation-editor-form";
import { userHasActiveEntitlement } from "@/features/ecommerce/server/service";
import { INVITATION_SITE_TYPES } from "@/features/invitations/types";

type InvitationEditorPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InvitationEditorPage({ params, searchParams }: InvitationEditorPageProps) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const { id } = await params;
  await searchParams;
  const invitation = await getInvitationByIdForUser(user.id, id);
  if (!invitation) {
    notFound();
  }
  const publicHref = getInvitationPath(invitation);

  if (invitation.siteType === INVITATION_SITE_TYPES.EDITABLE) {
    redirect(ROUTES.CUSTOMER.DESIGN(invitation.id));
  }
  const canPublish = invitation.offeringId
    ? await userHasActiveEntitlement(user.id, invitation.offeringId)
    : true;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{invitation.title}</h1>
          <p className="text-sm text-muted-foreground">
            {invitation.siteType === INVITATION_SITE_TYPES.CODED
              ? "Chỉnh nội dung theo schema của template code sẵn."
              : "Builder đang dùng Konva để chỉnh các block text, shape, image trực tiếp trên thiệp mời."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <CustomerLinkButton href={ROUTES.CUSTOMER.INVITATIONS}>Quay lại danh sách</CustomerLinkButton>
          <CustomerLinkButton href={`${publicHref}?preview=1`}>Preview</CustomerLinkButton>
        </div>
      </div>
      <InvitationEditorForm site={invitation} publicHref={publicHref} canPublish={canPublish} />
    </section>
  );
}
