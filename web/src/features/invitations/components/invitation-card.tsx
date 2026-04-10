import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import type { InvitationSite } from "../types";
import { getInvitationTemplateLabel } from "../templates";

export function InvitationCard({ invitation, publicHref }: { invitation: InvitationSite; publicHref: string }) {
  const editHref = invitation.siteType === "builder_template"
    ? ROUTES.USER.DESIGN(invitation.id)
    : `${ROUTES.USER.INVITATIONS}/${invitation.id}`;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{invitation.title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {invitation.productName || getInvitationTemplateLabel(invitation.templateKey)}
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
