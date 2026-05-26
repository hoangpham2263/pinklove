import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AboutContent } from "@/app/(guest)/(marketing)/about/_components/about-content";
import { ServicesContent } from "@/app/(guest)/(marketing)/services/_components/services-content";
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
import { getCurrentUser } from "@/lib/auth";

type ManagedSearchParams = Promise<Record<string, string | string[] | undefined>> | undefined;

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

  if (!preview && targetPath !== requestPath) {
    redirect(targetPath);
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
  templateEngine: "coded" | "builder";
  description: string;
}> = [
  {
    key: "coded",
    label: "Mẫu coded",
    templateEngine: "coded",
    description: "Mẫu code sẵn, cố định source trong code và chỉ seed/catalog từ hệ thống.",
  },
  {
    key: "builder",
    label: "Builder",
    templateEngine: "builder",
    description: "Mẫu kéo thả, có thể tạo từ admin builder hoặc seed sẵn bằng builder document.",
  },
];

function TemplateOfferingTabs({
  activeKey,
  currentParams,
  offeringsByType,
}: {
  activeKey: string;
  currentParams: Record<string, string | string[] | undefined>;
  offeringsByType: Record<"coded" | "builder", Offering[]>;
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
  const qrBuilderPath = managedPathMap.get("cong-cu/tao-ma-qr") || ROUTES.TOOLS_PAGES.QR_BUILDER;
  const weddingBudgetPath = managedPathMap.get("cong-cu/du-toan-cuoi") || ROUTES.TOOLS_PAGES.WEDDING_BUDGET;
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
      const [codedOfferings, builderOfferings, offerings, categories] = await Promise.all([
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
          templateEngines: ["builder"],
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
      const offeringsByType: Record<"coded" | "builder", Offering[]> = {
        coded: codedOfferings,
        builder: builderOfferings,
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
    case "tu-tao-thiep": {
      const resolvedSearchParams = (await searchParams) ?? {};
      const filters = getCatalogFilters(resolvedSearchParams);
      const priceFilter = getPriceFilter(filters.priceKey);
      const [user, builderOfferings, categories] = await Promise.all([
        getCurrentUser(),
        listPublishedOfferingsFiltered({
          offeringTypes: ["digital_template"],
          templateEngines: ["builder"],
          categorySlug: filters.categorySlug,
          minPrice: priceFilter.min,
          maxPrice: priceFilter.max,
          sort: filters.sortKey,
        }),
        listAllOfferingCategories(),
      ]);

      return (
        <GuestShell className="gap-10 py-12">
          <PageStructuredData page={page} />
          <div className="space-y-3">
            <ManagedPageBreadcrumb page={page} />
            <p className="text-sm uppercase tracking-[0.4em] text-stone-400">Tự tạo thiệp</p>
            <h1 className="text-2xl font-semibold text-stone-950 sm:text-3xl lg:text-4xl 2xl:text-5xl">
              {page.title || "Bắt đầu một mẫu thiệp cưới tùy biến"}
            </h1>
            <p className="max-w-3xl text-sm leading-8 text-stone-600 md:text-base lg:text-lg">
              {page.excerpt || "Luồng này tạo một `wedding_site` kiểu builder. Hiện tại builder đang ở mức section-based foundation để chuẩn bị cho giao diện kéo-thả sau này."}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
            <CatalogFilterSidebar
              basePath={ROUTES.BUILDER}
              currentParams={resolvedSearchParams}
              filters={filters}
              categories={categories}
            />

            <div className="space-y-5">
              <CatalogOrderingBar
                basePath={ROUTES.BUILDER}
                currentParams={resolvedSearchParams}
                filters={filters}
                total={builderOfferings.length}
              />
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {builderOfferings.map((offering) => (
                  <LoopOnlineInvitationCard
                    key={offering.id}
                    offering={offering}
                  />
                ))}
              </div>
            </div>
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
    case "dich-vu":
      return (
        <>
          <PageStructuredData page={page} />
          <ServicesContent page={page} />
        </>
      );
    case "cong-cu": {
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
    case "cong-cu/tao-ma-qr":
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
    case "cong-cu/du-toan-cuoi":
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
        <section className="guest-soft-top-bg contact-wave-bg relative isolate min-h-screen overflow-hidden pt-[74px]">
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <span className="contact-cloud-decor blog-cloud-decor-one" />
            <span className="contact-cloud-decor blog-cloud-decor-two" />
            <span className="contact-cloud-decor blog-cloud-decor-three" />
            <span className="contact-cloud-decor blog-cloud-decor-four" />
            <span className="contact-cloud-decor blog-cloud-decor-five" />
            <span className="contact-cloud-decor blog-cloud-decor-six" />
            <div className="absolute left-[12%] top-[8%] size-24 rounded-full bg-[#ffb8fb]/10 blur-3xl" />
            <div className="absolute right-[18%] top-[14%] size-28 rounded-full bg-[#ff6ff5]/7 blur-3xl" />
            <div className="absolute left-[18%] top-[58%] size-22 rounded-full bg-[#ffb8fb]/8 blur-3xl" />
            <div className="absolute right-[16%] top-[74%] size-24 rounded-full bg-[#ff6ff5]/7 blur-3xl" />
            <span
              className="cta-sparkle-float absolute left-[13%] top-[16%] bg-[linear-gradient(180deg,#ffffff_0%,#ffb8fb_42%,#ff6ff5_100%)] bg-clip-text text-3xl text-transparent drop-shadow-[0_6px_16px_rgba(255,111,245,0.16)]"
              style={{ animationDelay: "-0.2s" }}
            >
              ✦
            </span>
            <span
              className="cta-sparkle-float absolute right-[15%] top-[36%] bg-[linear-gradient(180deg,#ffffff_0%,#ffd8fc_48%,#ff95f8_100%)] bg-clip-text text-2xl text-transparent opacity-70 drop-shadow-[0_6px_14px_rgba(255,184,251,0.12)]"
              style={{ animationDelay: "-1.1s" }}
            >
              ✦
            </span>
            <span
              className="cta-heart-pop absolute left-[24%] top-[70%] bg-[linear-gradient(180deg,#ffd8fc_0%,#ff8be8_45%,#d94dce_100%)] bg-clip-text text-2xl text-transparent opacity-35 drop-shadow-[0_8px_18px_rgba(217,77,206,0.1)]"
              style={{ animationDelay: "-1.7s" }}
            >
              ♥
            </span>
          </div>

          <GuestShell className="relative z-10 gap-10 py-12">
            <PageStructuredData page={page} />
            <div className="relative overflow-hidden py-4">
              <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                <span className="contact-cloud-decor blog-banner-cloud-one" />
                <span className="contact-cloud-decor blog-banner-cloud-two" />
                <span className="contact-cloud-decor blog-banner-cloud-three" />
                <span
                  className="cta-sparkle-float absolute left-[7%] top-[26%] bg-[linear-gradient(180deg,#ffffff_0%,#ffb8fb_42%,#ff6ff5_100%)] bg-clip-text text-3xl text-transparent opacity-80 drop-shadow-[0_6px_16px_rgba(255,111,245,0.16)]"
                  style={{ animationDelay: "-0.45s" }}
                >
                  ✦
                </span>
                <span
                  className="cta-sparkle-float absolute right-[8%] top-[30%] bg-[linear-gradient(180deg,#ffffff_0%,#ffd8fc_48%,#ff95f8_100%)] bg-clip-text text-2xl text-transparent opacity-75 drop-shadow-[0_6px_14px_rgba(255,184,251,0.14)]"
                  style={{ animationDelay: "-1.35s" }}
                >
                  ✦
                </span>
                <span
                  className="cta-heart-pop absolute right-[30%] top-[18%] bg-[linear-gradient(180deg,#ffd8fc_0%,#ff8be8_45%,#d94dce_100%)] bg-clip-text text-2xl text-transparent opacity-60 drop-shadow-[0_8px_18px_rgba(217,77,206,0.14)]"
                  style={{ animationDelay: "-1.75s" }}
                >
                  ♥
                </span>
              </div>
              <div className="relative z-10">
                <PageHero
                  page={page}
                  fallbackTitle="Blog cưới"
                  fallbackExcerpt="Chia sẻ kinh nghiệm chọn mẫu thiệp, lên ngân sách cưới, tối ưu nội dung và dùng công cụ đúng lúc để chuẩn bị nhanh hơn."
                />
              </div>
            </div>
            <BlogTabs categories={categories} posts={posts} />
          </GuestShell>
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
