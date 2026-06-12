import type { Metadata } from "next";
import Image from "next/image";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/common/json-ld";
import {
  GuestButton,
  GuestLinkButton,
  GuestPanel,
  GuestPanelBody,
  GuestPanelHeader,
  GuestPanelTitle,
} from "@/app/(guest)/_components/guest-ui";
import { WishlistToggleButton } from "@/features/offerings/components/wishlist-toggle-button";
import { CommentSection } from "@/features/comments/components/comment-section";
import { getRegisteredOfferingType } from "@/features/offerings/type-registry";
import type { Offering } from "@/features/offerings/types";
import { createWishlistOfferingSnapshot } from "@/features/offerings/wishlist";
import { getCurrentUser } from "@/lib/auth";
import { getInvitationTemplateDefaults, getInvitationTemplateLabel } from "@/features/invitations/templates/registry";
import {
  getBuilderOfferingPath,
  getGeneralOfferingPath,
  getTemplateOfferingPath,
} from "@/lib/public-paths";
import { formatVnd } from "@/lib/currency";
import { ROUTES } from "@/lib/routes";
import { createSeoMetadata } from "@/lib/seo";

const detailLabels: Record<string, string> = {
  brideName: "Tên cô dâu",
  groomName: "Tên chú rể",
  heroSubtitle: "Lời mở đầu",
  eventDate: "Ngày sự kiện",
  venue: "Địa điểm",
  storyTitle: "Tiêu đề câu chuyện",
  storyBody: "Nội dung câu chuyện",
  heroTitle: "Tiêu đề hero",
  sectionOneTitle: "Section đầu tiên",
  spec: "Quy cách",
  leadTimeNote: "Thời gian thực hiện",
  supplierName: "Nhà cung cấp",
};

function formatDetailLabel(key: string) {
  return detailLabels[key] ?? key.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase());
}

function formatDetailValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.length > 0 ? `${value.length} mục` : "Not set";
  }

  if (typeof value === "object" && value) {
    return "Configured";
  }

  return String(value || "Not set");
}

function getFulfillmentLabel(value: Offering["fulfillmentType"]) {
  switch (value) {
    case "digital":
      return "Sản phẩm online - Nhận qua link/file";
    case "physical":
      return "Sản phẩm vật lý - Có sản xuất/giao hàng";
    case "service":
      return "Dịch vụ - Có người thực hiện/đặt lịch";
    default:
      return value;
  }
}

function getStockLabel(offering: Offering) {
  if (!offering.trackInventory) {
    return offering.allowBackorder ? "Nhận đặt theo lịch" : "Có thể đặt mua";
  }

  if (offering.stockQuantity > 0) {
    return `Còn ${offering.stockQuantity} sản phẩm`;
  }

  return offering.allowBackorder ? "Hết hàng, vẫn nhận đặt trước" : "Tạm hết hàng";
}

function DetailGrid({ items }: { items: Record<string, unknown> }) {
  const visibleItems = Object.entries(items).filter(([, value]) => value !== undefined && value !== null);

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <GuestPanelBody className="grid gap-3 md:grid-cols-2">
      {visibleItems.map(([key, value]) => (
        <div key={key} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-stone-400">{formatDetailLabel(key)}</p>
          <p className="mt-2 text-sm leading-6 text-stone-700">{formatDetailValue(value)}</p>
        </div>
      ))}
    </GuestPanelBody>
  );
}

function OfferingDetailLayout({
  offering,
  eyebrow,
  offeringLabel,
  metaRows,
  actions,
  children,
}: {
  offering: Offering;
  eyebrow: string;
  offeringLabel: string;
  metaRows: Array<[string, ReactNode]>;
  actions: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="bg-stone-50 px-4 pb-8 pt-30">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid gap-6 bg-white lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-5">
            <div className="overflow-hidden rounded-sm border border-stone-200 bg-stone-50">
              {offering.thumbnailUrl ? (
                <Image
                  src={offering.thumbnailUrl}
                  alt={offering.name}
                  width={1400}
                  height={1400}
                  className="aspect-square w-full object-cover"
                  priority
                />
              ) : (
                <div className="flex aspect-square items-center justify-center text-sm text-stone-400">Chưa có ảnh sản phẩm</div>
              )}
            </div>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-sm border border-stone-200 bg-stone-50">
                  {offering.thumbnailUrl ? (
                    <Image
                      src={offering.thumbnailUrl}
                      alt={`${offering.name} preview ${index + 1}`}
                      width={240}
                      height={240}
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="aspect-square" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="min-w-0 lg:col-span-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-sm bg-orange-600 px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white">
                {eyebrow}
              </span>
              <span className="text-sm text-stone-500">{offeringLabel}</span>
            </div>

            <h1 className="mt-3 text-2xl font-semibold leading-tight text-stone-950 md:text-3xl">{offering.name}</h1>
            <p className="mt-3 text-sm leading-7 text-stone-600 md:text-base">{offering.description || offering.excerpt}</p>

            <div className="mt-5 bg-stone-50 px-4 py-4">
              <p className="text-sm text-stone-500">Giá</p>
              <p className="mt-1 text-3xl font-semibold text-orange-600 md:text-4xl">{formatVnd(offering.price)}</p>
            </div>

            <div className="mt-5 divide-y divide-stone-100 text-sm">
              {metaRows.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 py-3">
                  <span className="text-stone-500">{label}</span>
                  <span className="min-w-0 text-stone-800">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">{actions}</div>

            {children ? <div className="mt-6">{children}</div> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export async function generateTemplateOfferingMetadata(offering: Offering | null): Promise<Metadata> {
  if (!offering) {
    return await createSeoMetadata({
      title: "Mẫu thiệp cưới",
      description: "Chi tiết mẫu thiệp cưới.",
      path: ROUTES.TEMPLATES,
      noindex: true,
    });
  }

  return await createSeoMetadata({
    title: offering.name,
    description: offering.description || offering.excerpt || `Chi tiết mẫu thiệp cưới ${offering.name}.`,
    path: getTemplateOfferingPath(offering),
    image: offering.thumbnailUrl,
    keywords: ["mẫu thiệp cưới", getInvitationTemplateLabel(offering.templateKey).toLowerCase(), offering.name.toLowerCase()],
  });
}

export async function generateGeneralOfferingMetadata(offering: Offering | null): Promise<Metadata> {
  if (!offering) {
    return await createSeoMetadata({
      title: "Sản phẩm",
      description: "Chi tiết sản phẩm catalog.",
      path: ROUTES.PAPER,
      noindex: true,
    });
  }

  return await createSeoMetadata({
    title: offering.name,
    description: offering.description || offering.excerpt || `Chi tiết sản phẩm ${offering.name}.`,
    path: getGeneralOfferingPath(offering),
    image: offering.thumbnailUrl,
    keywords: ["san pham", offering.name.toLowerCase()],
  });
}

export async function generateBuilderOfferingMetadata(offering: Offering | null): Promise<Metadata> {
  if (!offering) {
    return await createSeoMetadata({
      title: "Builder thiệp cưới",
      description: "Chi tiết builder starter.",
      path: ROUTES.BUILDER,
      noindex: true,
    });
  }

  return await createSeoMetadata({
    title: offering.name,
    description: offering.description || offering.excerpt || `Chi tiết starter builder ${offering.name}.`,
    path: getBuilderOfferingPath(offering),
    image: offering.thumbnailUrl,
    keywords: ["builder thiệp cưới", getInvitationTemplateLabel(offering.templateKey).toLowerCase(), offering.name.toLowerCase()],
  });
}

export async function renderTemplateOfferingPage(offering: Offering) {
  const offeringPath = getTemplateOfferingPath(offering);
  const defaults = {
    ...getInvitationTemplateDefaults(offering.templateKey),
    ...((offering.config.siteDefaults as Record<string, unknown> | undefined) ?? {}),
  };
  const offeringJsonLd = {
    "@context": "https://schema.org",
    "@type": "Offering",
    name: offering.name,
    description: offering.description || offering.excerpt,
    image: offering.thumbnailUrl ? [offering.thumbnailUrl] : undefined,
    category: "Wedding Invitation Template",
    offers: {
      "@type": "Offer",
      priceCurrency: "VND",
      price: String(offering.price),
      availability: "https://schema.org/InStock",
      url: offeringPath,
    },
  };

  return (
    <>
      <JsonLd data={offeringJsonLd} />
      <OfferingDetailLayout
        offering={offering}
        eyebrow="Coded"
        offeringLabel="Mẫu code sẵn"
        metaRows={[
          ["Template", getInvitationTemplateLabel(offering.templateKey)],
          ["Bàn giao", getFulfillmentLabel(offering.fulfillmentType)],
          ["Tình trạng", "Có thể tạo bản nháp để xem trước"],
        ]}
        actions={
          <>
            <GuestLinkButton href={`${getTemplateOfferingPath(offering)}/customize`} className="flex rounded-sm bg-orange-600 hover:bg-orange-700 sm:min-w-56">
              Tạo thiệp từ mẫu này
            </GuestLinkButton>
            <WishlistToggleButton offering={createWishlistOfferingSnapshot(offering)} variant="button" />
            <GuestLinkButton href={ROUTES.WISHLIST} variant="secondary" className="flex rounded-sm sm:min-w-44">
              Lưu để mua sau
            </GuestLinkButton>
          </>
        }
      >
        <p className="rounded-sm bg-orange-50 px-4 py-3 text-sm leading-7 text-stone-700">
          Tạo một bản nháp từ mẫu coded này để khách xem trước và chỉnh nội dung chính. Khi đã ưng ý, khách có thể lưu lại và mua theo luồng đơn hàng.
        </p>
      </OfferingDetailLayout>

      <div className="mx-auto grid w-full max-w-7xl gap-4 bg-stone-50 px-4 pb-8 md:grid-cols-3">
        {[
          ["Ổn định", "Renderer nằm trong code, phù hợp để bán như template chuẩn."],
          ["Chỉnh nội dung", "Khách thay thông tin, lời mời, địa điểm và hình ảnh."],
          ["Tạo thiệp online", "Sau khi mua, template được dùng để tạo wedding site."],
        ].map(([title, body]) => (
          <div key={title} className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
            <p className="font-medium text-stone-950">{title}</p>
            <p className="mt-2 text-sm leading-7 text-stone-600">{body}</p>
          </div>
        ))}
      </div>
      <div className="bg-stone-50 px-4 pb-8">
        <div className="mx-auto max-w-7xl">
          <GuestPanel>
            <GuestPanelHeader>
              <GuestPanelTitle>Nội dung mặc định</GuestPanelTitle>
            </GuestPanelHeader>
            <DetailGrid items={defaults} />
          </GuestPanel>
        </div>
      </div>
      <CommentSection target={{ type: "offering", id: offering.id, slug: offering.slug, title: offering.name, url: offeringPath }} />
    </>
  );
}

export async function renderBuilderOfferingPage(offering: Offering) {
  const user = await getCurrentUser();
  const offeringPath = getBuilderOfferingPath(offering);
  const defaults = {
    ...getInvitationTemplateDefaults(offering.templateKey),
    ...((offering.config.siteDefaults as Record<string, unknown> | undefined) ?? {}),
  };
  const offeringJsonLd = {
    "@context": "https://schema.org",
    "@type": "Offering",
    name: offering.name,
    description: offering.description || offering.excerpt,
    image: offering.thumbnailUrl ? [offering.thumbnailUrl] : undefined,
    category: "Wedding Invitation Builder",
    offers: {
      "@type": "Offer",
      priceCurrency: "VND",
      price: String(offering.price),
      availability: "https://schema.org/InStock",
      url: offeringPath,
    },
  };

  return (
    <>
      <JsonLd data={offeringJsonLd} />
      <OfferingDetailLayout
        offering={offering}
        eyebrow="Builder"
        offeringLabel="Mẫu kéo thả"
        metaRows={[
          ["Template", getInvitationTemplateLabel(offering.templateKey)],
          ["Bàn giao", getFulfillmentLabel(offering.fulfillmentType)],
          ["Cách dùng", "Tạo draft rồi chỉnh trong builder editor"],
        ]}
        actions={
          <>
            {user ? (
              <form action={ROUTES.API.CUSTOMER.INVITATIONS.CREATE_BUILDER} method="POST" className="sm:min-w-56">
                <input type="hidden" name="offeringSlug" value={offering.slug} />
                <GuestButton type="submit" className="w-full rounded-sm bg-orange-600 hover:bg-orange-700">
                  Chỉnh từ mẫu này
                </GuestButton>
              </form>
            ) : (
              <GuestLinkButton href={`${ROUTES.AUTH.LOGIN}?returnTo=${encodeURIComponent(getBuilderOfferingPath(offering))}`} className="flex rounded-sm bg-orange-600 hover:bg-orange-700 sm:min-w-56">
                Đăng nhập để chỉnh mẫu
              </GuestLinkButton>
            )}
            <WishlistToggleButton offering={createWishlistOfferingSnapshot(offering)} variant="button" />
            <GuestLinkButton href={ROUTES.WISHLIST} variant="secondary" className="flex rounded-sm sm:min-w-44">
              Lưu để mua sau
            </GuestLinkButton>
          </>
        }
      >
        <p className="rounded-sm bg-orange-50 px-4 py-3 text-sm leading-7 text-stone-700">
          Tạo ngay một bản nháp từ starter này để chỉnh trong editor. Builder template khác coded template ở chỗ có thể tiếp tục kéo thả và thay layout.
        </p>
      </OfferingDetailLayout>

      <div className="bg-stone-50 px-4 pb-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {[
            ["Kéo thả", "Chỉnh section sau khi tạo thiệp."],
            ["Clone starter", "Dùng mẫu này làm bản nháp ban đầu."],
            ["Xuất bản sau", "Hoàn thiện trong editor rồi public."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-sm border border-stone-200 bg-white p-5 shadow-sm">
              <p className="font-medium text-stone-950">{title}</p>
              <p className="mt-2 text-sm leading-7 text-stone-600">{body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-stone-50 px-4 pb-8">
        <div className="mx-auto max-w-7xl">
          <GuestPanel>
            <GuestPanelHeader>
              <GuestPanelTitle>Cấu hình starter</GuestPanelTitle>
            </GuestPanelHeader>
            <DetailGrid items={defaults} />
          </GuestPanel>
        </div>
      </div>
      <CommentSection target={{ type: "offering", id: offering.id, slug: offering.slug, title: offering.name, url: offeringPath }} />
    </>
  );
}

export async function renderGeneralOfferingPage(offering: Offering) {
  const user = await getCurrentUser();
  const offeringPath = getGeneralOfferingPath(offering);
  const details =
    typeof offering.config.offeringDetails === "object" && offering.config.offeringDetails
      ? (offering.config.offeringDetails as Record<string, unknown>)
      : {};
  const offeringJsonLd = {
    "@context": "https://schema.org",
    "@type": "Offering",
    name: offering.name,
    description: offering.description || offering.excerpt,
    image: offering.thumbnailUrl ? [offering.thumbnailUrl] : undefined,
    category: "Catalog Offering",
    offers: {
      "@type": "Offer",
      priceCurrency: "VND",
      price: String(offering.price),
      availability: "https://schema.org/InStock",
      url: offeringPath,
    },
  };

  return (
    <>
      <JsonLd data={offeringJsonLd} />
      <OfferingDetailLayout
        offering={offering}
        eyebrow="Sản phẩm"
        offeringLabel="Hàng catalog"
        metaRows={[
          ["Tình trạng", getStockLabel(offering)],
          ["Bàn giao", getFulfillmentLabel(offering.fulfillmentType)],
          ["Nguồn hàng", offering.ownerType === "provider" ? "Đối tác" : "Nội bộ"],
        ]}
        actions={
          <>
            {offering.fulfillmentType === "service" ? (
              user ? (
                <form action={ROUTES.API.CUSTOMER.BOOKINGS_CREATE} method="POST" className="sm:min-w-56">
                  <input type="hidden" name="offeringId" value={offering.id} />
                  <input type="hidden" name="providerId" value={offering.ownerProviderId ?? ""} />
                  <input type="hidden" name="providerType" value={offering.ownerProviderType ?? ""} />
                  <input type="hidden" name="quantity" value="1" />
                  <input type="hidden" name="returnTo" value={ROUTES.CUSTOMER.BOOKINGS} />
                  <GuestButton type="submit" className="w-full rounded-sm bg-orange-600 hover:bg-orange-700">
                    Đặt trực tiếp
                  </GuestButton>
                </form>
              ) : (
                <GuestLinkButton href={`${ROUTES.AUTH.LOGIN}?returnTo=${encodeURIComponent(getGeneralOfferingPath(offering))}`} className="flex rounded-sm bg-orange-600 hover:bg-orange-700 sm:min-w-56">
                  Đăng nhập để đặt
                </GuestLinkButton>
              )
            ) : null}
            {user ? (
              <form action={ROUTES.API.CUSTOMER.WISHLIST} method="POST" className="sm:min-w-56">
                <input type="hidden" name="intent" value="add" />
                <input type="hidden" name="offeringId" value={offering.id} />
                <input type="hidden" name="returnTo" value={ROUTES.WISHLIST} />
                <GuestButton type="submit" className="w-full rounded-sm bg-orange-600 hover:bg-orange-700">
                  Thêm vào giỏ yêu thích
                </GuestButton>
              </form>
            ) : (
              <GuestLinkButton href={`${ROUTES.AUTH.LOGIN}?returnTo=${encodeURIComponent(getGeneralOfferingPath(offering))}`} className="flex rounded-sm bg-orange-600 hover:bg-orange-700 sm:min-w-56">
                Đăng nhập để mua
              </GuestLinkButton>
            )}
            <WishlistToggleButton offering={createWishlistOfferingSnapshot(offering)} variant="button" />
            <GuestLinkButton href={ROUTES.WISHLIST} variant="secondary" className="flex rounded-sm sm:min-w-44">
              Mua từ yêu thích
            </GuestLinkButton>
          </>
        }
      />

      {Object.keys(details).length > 0 ? (
        <div className="bg-stone-50 px-4 pb-8">
          <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-stone-400">Thông số</p>
              <h2 className="mt-3 text-2xl font-semibold text-stone-950">Chi tiết sản phẩm</h2>
            </div>
            <GuestPanel>
              <DetailGrid items={details} />
            </GuestPanel>
          </div>
        </div>
      ) : null}
      <CommentSection target={{ type: "offering", id: offering.id, slug: offering.slug, title: offering.name, url: offeringPath }} />
    </>
  );
}

export function generateRegisteredOfferingMetadata(offering: Offering) {
  const type = getRegisteredOfferingType(offering.offeringType);
  if (!type) {
    return {};
  }

  switch (type.rendererKey) {
    case "physical-product":
    case "service":
      return generateGeneralOfferingMetadata(offering);
  }
}

export function renderRegisteredOfferingPage(offering: Offering) {
  const type = getRegisteredOfferingType(offering.offeringType);
  if (!type) {
    return null;
  }

  switch (type.rendererKey) {
    case "physical-product":
    case "service":
      return renderGeneralOfferingPage(offering);
  }
}
