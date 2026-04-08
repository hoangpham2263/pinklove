import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

const pageSchemaExample = `{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Mẫu thiệp cưới online",
  "description": "Danh sách mẫu thiệp cưới online để chọn và chỉnh sửa nhanh."
}`;

const serviceSchemaExample = `[
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Free Plan",
    "description": "Bắt đầu nhanh với nhu cầu cơ bản."
  },
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Premium Plan",
    "description": "Tùy chỉnh sâu hơn theo yêu cầu."
  }
]`;

const faqSchemaExample = `{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Tôi nên liên hệ qua kênh nào để được phản hồi nhanh?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Hãy ưu tiên Zalo hoặc Facebook để trao đổi trực tiếp."
      }
    }
  ]
}`;

export default async function AdminSeoGuidePage() {
  await requireAdmin();

  return (
    <section className="flex w-full flex-1 flex-col gap-8 p-4 md:p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Hướng dẫn nhập SEO</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Dùng trang này để nhập SEO đúng chuẩn cho các page đang quản lý trong admin. Tất cả page tĩnh/public
          hiện đã đọc metadata và JSON-LD từ dữ liệu page, không cần sửa code.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          <Card id="page-seo">
            <CardHeader>
              <CardTitle>Nhập gì ở đâu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">Page Name</p>
                <p>Tên nội bộ để phân biệt page trong admin.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Slug</p>
                <p>Đường dẫn page. Chỉ đổi khi thật sự cần, vì đổi slug có thể làm đổi URL đang index.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Page Title (H1)</p>
                <p>Tiêu đề chính hiển thị trên trang. Đây không bắt buộc phải giống SEO Title.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Excerpt</p>
                <p>Mô tả ngắn hiển thị trên page. Nếu chưa nhập SEO Description thì hệ thống có thể lấy từ đây.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">SEO Title</p>
                <p>Nên giữ khoảng 50-60 ký tự, từ khóa chính nên nằm gần đầu câu.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">SEO Description</p>
                <p>Nên giữ khoảng 120-160 ký tự, mô tả rõ ý định tìm kiếm và lời hứa của trang.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Canonical URL</p>
                <p>Dùng khi bạn muốn xác định URL chuẩn tuyệt đối cho page.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Featured Image / OG Image</p>
                <p>Chọn ảnh từ media để dùng cho chia sẻ Facebook, Zalo và Twitter/X.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Structured Data JSON-LD</p>
                <p>Nhập schema hợp lệ dưới dạng JSON. Đây là nơi thay cho phần schema hardcode trong code ở các page tĩnh.</p>
              </div>
            </CardContent>
          </Card>

          <Card id="seo-content">
            <CardHeader>
              <CardTitle>Mẫu JSON-LD dùng nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm font-medium">1. Page thường</p>
                <pre className="overflow-x-auto rounded-xl bg-muted p-4 text-xs leading-6 lg:rounded-2xl">
                  <code>{pageSchemaExample}</code>
                </pre>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">2. Trang gói dịch vụ</p>
                <pre className="overflow-x-auto rounded-xl bg-muted p-4 text-xs leading-6 lg:rounded-2xl">
                  <code>{serviceSchemaExample}</code>
                </pre>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">3. Trang có FAQ</p>
                <pre className="overflow-x-auto rounded-xl bg-muted p-4 text-xs leading-6 lg:rounded-2xl">
                  <code>{faqSchemaExample}</code>
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card id="seo-robots">
            <CardHeader>
              <CardTitle>Quy tắc nhập để ổn định SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
              <p>Không nhồi nhiều từ khóa trong title hoặc description.</p>
              <p>Mỗi page nên có một ý định tìm kiếm chính, đừng gộp quá nhiều chủ đề vào cùng một trang.</p>
              <p>Ảnh OG nên rõ chủ đề, tỷ lệ ngang, ưu tiên 1200x630 hoặc tương đương.</p>
              <p>JSON-LD phải là JSON hợp lệ, dùng dấu ngoặc kép tiêu chuẩn, không thêm comment.</p>
              <p>`noindex` chỉ bật cho page không muốn Google index thật sự, ví dụ page test hoặc page tạm.</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Áp dụng cho đâu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
              <p>Trang này áp dụng cho các page nằm trong `Admin &gt; Pages` như home, about-us, contact, templates, builder, services, tools, blog, login, register.</p>
              <p>Các route động như blog post, template detail, builder detail vẫn đi theo dữ liệu item thật, không lấy từ page tĩnh.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Đi nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Link href="/admin/pages" className="block rounded-xl border px-4 py-3 transition hover:bg-muted lg:rounded-2xl">
                Vào quản lý Pages
              </Link>
              <Link href={ROUTES.ADMIN.PRODUCTS} className="block rounded-xl border px-4 py-3 transition hover:bg-muted lg:rounded-2xl">
                Vào quản lý Products
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
