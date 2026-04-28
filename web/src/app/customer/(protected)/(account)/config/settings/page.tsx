import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAppUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function CustomerConfigSettingsPage() {
  await requireAppUser(ROUTES.AUTH.LOGIN);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <Card>
        <CardHeader>
          <CardTitle>Cài đặt tài khoản</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Các tùy chọn tài khoản user sẽ được quản lý tại đây.</p>
        </CardContent>
      </Card>
    </section>
  );
}

