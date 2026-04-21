import type { Metadata } from "next";
import Image from "next/image";
import { JsonLd } from "@/components/common/json-ld";
import {
  GuestButton,
  GuestLinkButton,
  GuestPanel,
  GuestPanelBody,
  GuestPanelHeader,
  GuestPanelTitle,
} from "@/app/(guest)/_components/guest-ui";
import { WishlistToggleButton } from "@/features/products/components/wishlist-toggle-button";
import type { Product } from "@/features/products/types";
import { createWishlistProductSnapshot } from "@/features/products/wishlist";
import { getCurrentUser } from "@/lib/auth";
import { getInvitationTemplateDefaults, getInvitationTemplateLabel } from "@/features/invitations/templates/registry";
import {
  getBuilderProductPath,
  getGeneralProductPath,
  getTemplateProductPath,
  type PublicPermalinkConfig,
} from "@/lib/public-paths";
import { ROUTES } from "@/lib/routes";
import { createSeoMetadata } from "@/lib/seo";

export async function generateTemplateProductMetadata(product: Product | null, config: PublicPermalinkConfig): Promise<Metadata> {
  if (!product) {
    return await createSeoMetadata({
      title: "Mẫu thiệp cưới",
      description: "Chi tiết mẫu thiệp cưới.",
      path: ROUTES.TEMPLATES,
      noindex: true,
    });
  }

  return await createSeoMetadata({
    title: product.name,
    description: product.description || product.excerpt || `Chi tiết mẫu thiệp cưới ${product.name}.`,
    path: getTemplateProductPath(product, config),
    image: product.thumbnailUrl,
    keywords: ["mẫu thiệp cưới", getInvitationTemplateLabel(product.templateKey).toLowerCase(), product.name.toLowerCase()],
  });
}

export async function generateGeneralProductMetadata(product: Product | null, config: PublicPermalinkConfig): Promise<Metadata> {
  if (!product) {
    return await createSeoMetadata({
      title: "Sản phẩm",
      description: "Chi tiết sản phẩm catalog.",
      path: "/products",
      noindex: true,
    });
  }

  return await createSeoMetadata({
    title: product.name,
    description: product.description || product.excerpt || `Chi tiết sản phẩm ${product.name}.`,
    path: getGeneralProductPath(product, config),
    image: product.thumbnailUrl,
    keywords: ["san pham", product.name.toLowerCase()],
  });
}

export async function generateBuilderProductMetadata(product: Product | null, config: PublicPermalinkConfig): Promise<Metadata> {
  if (!product) {
    return await createSeoMetadata({
      title: "Builder thiệp cưới",
      description: "Chi tiết builder starter.",
      path: ROUTES.BUILDER,
      noindex: true,
    });
  }

  return await createSeoMetadata({
    title: product.name,
    description: product.description || product.excerpt || `Chi tiết starter builder ${product.name}.`,
    path: getBuilderProductPath(product, config),
    image: product.thumbnailUrl,
    keywords: ["builder thiệp cưới", getInvitationTemplateLabel(product.templateKey).toLowerCase(), product.name.toLowerCase()],
  });
}

export async function renderTemplateProductPage(product: Product, config: PublicPermalinkConfig) {
  const user = await getCurrentUser();
  const defaults = {
    ...getInvitationTemplateDefaults(product.templateKey),
    ...((product.config.siteDefaults as Record<string, unknown> | undefined) ?? {}),
  };
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.excerpt,
    image: product.thumbnailUrl ? [product.thumbnailUrl] : undefined,
    category: "Wedding Invitation Template",
    offers: {
      "@type": "Offer",
      priceCurrency: "VND",
      price: String(product.price),
      availability: "https://schema.org/InStock",
      url: getTemplateProductPath(product, config),
    },
  };

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[minmax(0,9fr)_minmax(280px,3fr)]">
      <JsonLd data={productJsonLd} />
      <div className="min-w-0 space-y-6">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.4em] text-stone-400">Thiếp mẫu sẵn</p>
          <h1 className="text-2xl font-semibold text-stone-950 sm:text-3xl lg:text-4xl 2 xl:text-5xl">{product.name}</h1>
          <p className="text-sm leading-8 text-stone-600 md:text-base lg:text-lg">{product.description || product.excerpt}</p>
        </div>

        <GuestPanel>
          <GuestPanelHeader>
            <GuestPanelTitle>Xem nhanh</GuestPanelTitle>
          </GuestPanelHeader>
          <GuestPanelBody>
            {product.thumbnailUrl ? (
              <Image
                src={product.thumbnailUrl}
                alt={product.name}
                width={1600}
                height={900}
                className="aspect-video w-full rounded-xl object-cover lg:rounded-2xl"
              />
            ) : (
              <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-stone-400 lg:rounded-2xl">
                Chưa có ảnh preview
              </div>
            )}
          </GuestPanelBody>
        </GuestPanel>

        <GuestPanel>
          <GuestPanelHeader>
            <GuestPanelTitle>Thông tin template</GuestPanelTitle>
          </GuestPanelHeader>
          <GuestPanelBody className="space-y-3 text-sm text-stone-700 md:text-base">
            <p><span className="font-medium text-stone-950">Template:</span> {getInvitationTemplateLabel(product.templateKey)}</p>
            <p><span className="font-medium text-stone-950">Loại:</span> Thiếp mẫu sẵn</p>
            <p><span className="font-medium text-stone-950">Giá:</span> {product.price}</p>
          </GuestPanelBody>
        </GuestPanel>

        <GuestPanel>
          <GuestPanelHeader>
            <GuestPanelTitle>Mặc định khi tạo site</GuestPanelTitle>
          </GuestPanelHeader>
          <GuestPanelBody className="grid gap-3 md:grid-cols-2">
            {Object.entries(defaults).map(([key, value]) => (
              <div key={key} className="rounded-xl border border-stone-200 bg-stone-50 p-4 lg:rounded-2xl">
                <p className="text-xs uppercase tracking-[0.3em] text-stone-400">{key}</p>
                <p className="mt-2 text-sm leading-6 text-stone-700">{Array.isArray(value) ? `${value.length} item(s)` : String(value)}</p>
              </div>
            ))}
          </GuestPanelBody>
        </GuestPanel>
      </div>

      <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
        <GuestPanel className="overflow-visible">
          <GuestPanelHeader>
            <GuestPanelTitle>Mua và sử dụng mẫu này</GuestPanelTitle>
          </GuestPanelHeader>
          <GuestPanelBody className="space-y-4">
            <p className="text-sm leading-7 text-stone-600">
              Hay luu mau nay vao danh sach yeu thich. Trong PinkLove, yeu thich dong vai tro nhu gio hang de ban chon va thanh toan ngay tu do.
            </p>
            <WishlistToggleButton
              product={createWishlistProductSnapshot(product)}
              variant="button"
            />
            {user ? (
              <div className="space-y-3">
                <form action={ROUTES.API.CUSTOMER.WISHLIST} method="POST">
                  <input type="hidden" name="intent" value="add" />
                  <input type="hidden" name="productId" value={product.id} />
                  <input type="hidden" name="returnTo" value={ROUTES.WISHLIST} />
                  <GuestButton type="submit" className="w-full">
                    Luu va mo yeu thich
                  </GuestButton>
                </form>
                <GuestLinkButton href={ROUTES.WISHLIST} variant="secondary" className="flex w-full">
                  Mua tu danh sach yêu thích
                </GuestLinkButton>
              </div>
            ) : (
              <div className="space-y-3">
                <GuestLinkButton href={`${ROUTES.AUTH.LOGIN}?returnTo=${encodeURIComponent(getTemplateProductPath(product, config))}`} className="flex w-full">Dang nhap de luu va mua</GuestLinkButton>
                <GuestLinkButton href={ROUTES.AUTH.REGISTER} variant="secondary" className="flex w-full">Tạo tài khoản mới</GuestLinkButton>
              </div>
            )}
          </GuestPanelBody>
        </GuestPanel>
      </aside>
    </section>
  );
}

export async function renderBuilderProductPage(product: Product, config: PublicPermalinkConfig) {
  const user = await getCurrentUser();
  const defaults = {
    ...getInvitationTemplateDefaults(product.templateKey),
    ...((product.config.siteDefaults as Record<string, unknown> | undefined) ?? {}),
  };
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.excerpt,
    image: product.thumbnailUrl ? [product.thumbnailUrl] : undefined,
    category: "Wedding Invitation Builder",
    offers: {
      "@type": "Offer",
      priceCurrency: "VND",
      price: String(product.price),
      availability: "https://schema.org/InStock",
      url: getBuilderProductPath(product, config),
    },
  };

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 lg:grid-cols-12">
      <JsonLd data={productJsonLd} />
      <div className="min-w-0 space-y-6 lg:col-span-9">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.4em] text-stone-400">Tự tạo thiệp</p>
          <h1 className="text-2xl font-semibold text-stone-950 sm:text-3xl lg:text-4xl 2 xl:text-5xl">{product.name}</h1>
          <p className="text-sm leading-8 text-stone-600 md:text-base lg:text-lg">{product.description || product.excerpt}</p>
        </div>

        <GuestPanel>
          <GuestPanelHeader>
            <GuestPanelTitle>Thông tin builder starter</GuestPanelTitle>
          </GuestPanelHeader>
          <GuestPanelBody className="space-y-3 text-sm text-stone-700 md:text-base">
            <p><span className="font-medium text-stone-950">Template:</span> {getInvitationTemplateLabel(product.templateKey)}</p>
            <p><span className="font-medium text-stone-950">Loại:</span> Tự tạo thiệp</p>
            <p><span className="font-medium text-stone-950">Giá:</span> {product.price}</p>
          </GuestPanelBody>
        </GuestPanel>

        <GuestPanel>
          <GuestPanelHeader>
            <GuestPanelTitle>Section mặc định khi tạo site</GuestPanelTitle>
          </GuestPanelHeader>
          <GuestPanelBody className="grid gap-3 md:grid-cols-2">
            {Object.entries(defaults).map(([key, value]) => (
              <div key={key} className="rounded-xl border border-stone-200 bg-stone-50 p-4 lg:rounded-2xl">
                <p className="text-xs uppercase tracking-[0.3em] text-stone-400">{key}</p>
                <p className="mt-2 text-sm leading-6 text-stone-700">{Array.isArray(value) ? `${value.length} item(s)` : String(value)}</p>
              </div>
            ))}
          </GuestPanelBody>
        </GuestPanel>
      </div>

      <aside className="min-w-0 lg:col-span-3 lg:sticky lg:top-20 lg:self-start">
        <GuestPanel>
          <GuestPanelHeader>
            <GuestPanelTitle>Mua và dùng builder starter này</GuestPanelTitle>
          </GuestPanelHeader>
          <GuestPanelBody className="space-y-4">
            <p className="text-sm leading-7 text-stone-600">
              Builder starter nay se duoc luu vao danh sach yeu thich de ban chon va thanh toan. Sau khi don hang hoan tat, ban co the tao thiep builder tu khu vuc don hang.
            </p>
            <WishlistToggleButton
              product={createWishlistProductSnapshot(product)}
              variant="button"
            />
            {user ? (
              <div className="space-y-3">
                <form action={ROUTES.API.CUSTOMER.WISHLIST} method="POST">
                  <input type="hidden" name="intent" value="add" />
                  <input type="hidden" name="productId" value={product.id} />
                  <input type="hidden" name="returnTo" value={ROUTES.WISHLIST} />
                  <GuestButton type="submit" className="w-full">
                    Luu va mo yêu thích
                  </GuestButton>
                </form>
                <GuestLinkButton href={ROUTES.WISHLIST} variant="secondary" className="flex w-full">
                  Mua tu danh sach yêu thích
                </GuestLinkButton>
              </div>
            ) : (
              <div className="space-y-3">
                <GuestLinkButton href={`${ROUTES.AUTH.LOGIN}?returnTo=${encodeURIComponent(getBuilderProductPath(product, config))}`} className="flex w-full">Dang nhap de luu va mua</GuestLinkButton>
                <GuestLinkButton href={ROUTES.AUTH.REGISTER} variant="secondary" className="flex w-full">Tạo tài khoản mới</GuestLinkButton>
              </div>
            )}
          </GuestPanelBody>
        </GuestPanel>
      </aside>
    </section>
  );
}

export async function renderGeneralProductPage(product: Product, config: PublicPermalinkConfig) {
  const user = await getCurrentUser();
  const details =
    typeof product.config.productDetails === "object" && product.config.productDetails
      ? (product.config.productDetails as Record<string, unknown>)
      : {};
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.excerpt,
    image: product.thumbnailUrl ? [product.thumbnailUrl] : undefined,
    category: "Catalog Product",
    offers: {
      "@type": "Offer",
      priceCurrency: "VND",
      price: String(product.price),
      availability: "https://schema.org/InStock",
      url: getGeneralProductPath(product, config),
    },
  };

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[minmax(0,9fr)_minmax(280px,3fr)]">
      <JsonLd data={productJsonLd} />
      <div className="min-w-0 space-y-6">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.4em] text-stone-400">San pham</p>
          <h1 className="text-2xl font-semibold text-stone-950 sm:text-3xl lg:text-4xl 2 xl:text-5xl">{product.name}</h1>
          <p className="text-sm leading-8 text-stone-600 md:text-base lg:text-lg">{product.description || product.excerpt}</p>
        </div>

        <GuestPanel>
          <GuestPanelHeader>
            <GuestPanelTitle>Ảnh mẫu</GuestPanelTitle>
          </GuestPanelHeader>
          <GuestPanelBody>
            {product.thumbnailUrl ? (
              <Image
                src={product.thumbnailUrl}
                alt={product.name}
                width={1600}
                height={900}
                className="aspect-video w-full rounded-xl object-cover lg:rounded-2xl"
              />
            ) : (
              <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-stone-400 lg:rounded-2xl">
                Chưa có ảnh
              </div>
            )}
          </GuestPanelBody>
        </GuestPanel>

        <GuestPanel>
          <GuestPanelHeader>
            <GuestPanelTitle>Thông tin bán hàng</GuestPanelTitle>
          </GuestPanelHeader>
          <GuestPanelBody className="space-y-3 text-sm text-stone-700 md:text-base">
            <p>
              <span className="font-medium text-stone-950">Loại sản phẩm:</span>{" "}
              Sản phẩm
            </p>
            <p>
              <span className="font-medium text-stone-950">Nguồn hàng:</span>{" "}
              {product.ownerType === "vendor" ? "Đối tác" : "Nội bộ"}
            </p>
            <p>
              <span className="font-medium text-stone-950">Bàn giao:</span>{" "}
              {product.fulfillmentType === "physical" ? "Giao hàng vật lý" : product.fulfillmentType}
            </p>
            <p>
              <span className="font-medium text-stone-950">Giá hiển thị:</span> {product.price}
            </p>
          </GuestPanelBody>
        </GuestPanel>

        {Object.keys(details).length > 0 ? (
          <GuestPanel>
            <GuestPanelHeader>
              <GuestPanelTitle>Chi tiết từ catalog</GuestPanelTitle>
            </GuestPanelHeader>
            <GuestPanelBody className="grid gap-3 md:grid-cols-2">
              {Object.entries(details).map(([key, value]) => (
                <div key={key} className="rounded-xl border border-stone-200 bg-stone-50 p-4 lg:rounded-2xl">
                  <p className="text-xs uppercase tracking-[0.3em] text-stone-400">{key}</p>
                  <p className="mt-2 text-sm leading-6 text-stone-700">{Array.isArray(value) ? `${value.length} item(s)` : String(value)}</p>
                </div>
              ))}
            </GuestPanelBody>
          </GuestPanel>
        ) : null}
      </div>

      <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
        <GuestPanel className="overflow-visible">
          <GuestPanelHeader>
            <GuestPanelTitle>Đặt mua</GuestPanelTitle>
          </GuestPanelHeader>
          <GuestPanelBody className="space-y-4">
            <p className="text-sm leading-7 text-stone-600">
              Đây là sản phẩm bán ra theo luồng đơn hàng chuẩn của hệ thống: thêm vào danh sách yêu thích, thanh toán và theo dõi đơn hàng như bình thường.
            </p>
            <WishlistToggleButton product={createWishlistProductSnapshot(product)} variant="button" />
            {user ? (
              <div className="space-y-3">
                <form action={ROUTES.API.CUSTOMER.WISHLIST} method="POST">
                  <input type="hidden" name="intent" value="add" />
                  <input type="hidden" name="productId" value={product.id} />
                  <input type="hidden" name="returnTo" value={ROUTES.WISHLIST} />
                  <GuestButton type="submit" className="w-full">
                    Lưu và mở yêu thích
                  </GuestButton>
                </form>
                <GuestLinkButton href={ROUTES.WISHLIST} variant="secondary" className="flex w-full">
                  Mua từ danh sách yêu thích
                </GuestLinkButton>
              </div>
            ) : (
              <div className="space-y-3">
                <GuestLinkButton
                  href={`${ROUTES.AUTH.LOGIN}?returnTo=${encodeURIComponent(getGeneralProductPath(product, config))}`}
                  className="flex w-full"
                >
                  Đăng nhập để lưu và mua
                </GuestLinkButton>
                <GuestLinkButton href={ROUTES.AUTH.REGISTER} variant="secondary" className="flex w-full">
                  Tạo tài khoản mới
                </GuestLinkButton>
              </div>
            )}
          </GuestPanelBody>
        </GuestPanel>
      </aside>
    </section>
  );
}
