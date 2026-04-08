import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/common/json-ld";
import {
  ClientButton,
  ClientLinkButton,
  ClientPanel,
  ClientPanelBody,
  ClientPanelHeader,
  ClientPanelTitle,
} from "@/app/(client)/_components/client-ui";
import { NativeForm } from "@/components/common/native-form";
import { getCurrentUser } from "@/lib/auth";
import { getPublishedProductBySlugAndType } from "@/features/products/server/service";
import { getWeddingTemplateDefaults, getWeddingTemplateLabel } from "@/features/sites/templates/registry";
import { ROUTES } from "@/lib/routes";
import { createSeoMetadata } from "@/lib/seo";

type TemplateDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: TemplateDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublishedProductBySlugAndType(slug, "coded_template");

  if (!product) {
    return createSeoMetadata({
      title: "Mẫu thiệp cưới",
      description: "Chi tiết mẫu thiệp cưới.",
      path: ROUTES.TEMPLATES,
      noindex: true,
    });
  }

  return createSeoMetadata({
    title: product.name,
    description: product.description || product.excerpt || `Chi tiết mẫu thiệp cưới ${product.name}.`,
    path: ROUTES.WEDDING.TEMPLATE(product.slug),
    image: product.thumbnailUrl,
    keywords: ["mẫu thiệp cưới", getWeddingTemplateLabel(product.templateKey).toLowerCase(), product.name.toLowerCase()],
  });
}

export default async function TemplateDetailPage({ params }: TemplateDetailPageProps) {
  const { slug } = await params;
  const product = await getPublishedProductBySlugAndType(slug, "coded_template");
  if (!product) {
    notFound();
  }

  const user = await getCurrentUser();
  const defaults = {
    ...getWeddingTemplateDefaults(product.templateKey),
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
      url: ROUTES.WEDDING.TEMPLATE(product.slug),
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

        <ClientPanel>
          <ClientPanelHeader>
            <ClientPanelTitle>Xem nhanh</ClientPanelTitle>
          </ClientPanelHeader>
          <ClientPanelBody>
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
          </ClientPanelBody>
        </ClientPanel>

        <ClientPanel>
          <ClientPanelHeader>
            <ClientPanelTitle>Thông tin template</ClientPanelTitle>
          </ClientPanelHeader>
          <ClientPanelBody className="space-y-3 text-sm text-stone-700 md:text-base">
            <p><span className="font-medium text-stone-950">Template:</span> {getWeddingTemplateLabel(product.templateKey)}</p>
            <p><span className="font-medium text-stone-950">Loại:</span> Thiếp mẫu sẵn</p>
            <p><span className="font-medium text-stone-950">Giá:</span> {product.price}</p>
          </ClientPanelBody>
        </ClientPanel>

        <ClientPanel>
          <ClientPanelHeader>
            <ClientPanelTitle>Mặc định khi tạo site</ClientPanelTitle>
          </ClientPanelHeader>
          <ClientPanelBody className="grid gap-3 md:grid-cols-2">
            {Object.entries(defaults).map(([key, value]) => (
              <div key={key} className="rounded-xl border border-stone-200 bg-stone-50 p-4 lg:rounded-2xl">
                <p className="text-xs uppercase tracking-[0.3em] text-stone-400">{key}</p>
                <p className="mt-2 text-sm leading-6 text-stone-700">{Array.isArray(value) ? `${value.length} item(s)` : String(value)}</p>
              </div>
            ))}
          </ClientPanelBody>
        </ClientPanel>
      </div>

      <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
        <ClientPanel className="overflow-visible">
          <ClientPanelHeader>
            <ClientPanelTitle>Tạo website thiệp từ mẫu này</ClientPanelTitle>
          </ClientPanelHeader>
          <ClientPanelBody className="space-y-4">
            <p className="text-sm leading-7 text-stone-600">
              Hiện tại repo chưa có checkout thật. Nút dưới đây sẽ tạo trực tiếp một `wedding_site` draft trong tài khoản của bạn để anh tiếp tục triển khai flow mua hàng sau.
            </p>
            {user ? (
              <NativeForm action={ROUTES.API.USER.SITES.CREATE_FROM_PRODUCT} method="POST" className="space-y-3">
                <input type="hidden" name="productSlug" value={product.slug} />
                <ClientButton type="submit" className="w-full">
                  Tạo thiệp từ mẫu này
                </ClientButton>
              </NativeForm>
            ) : (
              <div className="space-y-3">
                <ClientLinkButton href={ROUTES.AUTH.LOGIN} className="flex w-full">Đăng nhập để tạo thiệp</ClientLinkButton>
                <ClientLinkButton href={ROUTES.AUTH.REGISTER} variant="secondary" className="flex w-full">Tạo tài khoản mới</ClientLinkButton>
              </div>
            )}
          </ClientPanelBody>
        </ClientPanel>
      </aside>
    </section>
  );
}
