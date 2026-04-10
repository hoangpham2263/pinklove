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
import type { Product } from "@/features/products/types";
import { getCurrentUser } from "@/lib/auth";
import { CreateBuilderForm } from "@/features/invitations/components/create-invitation-forms";
import { CreateFromProductForm } from "@/features/invitations/components/create-invitation-forms";
import { getInvitationTemplateDefaults, getInvitationTemplateLabel } from "@/features/invitations/templates/registry";
import { getBuilderProductPath, getTemplateProductPath, type PublicPermalinkConfig } from "@/lib/public-paths";
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
          <h1 className="text-2xl font-semibold text-stone-950 sm:text-3xl lg:text-4xl 2xl:text-5xl">{product.name}</h1>
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
                className="aspect-[16/9] w-full rounded-xl object-cover lg:rounded-2xl"
              />
            ) : (
              <div className="flex aspect-[16/9] w-full items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-stone-400 lg:rounded-2xl">
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
            <GuestPanelTitle>Tạo website thiệp từ mẫu này</GuestPanelTitle>
          </GuestPanelHeader>
          <GuestPanelBody className="space-y-4">
            <p className="text-sm leading-7 text-stone-600">
              Hiện tại repo chưa có checkout thật. Nút dưới đây sẽ tạo trực tiếp một `wedding_site` draft trong tài khoản của bạn để anh tiếp tục triển khai flow mua hàng sau.
            </p>
            {user ? (
              <CreateFromProductForm action={ROUTES.API.CUSTOMER.INVITATIONS.CREATE_FROM_PRODUCT} productSlug={product.slug}>
                <GuestButton type="submit" className="w-full">
                  Tạo thiệp từ mẫu này
                </GuestButton>
              </CreateFromProductForm>
            ) : (
              <div className="space-y-3">
                <GuestLinkButton href={ROUTES.AUTH.LOGIN} className="flex w-full">Đăng nhập để tạo thiệp</GuestLinkButton>
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
          <h1 className="text-2xl font-semibold text-stone-950 sm:text-3xl lg:text-4xl 2xl:text-5xl">{product.name}</h1>
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
            <GuestPanelTitle>Tạo site builder từ starter này</GuestPanelTitle>
          </GuestPanelHeader>
          <GuestPanelBody className="space-y-4">
            <p className="text-sm leading-7 text-stone-600">
              Luồng này tạo trực tiếp một `wedding_site` draft kiểu builder để anh có thể test editor section-based trước khi checkout thật được nối vào.
            </p>
            {user ? (
              <CreateBuilderForm action={ROUTES.API.CUSTOMER.INVITATIONS.CREATE_BUILDER} productSlug={product.slug}>
                <GuestButton type="submit" className="w-full">
                  Tạo thiệp tự tạo từ starter này
                </GuestButton>
              </CreateBuilderForm>
            ) : (
              <div className="space-y-3">
                <GuestLinkButton href={ROUTES.AUTH.LOGIN} className="flex w-full">Đăng nhập để bắt đầu</GuestLinkButton>
                <GuestLinkButton href={ROUTES.AUTH.REGISTER} variant="secondary" className="flex w-full">Tạo tài khoản mới</GuestLinkButton>
              </div>
            )}
          </GuestPanelBody>
        </GuestPanel>
      </aside>
    </section>
  );
}
