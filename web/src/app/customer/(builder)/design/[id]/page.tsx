import { notFound } from "next/navigation";
import { requireAppUser } from "@/lib/auth";
import { getInvitationPath, sanitizePermalinkConfig } from "@/lib/public-paths";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings } from "@/lib/system-settings";
import { getInvitationByIdForUser } from "@/features/invitations/server/service";
import { BuilderInvitationForm } from "@/features/invitations/builder/builder-invitation-form";

type BuilderDesignPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BuilderDesignPage({ params }: BuilderDesignPageProps) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const { id } = await params;
  const invitation = await getInvitationByIdForUser(user.id, id);

  if (!invitation || invitation.siteType !== "builder_template") {
    notFound();
  }

  const permalinkConfig = sanitizePermalinkConfig((await getSystemSettings()).permalink);

  return (
    <BuilderInvitationForm
      invitation={invitation}
      publicHref={getInvitationPath(invitation, permalinkConfig)}
    />
  );
}

