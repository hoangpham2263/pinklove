import { notFound } from"next/navigation";
import { requireAdmin, getUserAccount, getUserProfile } from"@/lib/auth";
import { AdminBackButton } from "@/features/admin/components/admin-buttons";
import { EditUserForm } from "@/features/admin/components/users/edit-user-form";
import { ROUTES } from "@/lib/routes";

type EditUserPageProps = {
 params: Promise<{ id: string }>;
 searchParams: Promise<{ saved?: string; error?: string; returnTo?: string }>;
};

export default async function EditUserPage({ params, searchParams }: EditUserPageProps) {
 const actor = await requireAdmin();
 const { id } = await params;
 const userId = id;
 const query = await searchParams;
 const returnTo = typeof query.returnTo === "string" && query.returnTo.trim().length > 0 ? query.returnTo : ROUTES.ADMIN.USERS;

 const user = await getUserAccount(userId);
 if (!user) return notFound();

 const profile = await getUserProfile(userId);

 return (
 <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
 <div className="flex items-center gap-4">
 <AdminBackButton href={returnTo} destinationLabel="Users" />
 <h1 className="text-2xl font-bold tracking-tight">Chỉnh sửa người dùng: {user.username}</h1>
 </div>
 <EditUserForm actor={actor} user={user} profile={profile} returnTo={returnTo} />
 </section>
 );
}
