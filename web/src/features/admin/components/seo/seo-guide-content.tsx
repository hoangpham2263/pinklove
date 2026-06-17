import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminActionLinkTile } from "@/features/admin/components/admin-buttons";
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

function SeoQuickLinks() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Đi nhanh</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <AdminActionLinkTile href={ROUTES.ADMIN.PAGES} label="Vào quản lý Pages" />
        <AdminActionLinkTile href={ROUTES.ADMIN.OFFERING_LIST} label="Vào quản lý Offerings" />
      </CardContent>
    </Card>
  );
}

export function SeoPagesGuideContent() {
  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="space-y-8 lg:col-span-8">
        <Card>
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
      </div>

      <div className="space-y-6 lg:col-span-4">
        <Card>
          <CardHeader>
            <CardTitle>Áp dụng cho đâu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
            <p>Trang này áp dụng cho các page nằm trong `Admin &gt; Pages` như home, gioi-thieu, lien-he, mau-thiep, dich-vu, cong-cu, blog, login, register.</p>
            <p>Các route động như blog post, template detail, builder detail vẫn đi theo dữ liệu item thật, không lấy từ page tĩnh.</p>
          </CardContent>
        </Card>

        <SeoQuickLinks />
      </div>
    </div>
  );
}

export function SeoSchemaGuideContent() {
  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="space-y-8 lg:col-span-8">
        <Card>
          <CardHeader>
            <CardTitle>Mẫu JSON-LD dùng nhanh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium">1. Page thường</p>
              <pre className="overflow-hidden whitespace-pre-wrap break-words rounded-xl bg-muted p-4 text-xs leading-6 lg:rounded-2xl">
                <code>{pageSchemaExample}</code>
              </pre>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">2. Trang gói dịch vụ</p>
              <pre className="overflow-hidden whitespace-pre-wrap break-words rounded-xl bg-muted p-4 text-xs leading-6 lg:rounded-2xl">
                <code>{serviceSchemaExample}</code>
              </pre>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">3. Trang có FAQ</p>
              <pre className="overflow-hidden whitespace-pre-wrap break-words rounded-xl bg-muted p-4 text-xs leading-6 lg:rounded-2xl">
                <code>{faqSchemaExample}</code>
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6 lg:col-span-4">
        <Card>
          <CardHeader>
            <CardTitle>Lưu ý khi nhập schema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
            <p>Schema phải là JSON hợp lệ, không thêm comment hoặc dấu phẩy thừa.</p>
            <p>Chỉ nhập schema đúng với mục đích của page, không nhét nhiều loại schema không liên quan.</p>
            <p>Nếu page không có dữ liệu thật để hỗ trợ schema, đừng cố khai báo cho đủ.</p>
          </CardContent>
        </Card>

        <SeoQuickLinks />
      </div>
    </div>
  );
}

export function SeoRulesGuideContent() {
  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="space-y-8 lg:col-span-8">
        <Card>
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
            <CardTitle>Checklist nhanh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
            <p>Mỗi page có title, description, canonical và OG image rõ ràng.</p>
            <p>Chỉ publish khi nội dung chính của page đã hoàn chỉnh và đúng ý định tìm kiếm.</p>
            <p>Không để nhiều page khác nhau tranh cùng một từ khóa chính.</p>
          </CardContent>
        </Card>

        <SeoQuickLinks />
      </div>
    </div>
  );
}
