import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeddingSiteCard } from "@/features/wedding-sites/components/site-card";
import { requireAppUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { listWeddingSitesForUser } from "@/lib/wedding-sites";

export default async function UserSitesPage() {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const sites = await listWeddingSitesForUser(user.id);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Thiệp của tôi</h1>
          <p className="text-sm text-muted-foreground">
            Mỗi site là một bản thiệp riêng được tạo từ mẫu hoặc từ builder starter.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" render={<Link href={ROUTES.TEMPLATES}>Tạo từ mẫu</Link>} />
          <Button render={<Link href={ROUTES.BUILDER}>Tự tạo thiệp</Link>} />
        </div>
      </div>

      {sites.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Chưa có thiệp nào</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Bạn chưa tạo website thiệp cưới nào. Có thể bắt đầu từ một mẫu code sẵn hoặc từ builder starter.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {sites.map((site) => (
            <WeddingSiteCard key={site.id} site={site} />
          ))}
        </div>
      )}
    </section>
  );
}
