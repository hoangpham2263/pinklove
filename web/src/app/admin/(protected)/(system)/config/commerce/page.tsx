import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { requireAdmin } from "@/lib/auth";

type PlatformCard = {
  name: string;
  status: "Draft UI" | "Ready For Logic";
  description: string;
  fields: string[];
};

const PLATFORM_CARDS: PlatformCard[] = [
  {
    name: "Shopee",
    status: "Ready For Logic",
    description: "Chuẩn bị kết nối shop, đồng bộ sản phẩm và nhận webhook đơn hàng từ Shopee.",
    fields: ["Shop ID", "Partner ID", "Partner Key", "Redirect URL", "Webhook Secret"],
  },
  {
    name: "TikTok Shop",
    status: "Ready For Logic",
    description: "Khung kết nối TikTok Shop để đồng bộ catalog, token và trạng thái đơn hàng.",
    fields: ["App Key", "App Secret", "Shop Cipher", "Access Token", "Webhook URL"],
  },
  {
    name: "Lazada",
    status: "Draft UI",
    description: "Khu vực cấu hình cơ bản cho API Lazada và mapping gian hàng theo tenant sau này.",
    fields: ["App Key", "App Secret", "Seller ID", "Region", "Callback URL"],
  },
  {
    name: "Meta Catalog",
    status: "Draft UI",
    description: "Dùng cho luồng đẩy sản phẩm sang catalog quảng cáo và dynamic ads khi cần.",
    fields: ["Catalog ID", "Pixel ID", "Access Token", "Feed URL"],
  },
];

export default async function AdminCommerceConnectionsPage() {
  await requireAdmin();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Commerce Connections</h1>
        <p className="text-sm text-muted-foreground">
          Trang này chỉ dựng giao diện trước cho các kết nối sàn thương mại điện tử và catalog. Chưa có logic lưu dữ liệu, auth flow hay webhook processing.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tổng nền tảng</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{PLATFORM_CARDS.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Đã bật UI</CardTitle>
          </CardHeader>
          <CardContent>
            <p>4</p>
            <p className="text-sm text-muted-foreground">Chưa có persist</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Webhook Ready</CardTitle>
          </CardHeader>
          <CardContent>
            <p>0</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Token Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Pending</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Cấu hình chung</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="flex items-center justify-between gap-3 rounded-lg border p-4">
            <div className="space-y-1">
              <p className="font-medium">Cho phép đồng bộ sản phẩm</p>
              <p className="text-sm text-muted-foreground">UI only, chưa có job đồng bộ.</p>
            </div>
            <Switch checked={false} />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-lg border p-4">
            <div className="space-y-1">
              <p className="font-medium">Bật nhận webhook</p>
              <p className="text-sm text-muted-foreground">UI only, chưa có endpoint xử lý.</p>
            </div>
            <Switch checked={false} />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-lg border p-4">
            <div className="space-y-1">
              <p className="font-medium">Tự đẩy trạng thái đơn</p>
              <p className="text-sm text-muted-foreground">UI only, chưa map order state.</p>
            </div>
            <Switch checked={false} />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-lg border p-4">
            <div className="space-y-1">
              <p className="font-medium">Log request debug</p>
              <p className="text-sm text-muted-foreground">UI only, chưa có storage cho log.</p>
            </div>
            <Switch checked />
          </label>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        {PLATFORM_CARDS.map((platform) => (
          <Card key={platform.name} className="rounded-lg">
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div className="space-y-1">
                <CardTitle>{platform.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{platform.description}</p>
              </div>
              <Badge variant="secondary">{platform.status}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {platform.fields.map((field) => (
                  <div key={field} className="space-y-2">
                    <label className="text-sm font-medium">{field}</label>
                    <Input placeholder={`Nhập ${field}`} />
                  </div>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <button type="button" className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium transition hover:bg-muted">
                  Test kết nối
                </button>
                <button type="button" className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium transition hover:bg-muted">
                  Xem log mẫu
                </button>
                <button type="button" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90">
                  Lưu cấu hình
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
