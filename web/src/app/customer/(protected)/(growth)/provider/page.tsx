import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getUserProfile, requireAppUser } from "@/lib/auth";
import { isProviderRole } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";

export default async function CustomerProviderPage() {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const profile = await getUserProfile(user.id);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Không gian nhà cung cấp</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Trang này dùng cho actor `PROVIDER` để đi nhanh vào khu vận hành riêng. Provider hiện đã có portal đơn hàng, khu nhập hồ sơ dịch vụ/sản phẩm và thông báo review từ admin, nên màn này chỉ giữ vai trò bridge điều hướng.
        </p>
      </div>

      {!isProviderRole(user.role) ? (
        <Card className="rounded-lg border-dashed">
          <CardHeader>
            <CardTitle>Vai trò hiện tại chưa phải provider</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Tài khoản này vẫn có thể truy cập khu customer chung, nhưng chưa được gắn actor `PROVIDER`.</p>
            <Button variant="outline" render={<Link href={ROUTES.CUSTOMER.DASHBOARD}>Quay lại dashboard</Link>} />
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Tóm tắt tài khoản provider</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Tên đăng nhập</p>
              <p className="text-lg font-semibold">{user.username}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Tên hiển thị</p>
              <p className="text-lg font-semibold">{profile.displayName || profile.fullName || "Chưa cập nhật"}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Điện thoại</p>
              <p className="text-lg font-semibold">{profile.phone || "Chưa cập nhật"}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Vai trò</p>
              <p className="text-lg font-semibold">PROVIDER</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Truy cập nhanh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isProviderRole(user.role) ? (
              <Button className="w-full justify-start" variant="outline" render={<Link href={ROUTES.PROVIDER.ROOT}>Mở portal provider</Link>} />
            ) : null}
            {isProviderRole(user.role) ? (
              <Button className="w-full justify-start" variant="outline" render={<Link href={ROUTES.PROVIDER.OFFERINGS}>Quản lý hồ sơ dịch vụ/sản phẩm provider</Link>} />
            ) : null}
            {isProviderRole(user.role) ? (
              <Button className="w-full justify-start" variant="outline" render={<Link href={ROUTES.PROVIDER.ORDERS}>Mở danh sách đơn provider</Link>} />
            ) : null}
            <Button className="w-full justify-start" variant="outline" render={<Link href={ROUTES.CUSTOMER.CONFIG_PROFILE}>Cập nhật hồ sơ nhà cung cấp</Link>} />
            <Button className="w-full justify-start" variant="outline" render={<Link href={ROUTES.CUSTOMER.CONFIG}>Mở configs tài khoản</Link>} />
            <Button className="w-full justify-start" variant="outline" render={<Link href={ROUTES.CUSTOMER.INVITATIONS}>Xem các thiệp đang quản lý</Link>} />
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Flow hiện tại</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Provider tự tạo hoặc cập nhật hồ sơ dịch vụ/sản phẩm ở khu provider.</p>
          <p>Admin review theo dạng table, nhập giá bán thực tế rồi mới duyệt vào catalog live.</p>
          <p>Mọi cập nhật review sẽ đi về thông báo để provider xử lý tiếp mà không cần đụng trực tiếp vào dịch vụ/sản phẩm đang bán.</p>
        </CardContent>
      </Card>
    </section>
  );
}
