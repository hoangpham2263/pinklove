import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireAppUser, getUserProfile } from "@/lib/auth";
import { isVendorRole } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";

export default async function CustomerVendorPage() {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const profile = await getUserProfile(user.id);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Không gian nhà cung cấp</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Trang này dùng cho actor `VENDOR` để theo dõi thông tin vận hành nội bộ. Hiện tại hệ thống chưa có pipeline đơn hàng riêng cho nhà cung cấp, nên khu này tập trung vào thông tin tài khoản, điều phối và các điểm truy cập nhanh.
        </p>
      </div>

      {!isVendorRole(user.role) ? (
        <Card className="rounded-lg border-dashed">
          <CardHeader>
            <CardTitle>Vai trò hiện tại chưa phải vendor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Tài khoản này vẫn có thể truy cập khu customer chung, nhưng chưa được gắn actor `VENDOR`.</p>
            <Button variant="outline" render={<Link href={ROUTES.CUSTOMER.DASHBOARD}>Quay lại dashboard</Link>} />
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Tóm tắt tài khoản vendor</CardTitle>
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
              <p className="text-lg font-semibold">VENDOR</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Truy cập nhanh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline" render={<Link href={ROUTES.CUSTOMER.PROFILE}>Cập nhật hồ sơ nhà cung cấp</Link>} />
            <Button className="w-full justify-start" variant="outline" render={<Link href={ROUTES.CUSTOMER.SETTINGS}>Mở cài đặt tài khoản</Link>} />
            <Button className="w-full justify-start" variant="outline" render={<Link href={ROUTES.CUSTOMER.INVITATIONS}>Xem các thiệp đang quản lý</Link>} />
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Gợi ý mở rộng tiếp theo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Có thể bổ sung bảng đơn hàng cần xử lý cho vendor.</p>
          <p>Có thể thêm phân công sản phẩm hoặc năng lực cung ứng theo từng nhà cung cấp.</p>
          <p>Có thể thêm ghi chú nội bộ và đầu mối liên hệ cho từng vendor account trong admin.</p>
        </CardContent>
      </Card>
    </section>
  );
}
