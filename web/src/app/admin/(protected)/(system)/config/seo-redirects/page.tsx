import { CheckCircle2, Link2, MoveRight, ToggleLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SeoRedirectsManager } from "@/features/admin/components/settings/seo-redirects-manager";
import { requireAdmin } from "@/lib/auth";
import { getSystemSettings } from "@/lib/system-settings";

export const dynamic = "force-dynamic";

export default async function AdminSeoRedirectsPage() {
  await requireAdmin();
  const settings = await getSystemSettings();
  const rules = settings.redirects.rules;
  const activeRules = rules.filter((rule) => rule.enabled);
  const permanentRules = rules.filter((rule) => rule.statusCode === 301);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 rounded-lg md:col-span-6 xl:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Total Redirects</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{rules.length}</p>
          </CardContent>
        </Card>
        <Card className="col-span-12 rounded-lg md:col-span-6 xl:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{activeRules.length}</p>
          </CardContent>
        </Card>
        <Card className="col-span-12 rounded-lg md:col-span-6 xl:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Permanent</CardTitle>
            <MoveRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{permanentRules.length}</p>
          </CardContent>
        </Card>
        <Card className="col-span-12 rounded-lg md:col-span-6 xl:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Temporary</CardTitle>
            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{rules.length - permanentRules.length}</p>
          </CardContent>
        </Card>
      </div>

      <SeoRedirectsManager rules={rules} />
    </section>
  );
}
