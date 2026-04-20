import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AboutContent } from "@/app/(guest)/(marketing)/about/_components/about-content";
import {
  GuestInput,
  GuestLinkButton,
  GuestPanel,
  GuestPanelBody,
  GuestPanelHeader,
  GuestPanelTitle,
  GuestShell,
} from "@/app/(guest)/_components/guest-ui";
import { ContactContent } from "@/app/(guest)/(marketing)/contact/_components/contact-content";
import { HomeContent } from "@/app/(guest)/_components/home-content";
import { ManagedPageBreadcrumb } from "@/components/common/managed-page-breadcrumb";
import { PageStructuredData } from "@/components/common/page-structured-data";
import { BlogTabs } from "@/features/blog/components/blog-tabs";
import { listPublishedBlogCategories, listPublishedBlogPosts } from "@/features/blog/server/service";
import { LoopProductCard } from "@/features/products/components/LoopProductCard";
import { listPublishedProducts, listPublishedProductsByType } from "@/features/products/server/service";
import {
  buildManagedPageMetadata,
  getAccessiblePageBySlug,
  listManagedPages,
  type ManagedPage,
} from "@/lib/managed-pages";
import { getManagedPagePath } from "@/lib/page-paths";
import { getBuilderProductPath, getTemplateProductPath, sanitizePermalinkConfig } from "@/lib/public-paths";
import { createRichTextMarkup, RICH_TEXT_CONTENT_CLASSNAME } from "@/lib/rich-text";
import { ROUTES } from "@/lib/routes";
import { getCurrentUser } from "@/lib/auth";
import { getSystemSettings } from "@/lib/system-settings";

type ManagedSearchParams = Promise<Record<string, string | string[] | undefined>> | undefined;

const plans = [
  {
    name: "Free Plan",
    price: "0đ",
    summary: "Bắt đầu nhanh với nhu cầu cơ bản.",
    features: [
      "Dùng mẫu thiệp có sẵn",
      "Tự chỉnh nội dung cơ bản",
      "Xuất bản 1 thiệp",
      "Phù hợp để thử nghiệm ban đầu",
    ],
  },
  {
    name: "Basic Plan",
    price: "499.000đ",
    summary: "Phù hợp cho nhu cầu triển khai thực tế, gọn và đủ dùng.",
    features: [
      "Dùng mẫu có sẵn và starter builder",
      "Tùy chỉnh nội dung đầy đủ",
      "Ưu tiên hỗ trợ khi setup",
      "Phù hợp cho đa số cặp đôi",
    ],
  },
  {
    name: "Premium Plan",
    price: "1.490.000đ",
    summary: "Dành cho nhu cầu chỉn chu hơn và cần hỗ trợ sâu hơn.",
    features: [
      "Tùy chỉnh sâu hơn theo yêu cầu",
      "Ưu tiên hỗ trợ nhanh",
      "Định hướng giao diện và nội dung",
      "Phù hợp khi cần trải nghiệm riêng",
    ],
  },
];

const budgetCategories = [
  { label: "Nhà hàng", percent: "50%" },
  { label: "Chụp ảnh", percent: "15%" },
  { label: "Trang phục", percent: "10%" },
  { label: "Trang trí", percent: "10%" },
  { label: "Thiệp & in ấn", percent: "5%" },
  { label: "Khác", percent: "10%" },
];

async function isPreviewRequest(searchParams?: ManagedSearchParams) {
  const resolvedSearchParams = (await searchParams) ?? {};
  return resolvedSearchParams.preview === "1";
}

export async function generateManagedPageMetadata(slug: string, searchParams?: ManagedSearchParams): Promise<Metadata> {
  const page = await getAccessiblePageBySlug(slug, {
    preview: await isPreviewRequest(searchParams),
  });

  return page ? buildManagedPageMetadata(page) : {};
}

export async function loadManagedPageForRoute(
  slug: string,
  requestPath: string,
  searchParams?: ManagedSearchParams
): Promise<ManagedPage> {
  const preview = await isPreviewRequest(searchParams);
  const page = await getAccessiblePageBySlug(slug, { preview });

  if (!page) {
    notFound();
  }

  const targetPath = getManagedPagePath(page);
  const settings = await getSystemSettings();

  if (!preview && settings.permalink.legacyRedirects && targetPath !== requestPath) {
    redirect(targetPath);
  }

  return page;
}

function PageHero({ page, fallbackTitle, fallbackExcerpt }: { page: ManagedPage; fallbackTitle: string; fallbackExcerpt: string }) {
  return (
    <div className="mx-auto max-w-3xl space-y-4 text-center">
      <ManagedPageBreadcrumb page={page} />
      <h1 className="text-2xl font-semibold text-stone-950 sm:text-3xl lg:text-4xl 2 xl:text-5xl">{page.title || fallbackTitle}</h1>
      <p className="text-sm leading-8 text-stone-600 md:text-base lg:text-lg">
        {page.excerpt || fallbackExcerpt}
      </p>
    </div>
  );
}

function GenericManagedPage({ page }: { page: ManagedPage }) {
  return (
    <GuestShell className="gap-10 py-12">
      <PageStructuredData page={page} />
      <PageHero
        page={page}
        fallbackTitle={page.name}
        fallbackExcerpt={page.excerpt || "Nội dung trang đang được cập nhật."}
      />

      <div className="mx-auto w-full max-w-4xl rounded-xl border border-stone-200 bg-white px-6 py-8 shadow-sm lg:rounded-2xl lg:px-8">
        {page.body ? (
          <div
            className={RICH_TEXT_CONTENT_CLASSNAME}
            dangerouslySetInnerHTML={createRichTextMarkup(page.body)}
          />
        ) : (
          <p className="text-sm leading-8 text-stone-600 md:text-base">
            Trang này đã được đăng ký trong hệ thống và sẽ hiển thị nội dung khi bạn cập nhật phần body trong CMS.
          </p>
        )}
      </div>
    </GuestShell>
  );
}

export async function renderManagedPage(page: ManagedPage) {
  const settings = await getSystemSettings();
  const permalinkConfig = sanitizePermalinkConfig(settings.permalink);
  const managedPathMap = new Map(
    (await listManagedPages()).map((item) => [item.slug, getManagedPagePath(item)])
  );
  const contactPath = managedPathMap.get("contact") || ROUTES.CONTACT;
  const templatesPath = managedPathMap.get("templates") || ROUTES.TEMPLATES;
  const qrBuilderPath = managedPathMap.get("tools/qr-builder") || ROUTES.TOOLS_PAGES.QR_BUILDER;
  const weddingBudgetPath = managedPathMap.get("tools/wedding-budget") || ROUTES.TOOLS_PAGES.WEDDING_BUDGET;

  switch (page.slug) {
    case "home":
      return (
        <>
          <PageStructuredData page={page} />
          <HomeContent page={page} />
        </>
      );
    case "about-us":
      return (
        <>
          <PageStructuredData page={page} />
          <AboutContent page={page} />
        </>
      );
    case "contact":
      return (
        <>
          <PageStructuredData page={page} />
          <ContactContent page={page} />
        </>
      );
    case "templates": {
      const products = await listPublishedProducts();

      return (
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,226,236,0.9),rgba(255,245,248,0.94)_28%,rgba(255,251,252,0.98)_58%,rgba(255,255,255,1)_100%)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-56" />
          <GuestShell className="relative gap-10 py-12">
            <PageStructuredData page={page} />
            <section className="rounded-[32px] border border-white/70 bg-white/55 px-6 py-10 shadow-[0_20px_70px_rgba(244,114,182,0.08)] sm:px-8 lg:px-12 lg:py-14">
              <PageHero
                page={page}
                fallbackTitle="Mẫu thiệp"
                fallbackExcerpt="Khám phá toàn bộ mẫu thiệp và builder starter để chọn sản phẩm phù hợp với phong cách cưới của bạn."
              />
            </section>

            <section className="space-y-6">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.3em] text-rose-500">San pham</p>
                <h2 className="text-xl font-semibold text-stone-950 sm:text-2xl lg:text-3xl 2 xl:text-4xl">Tat ca mau thiep</h2>
                <p className="max-w-3xl text-sm leading-8 text-stone-600 md:text-base lg:text-lg">
                  Danh sach nay gom ca mau code san va builder starter, khong tach rieng thanh 2 nhom de ban de duyet va so sanh.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
                {products.map((product) => (
                  <LoopProductCard
                    key={product.id}
                    product={product}
                    href={product.productType === "builder_template"
                      ? getBuilderProductPath(product, permalinkConfig)
                      : getTemplateProductPath(product, permalinkConfig)}
                  />
                ))}
              </div>
            </section>
          </GuestShell>
        </section>
      );
    }
    case "builder": {
      const [user, builderProducts] = await Promise.all([
        getCurrentUser(),
        listPublishedProductsByType("builder_template"),
      ]);

      return (
        <GuestShell className="gap-10 py-12">
          <PageStructuredData page={page} />
          <div className="space-y-3">
            <ManagedPageBreadcrumb page={page} />
            <p className="text-sm uppercase tracking-[0.4em] text-stone-400">Tự tạo thiệp</p>
            <h1 className="text-2xl font-semibold text-stone-950 sm:text-3xl lg:text-4xl 2 xl:text-5xl">
              {page.title || "Bắt đầu một mẫu thiệp cưới tùy biến"}
            </h1>
            <p className="max-w-3xl text-sm leading-8 text-stone-600 md:text-base lg:text-lg">
              {page.excerpt || "Luồng này tạo một `wedding_site` kiểu builder. Hiện tại builder đang ở mức section-based foundation để chuẩn bị cho giao diện kéo-thả sau này."}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
            {builderProducts.map((product) => (
              <LoopProductCard
                key={product.id}
                product={product}
                href={getBuilderProductPath(product, permalinkConfig)}
              />
            ))}
          </div>

          {!user ? (
            <div className="flex flex-wrap gap-3">
              <GuestLinkButton href={ROUTES.AUTH.LOGIN}>Đăng nhập để bắt đầu</GuestLinkButton>
              <GuestLinkButton href={ROUTES.AUTH.REGISTER} variant="secondary">Đăng ký tài khoản</GuestLinkButton>
            </div>
          ) : null}
        </GuestShell>
      );
    }
    case "services":
      return (
        <GuestShell className="gap-10 py-12">
          <PageStructuredData page={page} />
          <PageHero
            page={page}
            fallbackTitle="Gói dịch vụ"
            fallbackExcerpt="Chọn gói phù hợp với mức độ tùy chỉnh và hỗ trợ mà bạn cần cho thiệp cưới online của mình."
          />

          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <GuestPanel key={plan.name} className="h-full">
                <GuestPanelHeader>
                  <p className="text-xs uppercase tracking-[0.3em] text-stone-400">{plan.name}</p>
                  <GuestPanelTitle className="mt-3">{plan.price}</GuestPanelTitle>
                  <p className="mt-3 text-sm leading-7 text-stone-600">{plan.summary}</p>
                </GuestPanelHeader>
                <GuestPanelBody className="flex h-full flex-col gap-6">
                  <div className="space-y-3">
                    {plan.features.map((feature) => (
                      <div key={feature} className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700 lg:rounded-2xl">
                        {feature}
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto">
                    <GuestLinkButton href={contactPath} className="flex w-full justify-center">
                      Liên hệ tư vấn
                    </GuestLinkButton>
                  </div>
                </GuestPanelBody>
              </GuestPanel>
            ))}
          </div>
        </GuestShell>
      );
    case "tools": {
      const tools = [
        {
          title: "QR mừng cưới custom",
          description: "Tạo mã QR mừng cưới đẹp hơn để chèn vào thiệp, bảng gallery hoặc website cưới.",
          href: qrBuilderPath,
          cta: "Mở tool QR",
        },
        {
          title: "Bảng tính chi phí cưới",
          description: "Chia ngân sách cưới theo từng hạng mục để dễ dự trù và ra quyết định nhanh hơn.",
          href: weddingBudgetPath,
          cta: "Mở bảng chi phí",
        },
      ];

      return (
        <GuestShell className="gap-10 py-12">
          <PageStructuredData page={page} />
          <PageHero
            page={page}
            fallbackTitle="Công cụ"
            fallbackExcerpt="Các mini-tool này giúp giải quyết nhanh những việc nhỏ trong hành trình chuẩn bị cưới, đồng thời dẫn sang flow tạo thiệp online tự nhiên hơn."
          />

          <div className="grid gap-6 lg:grid-cols-2">
            {tools.map((tool) => (
              <GuestPanel key={tool.href} className="h-full">
                <GuestPanelHeader>
                  <GuestPanelTitle>{tool.title}</GuestPanelTitle>
                </GuestPanelHeader>
                <GuestPanelBody className="flex h-full flex-col gap-6">
                  <p className="text-sm leading-8 text-stone-600 md:text-base lg:text-lg">{tool.description}</p>
                  <div className="mt-auto">
                    <GuestLinkButton href={tool.href}>{tool.cta}</GuestLinkButton>
                  </div>
                </GuestPanelBody>
              </GuestPanel>
            ))}
          </div>
        </GuestShell>
      );
    }
    case "tools/qr-builder":
      return (
        <GuestShell className="gap-10 py-12">
          <PageStructuredData page={page} />
          <PageHero
            page={page}
            fallbackTitle="QR mừng cưới custom"
            fallbackExcerpt="Bản v1 để chốt luồng sản phẩm. Bước tiếp theo có thể nối dữ liệu ngân hàng, render QR thật và xuất ảnh để chèn vào thiệp."
          />

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <GuestPanel>
              <GuestPanelHeader>
                <GuestPanelTitle>Thông tin mã QR</GuestPanelTitle>
              </GuestPanelHeader>
              <GuestPanelBody className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700">Tên cô dâu chú rể</label>
                  <GuestInput placeholder="Ví dụ: Linh & Tuan" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700">Ngân hàng</label>
                  <GuestInput placeholder="Ví dụ: MB Bank" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700">Số tài khoản</label>
                  <GuestInput placeholder="Ví dụ: 123456789" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700">Chủ tài khoản</label>
                  <GuestInput placeholder="Ví dụ: Nguyen Van A" />
                </div>
              </GuestPanelBody>
            </GuestPanel>

            <GuestPanel>
              <GuestPanelHeader>
                <GuestPanelTitle>Xem trước</GuestPanelTitle>
              </GuestPanelHeader>
              <GuestPanelBody className="space-y-6">
                <div className="mx-auto flex aspect-square max-w-[320px] items-center justify-center rounded-xl border border-stone-200 bg-stone-50 lg:rounded-2xl">
                  <div className="space-y-3 text-center">
                    <div className="mx-auto grid h-40 w-40 grid-cols-6 gap-1 rounded-xl bg-white p-3 shadow-sm lg:rounded-2xl">
                      {Array.from({ length: 36 }).map((_, index) => (
                        <div key={index} className={index % 3 === 0 ? "bg-stone-950" : "bg-stone-300/40"} />
                      ))}
                    </div>
                    <p className="text-sm font-medium text-stone-700">QR preview placeholder</p>
                  </div>
                </div>
                <GuestLinkButton href={templatesPath} className="flex w-full justify-center">
                  Dùng QR này trong mẫu thiệp
                </GuestLinkButton>
              </GuestPanelBody>
            </GuestPanel>
          </div>
        </GuestShell>
      );
    case "tools/wedding-budget":
      return (
        <GuestShell className="gap-10 py-12">
          <PageStructuredData page={page} />
          <PageHero
            page={page}
            fallbackTitle="Bảng tính chi phí cưới"
            fallbackExcerpt="Bản v1 giúp chia ngân sách cưới theo tỷ lệ tham khảo để bạn có một khung dự trù nhanh trước khi chốt chi tiết."
          />

          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <GuestPanel>
              <GuestPanelHeader>
                <GuestPanelTitle>Ngân sách dự kiến</GuestPanelTitle>
              </GuestPanelHeader>
              <GuestPanelBody className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700">Tổng ngân sách</label>
                  <GuestInput placeholder="Ví dụ: 150000000" />
                </div>
                <p className="text-sm leading-7 text-stone-600">
                  Bước tiếp theo có thể thêm slider và tính tiền realtime cho từng hạng mục.
                </p>
              </GuestPanelBody>
            </GuestPanel>

            <GuestPanel>
              <GuestPanelHeader>
                <GuestPanelTitle>Phân bổ tham khảo</GuestPanelTitle>
              </GuestPanelHeader>
              <GuestPanelBody className="space-y-3">
                {budgetCategories.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 lg:rounded-2xl">
                    <span className="text-sm font-medium text-stone-800">{item.label}</span>
                    <span className="text-sm text-stone-500">{item.percent}</span>
                  </div>
                ))}
                <div className="pt-3">
                  <GuestLinkButton href={templatesPath} className="flex w-full justify-center">
                    Tiết kiệm bằng thiệp online
                  </GuestLinkButton>
                </div>
              </GuestPanelBody>
            </GuestPanel>
          </div>
        </GuestShell>
      );
    case "blog": {
      const [categories, posts] = await Promise.all([
        listPublishedBlogCategories(),
        listPublishedBlogPosts(),
      ]);

      return (
        <GuestShell className="gap-10 py-12">
          <PageStructuredData page={page} />
          <PageHero
            page={page}
            fallbackTitle="Blog cưới"
            fallbackExcerpt="Chia sẻ kinh nghiệm chọn mẫu thiệp, lên ngân sách cưới, tối ưu nội dung và dùng công cụ đúng lúc để chuẩn bị nhanh hơn."
          />
          <BlogTabs categories={categories} posts={posts} permalinkConfig={permalinkConfig} />
        </GuestShell>
      );
    }
    default:
      if (page.slug === "not-found") {
        notFound();
      }

      return <GenericManagedPage page={page} />;
  }
}
