import type { Metadata } from "next";
import Image from "next/image";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/common/json-ld";
import { NativeForm } from "@/components/common/native-form";
import { PagedCarousel } from "@/components/common/paged-carousel";
import {
  GuestButton,
  GuestLinkButton,
  GuestPanel,
  GuestPanelBody,
  GuestPanelHeader,
  GuestPanelTitle,
} from "@/app/(guest)/_components/guest-ui";
import { WishlistToggleButton } from "@/features/offerings/components/wishlist-toggle-button";
import { LoopOnlineInvitationCard } from "@/features/offerings/components/LoopOnlineInvitationCard";
import { LoopOfferingCard } from "@/features/offerings/components/LoopOfferingCard";
import { OfferingReviewSection } from "@/features/comments/components/offering-review-section";
import { getRegisteredOfferingType } from "@/features/offerings/type-registry";
import { getOfferingTypeLabel, type Offering } from "@/features/offerings/types";
import { listRelatedTemplateOfferings } from "@/features/offerings/server/service";
import { createWishlistOfferingSnapshot } from "@/features/offerings/wishlist";
import { getCurrentUser } from "@/lib/auth";
import { getInvitationTemplateDefaults, getInvitationTemplateLabel } from "@/features/invitations/templates/registry";
import {
  getOfferingPath,
  getTemplateOfferingCustomizePath,
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

const primaryOfferingActionClassName =
  "flex min-h-11 w-full items-center justify-center rounded-sm bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 lg:rounded-sm lg:text-sm";

const wishlistOfferingActionClassName =
  "min-h-11 rounded-sm border-primary/25 text-sm font-semibold text-primary hover:border-primary hover:bg-primary/5 lg:rounded-sm";

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
    <section className="bg-stone-50 pt-10 lg:pt-15 2xl:pt-20">
      <div className="container mx-auto px-4">
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
            <div className="flex h-full flex-col border border-stone-200 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-sm bg-primary px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary-foreground">
                {eyebrow}
              </span>
              <span className="rounded-sm border border-primary/15 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary">{offeringLabel}</span>
            </div>

            <h1 className="mt-4 text-2xl font-semibold leading-tight text-stone-950 md:text-3xl">{offering.name}</h1>
            <p className="mt-3 text-sm leading-7 text-stone-600 md:text-base">{offering.description || offering.excerpt || "Chưa có mô tả cho sản phẩm/dịch vụ này."}</p>

            <div className="mt-5 border-y border-primary/10 bg-primary/5 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Giá</p>
              <p className="mt-1 text-3xl font-semibold text-primary md:text-4xl">{formatVnd(offering.price)}</p>
            </div>

            <div className="mt-5 divide-y divide-stone-100 border-y border-stone-100 text-sm">
              {metaRows.map(([label, value]) => (
                <div key={label} className="grid grid-cols-12 gap-4 py-3">
                  <span className="col-span-4 text-stone-500 sm:col-span-3">{label}</span>
                  <span className="col-span-8 min-w-0 font-medium text-stone-900 sm:col-span-9">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 [&>*]:min-h-11 [&>*]:w-full">{actions}</div>

            {children ? <div className="mt-6">{children}</div> : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TemplateInfoSection() {
  const items = [
    ["Giao diện ổn định", "Mẫu thiệp được dựng sẵn, hiển thị đẹp trên điện thoại và máy tính."],
    ["Dễ chỉnh nội dung", "Thay tên cô dâu chú rể, lời mời, thời gian, địa điểm và hình ảnh."],
    ["Dùng làm thiệp online", "Tạo thiệp online từ mẫu và gửi link cho khách mời sau khi hoàn tất."],
  ];

  return (
    <section className="bg-stone-50 pt-10 lg:pt-15 2xl:pt-20">
      <div className="container mx-auto px-4">
        <div className="bg-white px-5 py-6">
        <h2 className="text-xl font-semibold">Thông tin mẫu thiệp</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {items.map(([title, body]) => (
            <div key={title} className="rounded-sm border p-4">
              <p className="font-medium">{title}</p>
              <p className="mt-2 text-sm leading-7">{body}</p>
            </div>
          ))}
        </div>
        </div>
      </div>
    </section>
  );
}

function RelatedTemplateSidebar({
  relatedOfferings,
}: {
  relatedOfferings: Offering[];
}) {
  const promotions = [
    ["PLWEDDING", "Giảm 10% khi tạo thiệp online trong hôm nay."],
    ["LOVE2026", "Tặng gói chỉnh nội dung cơ bản cho mẫu thiệp này."],
  ];

  return (
    <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-sm border bg-white p-5">
        <p className="font-semibold">Mã ưu đãi</p>
        <div className="mt-4 space-y-3">
          {promotions.map(([code, body]) => (
            <div key={code} className="rounded-sm border border-dashed p-3">
              <p className="font-semibold">{code}</p>
              <p className="mt-1 text-sm leading-6">{body}</p>
            </div>
          ))}
        </div>
      </div>

      {relatedOfferings.slice(0, 4).map((item) => (
        item.offeringType === "digital_template" ? (
          <LoopOnlineInvitationCard
            key={item.id}
            offering={item}
            className="w-full"
            flat
          />
        ) : (
          <LoopOfferingCard
            key={item.id}
            offering={item}
            className="w-full"
            flat
          />
        )
      ))}
    </aside>
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
    path: getOfferingPath(offering),
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
    path: getOfferingPath(offering),
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
    path: getOfferingPath(offering),
    image: offering.thumbnailUrl,
    keywords: ["builder thiệp cưới", getInvitationTemplateLabel(offering.templateKey).toLowerCase(), offering.name.toLowerCase()],
  });
}

export async function renderTemplateOfferingPage(offering: Offering) {
  const offeringPath = getOfferingPath(offering);
  const relatedOfferings = await listRelatedTemplateOfferings(offering.id);
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
            <WishlistToggleButton
              offering={createWishlistOfferingSnapshot(offering)}
              variant="button"
              className={wishlistOfferingActionClassName}
            />
            <GuestLinkButton href={getTemplateOfferingCustomizePath(offering)} className={primaryOfferingActionClassName}>
              Sử dụng mẫu
            </GuestLinkButton>
          </>
        }
      />

      <TemplateInfoSection />

      <section className="bg-stone-50 pt-10 lg:pt-15 2xl:pt-20">
        <div className="container mx-auto grid grid-cols-12 gap-6 px-4">
          <div className="col-span-12 space-y-6 lg:col-span-10">
            <GuestPanel>
              <GuestPanelHeader>
                <GuestPanelTitle>Mô tả mẫu thiệp</GuestPanelTitle>
              </GuestPanelHeader>
              <GuestPanelBody className="space-y-4 text-sm leading-7">
                <p>
                  {offering.description ||
                    offering.excerpt ||
                    "Mẫu thiệp online được thiết kế sẵn để tạo nhanh wedding site, phù hợp cho cặp đôi muốn có thiệp đẹp, dễ gửi và dễ chỉnh nội dung."}
                </p>
                <p>
                  Sau khi chọn mẫu, bạn có thể thay thông tin cô dâu chú rể, lời mời, ngày giờ, địa điểm và hình ảnh trước khi gửi link cho khách mời.
                </p>
              </GuestPanelBody>
            </GuestPanel>

            <GuestPanel>
              <GuestPanelHeader>
                <GuestPanelTitle>Nội dung mặc định</GuestPanelTitle>
              </GuestPanelHeader>
              <DetailGrid items={defaults} />
            </GuestPanel>

            <OfferingReviewSection
              target={{ type: "offering", id: offering.id, slug: offering.slug, title: offering.name, url: offeringPath }}
              embedded
            />
          </div>

          <div className="col-span-12 lg:col-span-2">
            <RelatedTemplateSidebar relatedOfferings={relatedOfferings} />
          </div>
        </div>
      </section>

      {relatedOfferings.length > 0 ? (
        <section className="bg-stone-50 pt-10 lg:pt-15 2xl:pt-20">
          <div className="container mx-auto px-4">
            <PagedCarousel
              itemsPerPage={5}
              controlsVariant="buttons"
              controlsPosition="header"
              gridClassName="grid cursor-grab touch-pan-y select-none gap-4 active:cursor-grabbing sm:grid-cols-2 lg:grid-cols-5 lg:gap-5"
              header={(
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Gợi ý thêm</p>
                  <h2 className="mt-2 text-2xl font-semibold">Mẫu thiệp liên quan</h2>
                </div>
              )}
            >
              {relatedOfferings.map((item) => (
                item.offeringType === "digital_template" ? (
                  <LoopOnlineInvitationCard key={item.id} offering={item} className="w-full shrink-0" flat />
                ) : (
                  <LoopOfferingCard key={item.id} offering={item} className="w-full shrink-0" flat />
                )
              ))}
            </PagedCarousel>
          </div>
        </section>
      ) : null}
    </>
  );
}

export async function renderBuilderOfferingPage(offering: Offering) {
  const user = await getCurrentUser();
  const offeringPath = getOfferingPath(offering);
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
            <WishlistToggleButton
              offering={createWishlistOfferingSnapshot(offering)}
              variant="button"
              className={wishlistOfferingActionClassName}
            />
            {user ? (
              <NativeForm action={ROUTES.API.CUSTOMER.INVITATIONS.CREATE_BUILDER} method="POST">
                <input type="hidden" name="offeringSlug" value={offering.slug} />
                <GuestButton type="submit" className={primaryOfferingActionClassName}>
                  Sử dụng mẫu
                </GuestButton>
              </NativeForm>
            ) : (
              <GuestLinkButton href={`${ROUTES.AUTH.LOGIN}?returnTo=${encodeURIComponent(getOfferingPath(offering))}`} className={primaryOfferingActionClassName}>
                Sử dụng mẫu
              </GuestLinkButton>
            )}
          </>
        }
      >
        <p className="rounded-sm bg-orange-50 px-4 py-3 text-sm leading-7 text-stone-700">
          Tạo ngay một bản nháp từ starter này để chỉnh trong editor. Builder template khác coded template ở chỗ có thể tiếp tục kéo thả và thay layout.
        </p>
      </OfferingDetailLayout>

      <section className="bg-stone-50 pt-10 lg:pt-15 2xl:pt-20">
        <div className="container mx-auto grid gap-4 px-4 md:grid-cols-3">
          {[
            ["Kéo thả", "Chỉnh section sau khi tạo thiệp."],
            ["Clone starter", "Dùng mẫu này làm bản nháp ban đầu."],
            ["Xuất bản sau", "Hoàn thiện trong editor rồi public."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-sm border border-stone-200 bg-white p-5">
              <p className="font-medium text-stone-950">{title}</p>
              <p className="mt-2 text-sm leading-7 text-stone-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-stone-50 pt-10 lg:pt-15 2xl:pt-20">
        <div className="container mx-auto px-4">
          <GuestPanel>
            <GuestPanelHeader>
              <GuestPanelTitle>Cấu hình starter</GuestPanelTitle>
            </GuestPanelHeader>
            <DetailGrid items={defaults} />
          </GuestPanel>
        </div>
      </section>
      <OfferingReviewSection target={{ type: "offering", id: offering.id, slug: offering.slug, title: offering.name, url: offeringPath }} />
    </>
  );
}

export async function renderGeneralOfferingPage(offering: Offering) {
  const user = await getCurrentUser();
  const offeringPath = getOfferingPath(offering);
  const relatedOfferings = await listRelatedTemplateOfferings(offering.id);
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
        eyebrow={offering.fulfillmentType === "service" ? "Dịch vụ" : "Sản phẩm"}
        offeringLabel={getOfferingTypeLabel(offering.offeringType)}
        metaRows={[
          ["Tình trạng", getStockLabel(offering)],
          ["Bàn giao", getFulfillmentLabel(offering.fulfillmentType)],
          ["Nguồn hàng", offering.ownerType === "provider" ? "Đối tác" : "Nội bộ"],
        ]}
        actions={
          <>
            <WishlistToggleButton
              offering={createWishlistOfferingSnapshot(offering)}
              variant="button"
              className={wishlistOfferingActionClassName}
            />
            {offering.fulfillmentType === "service" ? (
              user ? (
                <NativeForm action={ROUTES.API.CUSTOMER.BOOKINGS_CREATE} method="POST">
                  <input type="hidden" name="offeringId" value={offering.id} />
                  <input type="hidden" name="providerId" value={offering.ownerProviderId ?? ""} />
                  <input type="hidden" name="providerType" value={offering.ownerProviderType ?? ""} />
                  <input type="hidden" name="quantity" value="1" />
                  <input type="hidden" name="returnTo" value={ROUTES.CUSTOMER.BOOKINGS} />
                  <GuestButton type="submit" className={primaryOfferingActionClassName}>
                    Đặt trực tiếp
                  </GuestButton>
                </NativeForm>
              ) : (
                <GuestLinkButton href={`${ROUTES.AUTH.LOGIN}?returnTo=${encodeURIComponent(getOfferingPath(offering))}`} className={primaryOfferingActionClassName}>
                  Đặt trực tiếp
                </GuestLinkButton>
              )
            ) : user ? (
              <NativeForm action={ROUTES.API.CUSTOMER.WISHLIST} method="POST">
                <input type="hidden" name="intent" value="add" />
                <input type="hidden" name="offeringId" value={offering.id} />
                <input type="hidden" name="returnTo" value={ROUTES.WISHLIST} />
                <GuestButton type="submit" className={primaryOfferingActionClassName}>
                  Mua ngay
                </GuestButton>
              </NativeForm>
            ) : (
              <GuestLinkButton href={`${ROUTES.AUTH.LOGIN}?returnTo=${encodeURIComponent(getOfferingPath(offering))}`} className={primaryOfferingActionClassName}>
                Mua ngay
              </GuestLinkButton>
            )}
          </>
        }
      />

      <section className="bg-stone-50 pt-10 lg:pt-15 2xl:pt-20">
        <div className="container mx-auto grid grid-cols-12 gap-6 px-4">
          <div className="col-span-12 space-y-6 lg:col-span-10">
            <GuestPanel>
              <GuestPanelHeader>
                <GuestPanelTitle>Mô tả sản phẩm</GuestPanelTitle>
              </GuestPanelHeader>
              <GuestPanelBody className="space-y-4 text-sm leading-7">
                <p>
                  {offering.description ||
                    offering.excerpt ||
                    "Sản phẩm được PinkLove chọn lọc cho nhu cầu chuẩn bị cưới, dễ lưu lại và tiếp tục thanh toán khi cần."}
                </p>
              </GuestPanelBody>
            </GuestPanel>

            {Object.keys(details).length > 0 ? (
              <GuestPanel>
                <GuestPanelHeader>
                  <GuestPanelTitle>Chi tiết sản phẩm</GuestPanelTitle>
                </GuestPanelHeader>
                <DetailGrid items={details} />
              </GuestPanel>
            ) : null}

            <OfferingReviewSection
              target={{ type: "offering", id: offering.id, slug: offering.slug, title: offering.name, url: offeringPath }}
              embedded
            />
          </div>

          <div className="col-span-12 lg:col-span-2">
            <RelatedTemplateSidebar relatedOfferings={relatedOfferings} />
          </div>
        </div>
      </section>
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
