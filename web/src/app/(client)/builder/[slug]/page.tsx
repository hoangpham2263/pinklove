import type { Metadata } from "next";
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

type BuilderProductDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: BuilderProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublishedProductBySlugAndType(slug, "builder_template");

  if (!product) {
    return createSeoMetadata({
      title: "Builder thiệp cưới",
      description: "Chi tiết builder starter.",
      path: ROUTES.BUILDER,
      noindex: true,
    });
  }

  return createSeoMetadata({
    title: product.name,
    description: product.description || product.excerpt || `Chi tiết starter builder ${product.name}.`,
    path: ROUTES.WEDDING.BUILDER(product.slug),
    image: product.thumbnailUrl,
    keywords: ["builder thiệp cưới", getWeddingTemplateLabel(product.templateKey).toLowerCase(), product.name.toLowerCase()],
  });
}

export default async function BuilderProductDetailPage({ params }: BuilderProductDetailPageProps) {
  const { slug } = await params;
  const product = await getPublishedProductBySlugAndType(slug, "builder_template");
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
    category: "Wedding Invitation Builder",
    offers: {
      "@type": "Offer",
      priceCurrency: "VND",
      price: String(product.price),
      availability: "https://schema.org/InStock",
      url: ROUTES.WEDDING.BUILDER(product.slug),
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

        <ClientPanel>
          <ClientPanelHeader>
            <ClientPanelTitle>Thông tin builder starter</ClientPanelTitle>
          </ClientPanelHeader>
          <ClientPanelBody className="space-y-3 text-sm text-stone-700 md:text-base">
            <p><span className="font-medium text-stone-950">Template:</span> {getWeddingTemplateLabel(product.templateKey)}</p>
            <p><span className="font-medium text-stone-950">Loại:</span> Tự tạo thiệp</p>
            <p><span className="font-medium text-stone-950">Giá:</span> {product.price}</p>
          </ClientPanelBody>
        </ClientPanel>

        <ClientPanel>
          <ClientPanelHeader>
            <ClientPanelTitle>Section mặc định khi tạo site</ClientPanelTitle>
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

      <aside className="min-w-0 lg:col-span-3 lg:sticky lg:top-20 lg:self-start">
        <ClientPanel>
          <ClientPanelHeader>
            <ClientPanelTitle>Tạo site builder từ starter này</ClientPanelTitle>
          </ClientPanelHeader>
          <ClientPanelBody className="space-y-4">
            <p className="text-sm leading-7 text-stone-600">
              Luồng này tạo trực tiếp một `wedding_site` draft kiểu builder để anh có thể test editor section-based trước khi checkout thật được nối vào.
            </p>
            {user ? (
              <NativeForm action={ROUTES.API.USER.SITES.CREATE_BUILDER} method="POST" className="space-y-3">
                <input type="hidden" name="productSlug" value={product.slug} />
                <ClientButton type="submit" className="w-full">
                  Tạo thiệp tự tạo từ starter này
                </ClientButton>
              </NativeForm>
            ) : (
              <div className="space-y-3">
                <ClientLinkButton href={ROUTES.AUTH.LOGIN} className="flex w-full">Đăng nhập để bắt đầu</ClientLinkButton>
                <ClientLinkButton href={ROUTES.AUTH.REGISTER} variant="secondary" className="flex w-full">Tạo tài khoản mới</ClientLinkButton>
              </div>
            )}
          </ClientPanelBody>
        </ClientPanel>
      </aside>
    </section>
  );
}
