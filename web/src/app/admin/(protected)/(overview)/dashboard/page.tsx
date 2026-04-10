import { Button } from"@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Input } from"@/components/ui/input";

export default function AdminDashboardPage() {
 return (
 <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
  <div className="grid gap-4 md:grid-cols-3">
  <Card>
   <CardHeader>
   <CardTitle>Tổng đơn hàng</CardTitle>
   </CardHeader>
   <CardContent className="text-3xl">128</CardContent>
  </Card>
  <Card>
   <CardHeader>
   <CardTitle>Thành viên đang hoạt động</CardTitle>
   </CardHeader>
   <CardContent className="text-3xl">42</CardContent>
  </Card>
  <Card>
   <CardHeader>
   <CardTitle>Doanh thu</CardTitle>
   </CardHeader>
   <CardContent className="text-3xl">$2,480</CardContent>
  </Card>
  </div>

  <Card>
  <CardHeader>
   <CardTitle>Thao tác nhanh</CardTitle>
  </CardHeader>
  <CardContent className="flex flex-col gap-3 sm:flex-row">
   <Input placeholder="Search user/email..." />
   <Button>Search</Button>
  </CardContent>
  </Card>
 </section>
 );
}
