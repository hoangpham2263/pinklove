import { ConfigSectionsHub } from "@/features/admin/components/settings/config-sections-hub";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

const CONFIG_SECTIONS = [
  {
    title: "Nhận diện & giao diện",
    icon: "settings" as const,
    items: [
      {
        title: "Branding",
        description: "Quản lý tên site, logo và các icon nhận diện hiển thị trên toàn website.",
        href: ROUTES.ADMIN.CONFIG_BRANDING,
      },
      {
        title: "Thông báo",
        description: "Quản lý thông báo toàn site hiển thị dùng chung cho người dùng.",
        href: ROUTES.ADMIN.NOTIFICATIONS,
      },
    ],
  },
  {
    title: "Giao tiếp & đăng nhập",
    icon: "globe" as const,
    items: [
      {
        title: "Email",
        description: "Cấu hình sender, SMTP transport và card gửi demo cho email dùng chung toàn hệ thống.",
        href: ROUTES.ADMIN.CONFIG_EMAIL,
      },
      {
        title: "Đăng nhập bên thứ 3",
        description: "Cấu hình OAuth và các nhà cung cấp đăng nhập ngoài như Google.",
        href: ROUTES.ADMIN.CONFIG_THIRD_PARTY,
      },
      {
        title: "Bảo mật đăng nhập",
        description: "Cấu hình rate-limit cho public login để chặn brute-force trước khi verify mật khẩu.",
        href: ROUTES.ADMIN.CONFIG_SECURITY,
      },
    ],
  },
  {
    title: "SEO & Indexing",
    icon: "link" as const,
    items: [
      {
        title: "Breadcrumbs",
        description: "Thiết lập breadcrumb UI và breadcrumb schema cho toàn website.",
        href: ROUTES.ADMIN.CONFIG_BREADCRUMBS,
      },
      {
        title: "Open Graph",
        description: "Quản lý metadata social preview và ảnh mặc định khi share link.",
        href: ROUTES.ADMIN.CONFIG_OPENGRAPH,
      },
      {
        title: "Sitemap Index",
        description: "Xem realtime sitemap.xml, các sitemap con và số URL đang được xuất.",
        href: ROUTES.ADMIN.CONFIG_SITEMAP_INDEX,
      },
      {
        title: "Sitemap Settings",
        description: "Cấu hình sitemap groups, robots.txt và quyền index của website.",
        href: ROUTES.ADMIN.CONFIG_SITEMAP_SETTINGS,
      },
      {
        title: "SEO Redirects",
        description: "Quản lý chuyển hướng SEO có chủ đích, độc lập với route và slug trong source code.",
        href: ROUTES.ADMIN.CONFIG_SEO_REDIRECTS,
      },
    ],
  },
  {
    title: "Tài liệu SEO",
    icon: "docs" as const,
    items: [
      {
        title: "Page SEO",
        description: "Hướng dẫn nhập title, description, canonical, OG image và metadata cho từng page.",
        href: ROUTES.ADMIN.SEO_PAGES,
      },
      {
        title: "SEO Schema",
        description: "Tài liệu về structured data, breadcrumb schema và cách map dữ liệu theo page type.",
        href: ROUTES.ADMIN.SEO_SCHEMA,
      },
      {
        title: "SEO Rules",
        description: "Quy tắc vận hành nội dung SEO để hạn chế trùng intent và giữ index ổn định.",
        href: ROUTES.ADMIN.SEO_RULES,
      },
    ],
  },
  {
    title: "Bán hàng & thanh toán",
    icon: "settings" as const,
    items: [
      {
        title: "Ecommerce",
        description: "Cấu hình checkout, tiền tệ và vận chuyển dùng chung cho đơn hàng.",
        href: ROUTES.ADMIN.CONFIG_ECOMMERCE,
      },
      {
        title: "Shipping",
        description: "Kết nối nhiều bên vận chuyển, cấu hình phí ship và mapping địa chỉ lấy hàng.",
        href: ROUTES.ADMIN.CONFIG_SHIPPING,
      },
      {
        title: "Payment Methods",
        description: "Quản lý phương thức thanh toán, provider, hướng dẫn và thông tin nhận thanh toán.",
        href: ROUTES.ADMIN.CONFIG_PAYMENT_METHODS,
      },
    ],
  },
  {
    title: "Catalog & discovery",
    icon: "docs" as const,
    items: [
      {
        title: "Search Documents",
        description: "Kiểm tra dữ liệu index tìm kiếm đã sinh cho offering khi cần debug search.",
        href: ROUTES.ADMIN.CONFIG_SEARCH_DOCUMENTS,
      },
      {
        title: "Template Attributes",
        description: "Kiểm tra attribute phục vụ discovery/SEO cho template và offering.",
        href: ROUTES.ADMIN.CONFIG_TEMPLATE_ATTRIBUTES,
      },
    ],
  },
  {
    title: "Tích hợp & vận hành",
    icon: "globe" as const,
    items: [
      {
        title: "API nội bộ",
        description: "Trung tâm quản lý các API nội bộ dùng để import, đồng bộ và mở rộng kết nối dữ liệu hệ thống.",
        href: ROUTES.ADMIN.CONFIG_INTERNAL_APIS,
      },
      {
        title: "Hooks",
        description: "Thống kê toàn bộ hook point hiện có của website để nối đồng bộ với hệ thống ngoài.",
        href: ROUTES.ADMIN.HOOKS,
      },
      {
        title: "Backups",
        description: "Theo dõi backup database, uploads và hướng dẫn restore dữ liệu production.",
        href: ROUTES.ADMIN.CONFIG_BACKUPS,
      },
    ],
  },
] as const;

export default async function AdminSettingsPage() {
  await requireAdmin();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <ConfigSectionsHub sections={[...CONFIG_SECTIONS]} />
    </section>
  );
}
