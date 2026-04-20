import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  BookOpenText,
  Box,
  FileText,
  LayoutTemplate,
  MessageSquareQuote,
  Users,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { query } from "@/lib/database";
import { ROUTES } from "@/lib/routes";

type DashboardSummaryRow = {
  total_users: string;
  admin_users: string;
  customer_users: string;
  affiliate_users: string;
  vendor_users: string;
  total_products: string;
  published_products: string;
  draft_products: string;
  builder_products: string;
  coded_products: string;
  general_products: string;
  total_posts: string;
  published_posts: string;
  draft_posts: string;
  total_pages: string;
  published_pages: string;
  draft_pages: string;
  total_invitations: string;
  published_invitations: string;
  draft_invitations: string;
  affiliate_pending: string;
  affiliate_active: string;
};

type ActivityRow = {
  entity_type: "product" | "post" | "page" | "invitation" | "user";
  title: string;
  meta: string;
  status: string;
  updated_at: string;
};

function asNumber(value: string | undefined) {
  return Number(value ?? "0");
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

export default async function AdminDashboardPage() {
  const [summaryResult, activityResult] = await Promise.all([
    query<DashboardSummaryRow>(`
      SELECT
        (SELECT COUNT(*)::text FROM users) AS total_users,
        (SELECT COUNT(*)::text FROM users WHERE role = 'ADMIN') AS admin_users,
        (SELECT COUNT(*)::text FROM users WHERE role = 'CUSTOMER') AS customer_users,
        (SELECT COUNT(*)::text FROM users WHERE role = 'AFFILIATE') AS affiliate_users,
        (SELECT COUNT(*)::text FROM users WHERE role = 'VENDOR') AS vendor_users,
        (SELECT COUNT(*)::text FROM products) AS total_products,
        (SELECT COUNT(*)::text FROM products WHERE status = 'published') AS published_products,
        (SELECT COUNT(*)::text FROM products WHERE status = 'draft') AS draft_products,
        (SELECT COUNT(*)::text FROM products WHERE product_type = 'builder_template') AS builder_products,
        (SELECT COUNT(*)::text FROM products WHERE product_type = 'coded_template') AS coded_products,
        (SELECT COUNT(*)::text FROM products WHERE product_type = 'general_product') AS general_products,
        (SELECT COUNT(*)::text FROM blog_posts) AS total_posts,
        (SELECT COUNT(*)::text FROM blog_posts WHERE status = 'published') AS published_posts,
        (SELECT COUNT(*)::text FROM blog_posts WHERE status = 'draft') AS draft_posts,
        (SELECT COUNT(*)::text FROM managed_pages) AS total_pages,
        (SELECT COUNT(*)::text FROM managed_pages WHERE status = 'published') AS published_pages,
        (SELECT COUNT(*)::text FROM managed_pages WHERE status = 'draft') AS draft_pages,
        (SELECT COUNT(*)::text FROM wedding_sites) AS total_invitations,
        (SELECT COUNT(*)::text FROM wedding_sites WHERE status = 'published') AS published_invitations,
        (SELECT COUNT(*)::text FROM wedding_sites WHERE status = 'draft') AS draft_invitations,
        (SELECT COUNT(*)::text FROM affiliate_accounts WHERE status = 'pending') AS affiliate_pending,
        (SELECT COUNT(*)::text FROM affiliate_accounts WHERE status = 'active') AS affiliate_active
    `),
    query<ActivityRow>(`
      SELECT *
      FROM (
        SELECT
          'product'::text AS entity_type,
          name AS title,
          COALESCE(product_type, 'product') AS meta,
          status,
          updated_at
        FROM products
        UNION ALL
        SELECT
          'post'::text AS entity_type,
          title,
          COALESCE(slug, 'blog-post') AS meta,
          status,
          updated_at
        FROM blog_posts
        UNION ALL
        SELECT
          'page'::text AS entity_type,
          name AS title,
          COALESCE(slug, 'page') AS meta,
          status,
          updated_at
        FROM managed_pages
        UNION ALL
        SELECT
          'invitation'::text AS entity_type,
          title,
          COALESCE(site_type, 'invitation') AS meta,
          status,
          updated_at
        FROM wedding_sites
        UNION ALL
        SELECT
          'user'::text AS entity_type,
          username AS title,
          role AS meta,
          role AS status,
          created_at AS updated_at
        FROM users
      ) activity_feed
      ORDER BY updated_at DESC
      LIMIT 8
    `),
  ]);

  const summary = summaryResult.rows[0];
  const totalUsers = asNumber(summary?.total_users);
  const totalProducts = asNumber(summary?.total_products);
  const totalPosts = asNumber(summary?.total_posts);
  const totalInvitations = asNumber(summary?.total_invitations);
  const totalPages = asNumber(summary?.total_pages);

  const spotlightCards = [
    {
      title: "Danh mục đang vận hành",
      value: totalProducts,
      description: `${asNumber(summary?.published_products)} đã xuất bản, ${asNumber(summary?.draft_products)} bản nháp`,
      detail: `${asNumber(summary?.builder_products)} builder / ${asNumber(summary?.coded_products)} coded / ${asNumber(summary?.general_products)} san pham`,
      icon: Box,
      href: ROUTES.ADMIN.PRODUCT_LIST,
    },
    {
      title: "Dòng nội dung",
      value: totalPosts + totalPages,
      description: `${totalPosts} bài blog, ${totalPages} trang quản lý`,
      detail: `${asNumber(summary?.published_posts) + asNumber(summary?.published_pages)} nội dung đang hiển thị`,
      icon: FileText,
      href: ROUTES.ADMIN.BLOG_POSTS,
    },
    {
      title: "Triển khai khách hàng",
      value: totalInvitations,
      description: `${asNumber(summary?.published_invitations)} thiệp đã xuất bản`,
      detail: `${asNumber(summary?.draft_invitations)} bản nháp đang hoàn thiện`,
      icon: LayoutTemplate,
      href: ROUTES.CUSTOMER.INVITATIONS,
    },
    {
      title: "Phạm vi tài khoản",
      value: totalUsers,
      description: `${asNumber(summary?.customer_users)} khách hàng, ${asNumber(summary?.vendor_users)} nhà cung cấp`,
      detail: `${asNumber(summary?.affiliate_users)} cộng tác viên, ${asNumber(summary?.admin_users)} quản trị viên`,
      icon: Users,
      href: ROUTES.ADMIN.USERS,
    },
  ];

  const operationalGroups = [
    {
      title: "Tài khoản",
      icon: Users,
      metrics: [
        { label: "Quản trị viên", value: asNumber(summary?.admin_users) },
        { label: "Khách hàng", value: asNumber(summary?.customer_users) },
        { label: "Cộng tác viên", value: asNumber(summary?.affiliate_users) },
        { label: "Nhà cung cấp", value: asNumber(summary?.vendor_users) },
      ],
      href: ROUTES.ADMIN.USERS,
    },
    {
      title: "Chương trình affiliate",
      icon: BadgePercent,
      metrics: [
        { label: "Chờ duyệt", value: asNumber(summary?.affiliate_pending) },
        { label: "Đang hoạt động", value: asNumber(summary?.affiliate_active) },
      ],
      href: ROUTES.ADMIN.AFFILIATES,
    },
    {
      title: "Trạng thái xuất bản",
      icon: MessageSquareQuote,
      metrics: [
        { label: "Trang đang chạy", value: asNumber(summary?.published_pages) },
        { label: "Trang nháp", value: asNumber(summary?.draft_pages) },
        { label: "Bài viết đang chạy", value: asNumber(summary?.published_posts) },
        { label: "Bài viết nháp", value: asNumber(summary?.draft_posts) },
      ],
      href: ROUTES.ADMIN.PAGES,
    },
  ];

  const quickLinks = [
    { label: "Quản lý sản phẩm", href: ROUTES.ADMIN.PRODUCT_LIST },
    { label: "Viết nội dung blog", href: ROUTES.ADMIN.BLOG_POSTS },
    { label: "Rà soát tài khoản khách hàng", href: ROUTES.ADMIN.CUSTOMERS },
    { label: "Kiểm tra affiliate", href: ROUTES.ADMIN.AFFILIATES },
    { label: "Mở thư viện media", href: ROUTES.ADMIN.MEDIA },
    { label: "Cập nhật cấu hình", href: ROUTES.ADMIN.CONFIG },
  ];

  return (
    <section className="flex w-full flex-1 flex-col gap-6 px-5 py-5 md:px-7 md:py-7">
      <div className="overflow-hidden rounded-[28px] border border-border/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,244,246,0.94))] shadow-sm">
        <div className="grid gap-5 px-5 py-6 md:grid-cols-[minmax(0,1.4fr)_360px] md:px-7 md:py-7">
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium tracking-[0.22em] text-primary uppercase">
              Tổng quan admin
            </div>
            <div className="space-y-2">
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Góc nhìn vận hành rõ ràng hơn cho nội dung, danh mục và triển khai khách hàng.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                Dashboard này lấy số liệu trực tiếp từ users, products, blog, managed pages, invitations và affiliate accounts để khu vực quản trị vận hành như một control panel thực tế thay vì giao diện mẫu.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button render={<Link href={ROUTES.ADMIN.PRODUCT_LIST}>Mở sản phẩm</Link>} />
              <Button variant="outline" render={<Link href={ROUTES.ADMIN.BLOG_POSTS}>Xem luồng blog</Link>} />
            </div>
          </div>

          <Card className="border-white/70 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardDescription>Điểm cần chú ý hôm nay</CardDescription>
              <CardTitle>Trạng thái triển khai</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
                <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">Thiệp đã xuất bản</p>
                <p className="mt-2 text-3xl font-semibold">{asNumber(summary?.published_invitations)}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
                  <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">Thiệp nháp</p>
                  <p className="mt-2 text-2xl font-semibold">{asNumber(summary?.draft_invitations)}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
                  <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">Affiliate chờ duyệt</p>
                  <p className="mt-2 text-2xl font-semibold">{asNumber(summary?.affiliate_pending)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {spotlightCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.title} className="border-border/70 shadow-sm">
              <CardHeader className="gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardDescription>{card.title}</CardDescription>
                    <CardTitle className="mt-1 text-4xl">{card.value}</CardTitle>
                  </div>
                  <div className="rounded-2xl bg-primary/8 p-3 text-primary">
                    <Icon className="size-5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">{card.description}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{card.detail}</p>
                </div>
                <Button
                  variant="ghost"
                  className="h-auto justify-start px-0 text-sm font-medium text-primary hover:bg-transparent"
                  render={
                    <Link href={card.href}>
                      Xem chi tiết
                      <ArrowRight className="size-4" />
                    </Link>
                  }
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_380px]">
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            {operationalGroups.map((group) => {
              const Icon = group.icon;

              return (
                <Card key={group.title} className="border-border/70 shadow-sm">
                  <CardHeader className="gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-muted p-3 text-foreground">
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{group.title}</CardTitle>
                        <CardDescription>Số liệu vận hành trực tiếp</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {group.metrics.map((metric) => (
                      <div key={metric.label} className="flex items-center justify-between rounded-2xl border border-border/60 px-3 py-2.5">
                        <span className="text-sm text-muted-foreground">{metric.label}</span>
                        <span className="text-lg font-semibold">{metric.value}</span>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      className="w-full"
                      render={<Link href={group.href}>Mở khu vực</Link>}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardDescription>Cập nhật mới trên toàn hệ thống</CardDescription>
              <CardTitle>Hoạt động gần đây</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activityResult.rows.map((item, index) => (
                <div
                  key={`${item.entity_type}-${item.title}-${item.updated_at}-${index}`}
                  className="flex flex-col gap-2 rounded-2xl border border-border/60 px-4 py-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.entity_type} • {formatStatus(item.meta)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="rounded-full bg-muted px-2.5 py-1 capitalize text-muted-foreground">
                      {formatStatus(item.status)}
                    </span>
                    <span className="text-muted-foreground">{formatDateTime(item.updated_at)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardDescription>Các thao tác thường dùng</CardDescription>
              <CardTitle>Truy cập nhanh</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {quickLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between rounded-2xl border border-border/60 px-4 py-3 text-sm font-medium transition hover:border-primary/35 hover:bg-primary/5"
                >
                  <span>{item.label}</span>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardDescription>Cân bằng giữa nội dung và storefront</CardDescription>
              <CardTitle>Tỷ trọng hệ thống</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-border/60 px-4 py-4">
                <div className="mb-3 flex items-center gap-2">
                  <BookOpenText className="size-4 text-primary" />
                  <p className="font-medium">Bề mặt nội dung</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {asNumber(summary?.published_pages)} trang đã xuất bản và {asNumber(summary?.published_posts)} bài viết đã xuất bản đang hỗ trợ tăng trưởng và SEO.
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 px-4 py-4">
                <div className="mb-3 flex items-center gap-2">
                  <LayoutTemplate className="size-4 text-primary" />
                  <p className="font-medium">Mức sẵn sàng của builder</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Hiện có {asNumber(summary?.builder_products)} mẫu builder, {asNumber(summary?.coded_products)} mẫu coded và {asNumber(summary?.general_products)} sản phẩm trong catalog.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
