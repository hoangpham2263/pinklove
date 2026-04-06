import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";

export default async function AdminSettingsPage() {
  await requireAdmin();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Cài đặt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-md bg-muted/50 border">
            <p className="font-medium">Không có cài đặt quản trị có thể thay đổi ở thời điểm hiện tại.</p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
