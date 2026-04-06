import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import type { WeddingSite } from "../types";
import { getWeddingTemplateLabel } from "../templates";

export function WeddingSiteCard({ site }: { site: WeddingSite }) {
  const editHref = site.siteType === "builder_template"
    ? ROUTES.USER.DESIGN(site.id)
    : `${ROUTES.USER.SITES}/${site.id}`;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{site.title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {site.productName || getWeddingTemplateLabel(site.templateKey)}
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">Slug public: {ROUTES.WEDDING.SITE(site.slug)}</p>
        <p className="text-sm text-muted-foreground">Trạng thái: {site.status}</p>
      </CardContent>
      <CardFooter className="flex items-center gap-3">
        <Button variant="outline" render={<Link href={`${ROUTES.WEDDING.SITE(site.slug)}?preview=1`}>Preview</Link>} />
        <Button render={<Link href={editHref}>Chỉnh sửa</Link>} />
      </CardFooter>
    </Card>
  );
}
