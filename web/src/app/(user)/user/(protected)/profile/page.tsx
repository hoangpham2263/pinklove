import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { ProfileForm } from"@/features/user/components/profile-form";
import { getUserProfile, requireAppUser } from"@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function UserProfilePage() { const user = await requireAppUser(ROUTES.AUTH.LOGIN);
 const profile = await getUserProfile(user.id);

 return (
 <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
 

 <Card>
 <CardHeader>
 <CardTitle>Cài đặt Thông tin cá nhân</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <ProfileForm initialProfile={profile } />
 </CardContent>
 </Card>
 </section>
 ); }
