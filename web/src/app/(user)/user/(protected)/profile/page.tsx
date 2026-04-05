import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { ProfileForm } from"@/features/user/components/profile-form";
import { getUserProfile, requireAppUser } from"@/lib/auth";

export default async function UserProfilePage() { const user = await requireAppUser("/user/login");
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
