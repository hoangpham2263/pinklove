import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AboutContent } from "@/app/(guest)/(marketing)/about/_components/about-content";
import { ServicesContent } from "@/app/(guest)/(marketing)/services/_components/services-content";
import {
  GuestLinkButton,
  GuestPanel,
  GuestPanelBody,
  GuestShell,
} from "@/app/(guest)/_components/guest-ui";
import { ContactContent } from "@/app/(guest)/(marketing)/contact/_components/contact-content";
import { HomeContent } from "@/app/(guest)/_components/home-content";
import { ManagedPageBreadcrumb } from "@/components/common/managed-page-breadcrumb";
import { PageStructuredData } from "@/components/common/page-structured-data";
import { BlogTabs } from "@/features/blog/components/blog-tabs";
import { listPublishedBlogCategories, listPublishedBlogPosts } from "@/features/blog/server/service";
import { QrBuilderTool, WeddingBudgetTool } from "@/features/tools/components/tools-pages";
import { LoopOnlineInvitationCard } from "@/features/offerings/components/LoopOnlineInvitationCard";
import { LoopOfferingCard } from "@/features/offerings/components/LoopOfferingCard";
import { listAllOfferingCategories, listPublishedOfferingsFiltered } from "@/features/offerings/server/service";
import type { Offering, OfferingCategory } from "@/features/offerings/types";
import {
  buildManagedPageMetadata,
  getAccessiblePageBySlug,
  listManagedPages,
  type ManagedPage,
} from "@/lib/managed-pages";
import { getManagedPagePath } from "@/lib/page-paths";
import { createRichTextMarkup, RICH_TEXT_CONTENT_CLASSNAME } from "@/lib/rich-text";
import { ROUTES } from "@/lib/routes";

type ManagedSearchParams = Promise<Record<string, string | string[] | undefined>> | undefined;

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
  searchParams?: ManagedSearchParams
): Promise<ManagedPage> {
  const preview = await isPreviewRequest(searchParams);
  const page = await getAccessiblePageBySlug(slug, { preview });

  if (!page) {
    notFound();
  }

  return page;
}

function PageHero({ page, fallbackTitle, fallbackExcerpt }: { page: ManagedPage; fallbackTitle: string; fallbackExcerpt: string }) {
  return (
    <div className="mx-auto max-w-3xl space-y-4 text-center">
      <ManagedPageBreadcrumb page={page} />
      <h1 className="text-2xl font-semibold text-stone-950 sm:text-3xl lg:text-4xl 2xl:text-5xl">{page.title || fallbackTitle}</h1>
      <p className="text-sm leading-8 text-stone-600 md:text-base lg:text-lg">
        {page.excerpt || fallbackExcerpt}
      </p>
    </div>
  );
}

function getSearchParamValue(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

type PriceFilter = {
  key: string;
  label: string;
  min: number;
  max?: number;
};

const priceFilters: PriceFilter[] = [
  { key: "all", label: "Tất cả giá", min: 0 },
  { key: "under-500", label: "Dưới 500k", min: 0, max: 500000 },
  { key: "500-1000", label: "500k - 1 triệu", min: 500000, max: 1000000 },
  { key: "over-1000", label: "Trên 1 triệu", min: 1000000 },
] as const;

const sortOptions = [
  { key: "newest", label: "Mới nhất" },
  { key: "price-asc", label: "Giá thấp đến cao" },
  { key: "price-desc", label: "Giá cao đến thấp" },
] as const;

type CatalogSortKey = (typeof sortOptions)[number]["key"];

type CatalogFilters = {
  categorySlug: string;
  priceKey: string;
  sortKey: CatalogSortKey;
};

function getCatalogFilters(params: Record<string, string | string[] | undefined>): CatalogFilters {
  const requestedSort = getSearchParamValue(params, "sap-xep");
  const sortKey = sortOptions.some((item) => item.key === requestedSort)
    ? (requestedSort as CatalogSortKey)
    : "newest";

  return {
    categorySlug: getSearchParamValue(params, "danh-muc") ?? "all",
    priceKey: getSearchParamValue(params, "gia") ?? "all",
    sortKey,
  };
}

function getPriceFilter(key: string) {
  return priceFilters.find((item) => item.key === key) ?? priceFilters[0];
}

function buildCatalogFilterHref(
  basePath: string,
  currentParams: Record<string, string | string[] | undefined>,
  patch: Record<string, string>
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(currentParams)) {
    const resolved = Array.isArray(value) ? value[0] : value;
    if (resolved) {
      params.set(key, resolved);
    }
  }
  for (const [key, value] of Object.entries(patch)) {
    if (value === "all" || value === "newest") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function CatalogFilterSidebar({
  basePath,
  currentParams,
  filters,
  categories,
}: {
  basePath: string;
  currentParams: Record<string, string | string[] | undefined>;
  filters: CatalogFilters;
  categories: OfferingCategory[];
}) {
  return (
    <aside className="space-y-5 rounded-lg border border-stone-200 bg-white p-5 lg:sticky lg:top-24 lg:self-start">
      <div>
        <p className="text-sm font-semibold text-stone-950">Bộ lọc</p>
        <p className="mt-1 text-xs leading-5 text-stone-500">Lọc theo danh mục và khoảng giá.</p>
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.24em] text-stone-400">Danh mục</p>
        <div className="space-y-2">
          {[{ slug: "all", name: "Tất cả danh mục" }, ...categories].map((category) => {
            const active = filters.categorySlug === category.slug;
            return (
              <GuestLinkButton
                key={category.slug}
                href={buildCatalogFilterHref(basePath, currentParams, { "danh-muc": category.slug })}
                scroll={false}
                variant={active ? "primary" : "secondary"}
                className="flex min-h-9 w-full justify-start rounded-sm px-3 text-sm"
              >
                {category.name}
              </GuestLinkButton>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.24em] text-stone-400">Khoảng giá</p>
        <div className="space-y-2">
          {priceFilters.map((price) => {
            const active = filters.priceKey === price.key;
            return (
              <GuestLinkButton
                key={price.key}
                href={buildCatalogFilterHref(basePath, currentParams, { gia: price.key })}
                scroll={false}
                variant={active ? "primary" : "secondary"}
                className="flex min-h-9 w-full justify-start rounded-sm px-3 text-sm"
              >
                {price.label}
              </GuestLinkButton>
            );
          })}
        </div>
      </div>

    </aside>
  );
}

function CatalogOrderingBar({
  basePath,
  currentParams,
  filters,
  total,
}: {
  basePath: string;
  currentParams: Record<string, string | string[] | undefined>;
  filters: CatalogFilters;
  total: number;
}) {
  const activeSort = sortOptions.find((sort) => sort.key === filters.sortKey) ?? sortOptions[0];

  return (
    <div className="flex flex-col gap-3 border-b border-stone-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-stone-600">
        Hiển thị <span className="font-semibold text-stone-950">{total}</span> sản phẩm
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-stone-500">Sắp xếp:</span>
        <div className="flex flex-wrap gap-2">
          {sortOptions.map((sort) => {
            const active = sort.key === activeSort.key;
            return (
              <GuestLinkButton
                key={sort.key}
                href={buildCatalogFilterHref(basePath, currentParams, { "sap-xep": sort.key })}
                scroll={false}
                variant={active ? "primary" : "secondary"}
                className="min-h-9 rounded-sm px-3 text-sm"
              >
                {sort.label}
              </GuestLinkButton>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const templateOfferingTabs: Array<{
  key: string;
  label: string;
  templateEngine: "coded";
  description: string;
}> = [
  {
    key: "coded",
    label: "Mẫu coded",
    templateEngine: "coded",
    description: "Mẫu code sẵn, cố định source trong code và chỉ seed/catalog từ hệ thống.",
  },
];

function TemplateOfferingTabs({
  activeKey,
  currentParams,
  offeringsByType,
}: {
  activeKey: string;
  currentParams: Record<string, string | string[] | undefined>;
  offeringsByType: Record<"coded", Offering[]>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {templateOfferingTabs.map((tab) => {
        const active = tab.key === activeKey;
        const count = offeringsByType[tab.templateEngine].length;

        return (
          <GuestLinkButton
            key={tab.key}
            href={buildCatalogFilterHref(ROUTES.TEMPLATES, currentParams, { loai: tab.key })}
            scroll={false}
            variant={active ? "primary" : "secondary"}
            className="min-h-10 rounded-full px-4 text-sm"
          >
            {tab.label} ({count})
          </GuestLinkButton>
        );
      })}
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

export async function renderManagedPage(page: ManagedPage, searchParams?: ManagedSearchParams) {
  const managedPathMap = new Map(
    (await listManagedPages()).map((item) => [item.slug, getManagedPagePath(item)])
  );
  const templatesPath = managedPathMap.get("mau-thiep") || ROUTES.TEMPLATES;
  switch (page.slug) {
    case "home":
      return (
        <>
          <PageStructuredData page={page} />
          <HomeContent page={page} />
        </>
      );
    case "gioi-thieu":
      return (
        <>
          <PageStructuredData page={page} />
          <AboutContent page={page} />
        </>
      );
    case "lien-he":
      return (
        <>
          <PageStructuredData page={page} />
          <ContactContent page={page} />
        </>
      );
    case "mau-thiep": {
      const resolvedSearchParams = (await searchParams) ?? {};
      const requestedType = getSearchParamValue(resolvedSearchParams, "loai") ?? "coded";
      const activeTab =
        templateOfferingTabs.find((tab) => tab.key === requestedType) ?? templateOfferingTabs[0];
      const filters = getCatalogFilters(resolvedSearchParams);
      const priceFilter = getPriceFilter(filters.priceKey);
      const [codedOfferings, offerings, categories] = await Promise.all([
        listPublishedOfferingsFiltered({
          offeringTypes: ["digital_template"],
          templateEngines: ["coded"],
          categorySlug: filters.categorySlug,
          minPrice: priceFilter.min,
          maxPrice: priceFilter.max,
          sort: filters.sortKey,
        }),
        listPublishedOfferingsFiltered({
          offeringTypes: ["digital_template"],
          templateEngines: [activeTab.templateEngine],
          categorySlug: filters.categorySlug,
          minPrice: priceFilter.min,
          maxPrice: priceFilter.max,
          sort: filters.sortKey,
        }),
        listAllOfferingCategories(),
      ]);
      const offeringsByType: Record<"coded", Offering[]> = {
        coded: codedOfferings,
      };

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
                <p className="text-xs uppercase tracking-[0.3em] text-rose-500">Catalog</p>
                <h2 className="text-xl font-semibold text-stone-950 sm:text-2xl lg:text-3xl 2xl:text-4xl">{activeTab.label}</h2>
                <p className="max-w-3xl text-sm leading-8 text-stone-600 md:text-base lg:text-lg">
                  {activeTab.description}
                </p>
              </div>

              <TemplateOfferingTabs
                activeKey={activeTab.key}
                currentParams={resolvedSearchParams}
                offeringsByType={offeringsByType}
              />
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-100 bg-white px-5 py-4 shadow-sm">
                <div>
                  <h3 className="text-base font-semibold text-stone-950">Muốn tự tạo thiệp?</h3>
                  <p className="mt-1 text-sm leading-6 text-stone-600">
                    Vào khu vực khách hàng để tạo và quản lý thiệp trong dashboard riêng.
                  </p>
                </div>
                <GuestLinkButton href={ROUTES.BUILDER} className="shrink-0">
                  Tự tạo thiệp
                </GuestLinkButton>
              </div>

              <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
                <CatalogFilterSidebar
                  basePath={ROUTES.TEMPLATES}
                  currentParams={resolvedSearchParams}
                  filters={filters}
                  categories={categories}
                />

                {offerings.length > 0 ? (
                  <div className="space-y-5">
                    <CatalogOrderingBar
                      basePath={ROUTES.TEMPLATES}
                      currentParams={resolvedSearchParams}
                      filters={filters}
                      total={offerings.length}
                    />
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                      {offerings.map((offering) => (
                        offering.offeringType === "digital_template" ? (
                          <LoopOnlineInvitationCard key={offering.id} offering={offering} />
                        ) : (
                          <LoopOfferingCard key={offering.id} offering={offering} />
                        )
                      ))}
                    </div>
                  </div>
                ) : (
                  <GuestPanel>
                    <GuestPanelBody className="text-sm text-stone-600">
                      Không có sản phẩm phù hợp với bộ lọc hiện tại.
                    </GuestPanelBody>
                  </GuestPanel>
                )}
              </div>
            </section>
          </GuestShell>
        </section>
      );
    }
    case "thiep-giay": {
      const resolvedSearchParams = (await searchParams) ?? {};
      const filters = getCatalogFilters(resolvedSearchParams);
      const priceFilter = getPriceFilter(filters.priceKey);
      const [paperOfferings, categories] = await Promise.all([
        listPublishedOfferingsFiltered({
          offeringTypes: ["physical_product", "wedding_video", "wedding_photo", "bridal_makeup", "wedding_decoration", "wedding_planner", "wedding_service", "wedding_gift"],
          categorySlug: filters.categorySlug,
          minPrice: priceFilter.min,
          maxPrice: priceFilter.max,
          sort: filters.sortKey,
        }),
        listAllOfferingCategories(),
      ]);

      return (
        <section className="relative overflow-hidden bg-stone-50">
          <GuestShell className="relative gap-10 py-12">
            <PageStructuredData page={page} />
            <section className="rounded-[32px] border border-stone-200 bg-white px-6 py-10 shadow-[0_20px_70px_rgba(15,23,42,0.06)] sm:px-8 lg:px-12 lg:py-14">
              <PageHero
                page={page}
                fallbackTitle="Sản phẩm & dịch vụ cưới"
                fallbackExcerpt="Thiệp giấy, quà cưới và dịch vụ từ provider có thể mua hoặc kết nối cung ứng qua catalog."
              />
            </section>

            <section className="space-y-6">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.3em] text-orange-600">Wedding catalog</p>
                <h2 className="text-xl font-semibold text-stone-950 sm:text-2xl lg:text-3xl 2xl:text-4xl">Sản phẩm & dịch vụ cưới</h2>
                <p className="max-w-3xl text-sm leading-8 text-stone-600 md:text-base lg:text-lg">
                  Nhóm này hiển thị catalog không phải thiệp online: thiệp giấy, quà cưới và dịch vụ provider.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
                <CatalogFilterSidebar
                  basePath={ROUTES.PAPER}
                  currentParams={resolvedSearchParams}
                  filters={filters}
                  categories={categories}
                />

                {paperOfferings.length > 0 ? (
                  <div className="space-y-5">
                    <CatalogOrderingBar
                      basePath={ROUTES.PAPER}
                      currentParams={resolvedSearchParams}
                      filters={filters}
                      total={paperOfferings.length}
                    />
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                      {paperOfferings.map((offering) => (
                        <LoopOfferingCard key={offering.id} offering={offering} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <GuestPanel>
                    <GuestPanelBody className="text-sm text-stone-600">
                      Không có sản phẩm thiệp giấy phù hợp với bộ lọc hiện tại.
                    </GuestPanelBody>
                  </GuestPanel>
                )}
              </div>
            </section>
          </GuestShell>
        </section>
      );
    }
    case "dich-vu":
      return (
        <>
          <PageStructuredData page={page} />
          <ServicesContent page={page} />
        </>
      );
    case "tao-ma-qr":
      return (
        <>
          <PageStructuredData page={page} />
          <QrBuilderTool
            title={page.title || "Tạo mã QR mừng cưới"}
            excerpt={page.excerpt || "Tạo mã QR nhận quà cưới, kiểm tra thông tin và tải ảnh để sử dụng trên thiệp hoặc website cưới."}
            templatesPath={templatesPath}
          />
        </>
      );
    case "du-toan-cuoi":
      return (
        <>
          <PageStructuredData page={page} />
          <WeddingBudgetTool
            title={page.title || "Dự toán chi phí cưới"}
            excerpt={page.excerpt || "Tạo khung ngân sách ban đầu, điều chỉnh tỷ lệ từng hạng mục và theo dõi tổng chi phí ngay trên một màn hình."}
            templatesPath={templatesPath}
          />
        </>
      );
    case "blog": {
      const [categories, posts] = await Promise.all([
        listPublishedBlogCategories(),
        listPublishedBlogPosts(),
      ]);

      return (
        <section className="relative isolate min-h-screen overflow-hidden pt-[74px]">
          <div className="relative z-10">
            <PageStructuredData page={page} />
            <BlogTabs
              categories={categories}
              posts={posts}
              title={page.title || "PinkLove Blog"}
              excerpt={page.excerpt || "Kiến thức thực tế, cảm hứng và công cụ hữu ích giúp bạn chuẩn bị ngày cưới nhẹ nhàng hơn."}
            />
          </div>
        </section>
      );
    }
    default:
      if (page.slug === "not-found") {
        notFound();
      }

      return <GenericManagedPage page={page} />;
  }
}
