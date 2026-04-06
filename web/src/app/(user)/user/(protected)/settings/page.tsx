import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { requireAppUser } from"@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function UserSettingsPage({ searchParams, }: { searchParams:Promise<{ saved ?: string; error ?: string }>; }) { await requireAppUser(ROUTES.AUTH.LOGIN);
 const params = await searchParams;
 const forbidden = params.error ==="forbidden";

 return (
 <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
 </section>
 ); }
