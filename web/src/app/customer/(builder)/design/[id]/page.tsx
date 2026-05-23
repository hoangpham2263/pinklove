import { notFound } from "next/navigation";
import { requireAppUser } from "@/lib/auth";
import { getInvitationPath } from "@/lib/public-paths";
import { ROUTES } from "@/lib/routes";
import { getInvitationByIdForUser } from "@/features/invitations/server/service";
import { BuilderInvitationForm } from "@/features/invitations/builder/builder-invitation-form";
import { INVITATION_SITE_TYPES } from "@/features/invitations/types";

type BuilderDesignPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BuilderDesignPage({ params }: BuilderDesignPageProps) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const { id } = await params;
  const invitation = await getInvitationByIdForUser(user.id, id);

  if (!invitation || invitation.siteType !== INVITATION_SITE_TYPES.EDITABLE) {
    notFound();
  }

  return (
    <BuilderInvitationForm
      invitation={invitation}
      publicHref={getInvitationPath(invitation)}
    />
  );
}
