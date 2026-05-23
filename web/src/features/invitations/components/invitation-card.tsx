import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { INVITATION_SITE_TYPES, type InvitationSite } from "../types";
import { getInvitationTemplateLabel } from "../templates";

export function InvitationCard({ invitation, publicHref }: { invitation: InvitationSite; publicHref: string }) {
  const editHref = invitation.siteType === INVITATION_SITE_TYPES.EDITABLE
    ? ROUTES.CUSTOMER.DESIGN(invitation.id)
    : `${ROUTES.CUSTOMER.INVITATIONS}/${invitation.id}`;
  const previewImage =
    invitation.offeringThumbnailUrl ||
    (typeof invitation.customData.previewImage === "string" ? invitation.customData.previewImage : "");

  return (
    <Card className="h-full">
      {previewImage ? (
        <div className="relative aspect-video overflow-hidden rounded-t-lg bg-muted">
          <Image src={previewImage} alt={invitation.title} fill className="object-cover" />
        </div>
      ) : null}
      <CardHeader>
        <CardTitle>{invitation.title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {invitation.offeringName || getInvitationTemplateLabel(invitation.templateKey)}
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">Slug public: {publicHref}</p>
        <p className="text-sm text-muted-foreground">Trạng thái: {invitation.status}</p>
      </CardContent>
      <CardFooter className="flex items-center gap-3">
        <Button variant="outline" render={<Link href={`${publicHref}?preview=1`}>Preview</Link>} />
        <Button render={<Link href={editHref}>Chỉnh sửa</Link>} />
      </CardFooter>
    </Card>
  );
}
