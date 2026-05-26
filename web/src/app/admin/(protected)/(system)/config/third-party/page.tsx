import { PasswordInput } from "@/components/common/password-input";
import { AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings } from "@/lib/system-settings";

export default async function AdminThirdPartyConfigPage() {
  await requireAdmin();
  const settings = await getSystemSettings();
  const google = settings.thirdParty.googleOAuth;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Đăng nhập bên thứ 3</h1>
        <p className="text-sm text-muted-foreground">
          Cấu hình OAuth và provider đăng nhập ngoài tại đây, không lưu credential trong env.
        </p>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="text-base">Google OAuth</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={ROUTES.API.ADMIN.CONFIG.UPDATE} method="POST" className="space-y-5">
            <input type="hidden" name="section" value="third_party" />

            <label className="flex items-start gap-3 rounded-md border p-4">
              <input
                type="checkbox"
                name="googleOAuthEnabled"
                defaultChecked={google.enabled}
                className="mt-1"
              />
              <div>
                <p className="font-medium">Bật Google OAuth</p>
                <p className="text-sm text-muted-foreground">
                  Khi bật, nút đăng nhập Google sẽ dùng Client ID/Secret và Redirect URI bên dưới.
                </p>
              </div>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="font-medium">Client ID</label>
                <input
                  name="googleClientId"
                  defaultValue={google.clientId}
                  className="h-10 w-full rounded-md border bg-background px-3"
                />
              </div>
              <div className="space-y-2">
                <label className="font-medium">Client Secret</label>
                <PasswordInput
                  name="googleClientSecret"
                  defaultValue={google.clientSecret}
                  placeholder="Google OAuth client secret"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="font-medium">Redirect URI</label>
                <input
                  name="googleRedirectUri"
                  defaultValue={google.redirectUri}
                  placeholder="http://localhost:3000/api/auth/google/callback"
                  className="h-10 w-full rounded-md border bg-background px-3"
                />
                <p className="text-xs text-muted-foreground">
                  URI này phải khớp với Authorized redirect URI trong Google Cloud Console.
                </p>
              </div>
            </div>

            <AdminSubmitButton>Lưu cấu hình</AdminSubmitButton>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
