import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerLinkButton } from "@/features/customer/ui/customer-buttons";
import { InvitationCard } from "@/features/invitations/components/invitation-card";
import { requireAppUser } from "@/lib/auth";
import { getInvitationPath } from "@/lib/public-paths";
import { ROUTES } from "@/lib/routes";
import { listInvitationsForUser } from "@/features/invitations/server/service";

export default async function CustomerInvitationsPage() {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const invitations = await listInvitationsForUser(user.id);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Thiệp của tôi</h1>
          <p className="text-sm text-muted-foreground">
            Mỗi thiệp là một bản phát hành riêng được tạo từ template hoặc từ builder starter.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <CustomerLinkButton href={ROUTES.TEMPLATES}>Tạo từ mẫu</CustomerLinkButton>
          <CustomerLinkButton href={ROUTES.BUILDER}>Tự tạo thiệp</CustomerLinkButton>
        </div>
      </div>

      {invitations.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Chưa có thiệp nào</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Bạn chưa tạo thiệp mời nào. Có thể bắt đầu từ một template code sẵn hoặc từ builder starter.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {invitations.map((invitation) => (
            <InvitationCard key={invitation.id} invitation={invitation} publicHref={getInvitationPath(invitation)} />
          ))}
        </div>
      )}
    </section>
  );
}
