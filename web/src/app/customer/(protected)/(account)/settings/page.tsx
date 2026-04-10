import { requireAppUser } from"@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function CustomerSettingsPage({ searchParams, }: { searchParams:Promise<{ saved ?: string; error ?: string }>; }) { await requireAppUser(ROUTES.AUTH.LOGIN);
 await searchParams;

 return (
 <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
 </section>
 ); }
