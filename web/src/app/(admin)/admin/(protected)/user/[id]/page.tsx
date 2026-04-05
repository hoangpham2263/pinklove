import { notFound } from"next/navigation";
import Link from"next/link";
import { requireAdmin, getUserAccount, getUserProfile } from"@/lib/auth";
import { NativeForm } from"@/components/common/native-form";
import { Button } from"@/components/ui/button";
import { Input } from"@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { ChevronLeft } from"lucide-react";

type EditUserPageProps = {
 params: Promise<{ id: string }>;
 searchParams: Promise<{ saved?: string; error?: string }>;
};

export default async function EditUserPage({ params, searchParams }: EditUserPageProps) {
 const actor = await requireAdmin();
 const { id } = await params;
 const userId = parseInt(id, 10);
 
 if (isNaN(userId)) return notFound();

 const user = await getUserAccount(userId);
 if (!user) return notFound();

 const profile = await getUserProfile(userId);
 const query = await searchParams;
 const isSaved = query.saved ==="updated";
 const error = query.error;

 return (
 <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
  <div className="flex items-center gap-4">
  <Link href="/admin/user">
   <Button variant="outline" size="sm">
   <ChevronLeft className="mr-2 h-4 w-4" />
   Quay lại
   </Button>
  </Link>
  </div>

  <NativeForm action="/api/admin/users/update" method="POST" className="flex flex-col lg:flex-row gap-6">
  <input type="hidden" name="userId" value={user.id} />

  <div className="flex-1 space-y-6">
   <Card>
   <CardHeader>
    <CardTitle>Tài khoản</CardTitle>
   </CardHeader>
   <CardContent className="grid gap-4 md:grid-cols-2">
    <div className="space-y-2">
    <label>Tên đăng nhập</label>
    <Input
     name="username"
     defaultValue={user.username}
     placeholder=""
     required
    />
    </div>

    <div className="space-y-2">
    <label>Mật khẩu mới (để trống nếu không đổi)</label>
    <Input
     name="password"
     type="password"
     placeholder=""
    />
    </div>
   </CardContent>
   </Card>

   <Card>
   <CardHeader>
    <CardTitle>Hồ sơ (Profile)</CardTitle>
   </CardHeader>
   <CardContent className="grid gap-4 md:grid-cols-2">
    <div className="space-y-2">
    <label>Họ và tên</label>
    <Input
     name="fullName"
     defaultValue={profile?.fullName ??""}
     placeholder=""
    />
    </div>
    <div className="space-y-2">
    <label>Tên hiển thị</label>
    <Input
     name="displayName"
     defaultValue={profile?.displayName ??""}
     placeholder=""
    />
    </div>
    <div className="space-y-2">
    <label>Số điện thoại</label>
    <Input
     name="phone"
     defaultValue={profile?.phone ??""}
     placeholder=""
    />
    </div>
    <div className="space-y-2 md:col-span-2">
    <label>Tiểu sử (Bio)</label>
    <textarea
     name="bio"
     defaultValue={profile?.bio ??""}
     rows={3}
     className="flex min-h-[80px] w-full rounded-lg border border-input bg-transparent px-3 py-2 focus:outline-none"
     placeholder=""
    />
    </div>
   </CardContent>
   </Card>
  </div>

  <div className="w-full lg:w-80 space-y-6 shrink-0">
   <Card>
   <CardHeader>
    <CardTitle>Settings</CardTitle>
   </CardHeader>
   <CardContent className="space-y-4">
    <div className="space-y-2">
    <label className="font-medium">Vai trò</label>
    <select
     name="role"
     defaultValue={user.role}
     disabled={user.id === actor.id}
     className="flex h-10 w-full rounded-lg border border-input bg-background px-3 focus:outline-none disabled:opacity-50"
    >
     <option value="user">user</option>
     <option value="admin">admin</option>
    </select>
    </div>
    <Button type="submit" className="w-full">
    Lưu thay đổi
    </Button>
   </CardContent>
   </Card>
  </div>
  </NativeForm>
 </section>
 );
}
