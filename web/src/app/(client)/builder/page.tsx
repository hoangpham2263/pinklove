import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { ClientLinkButton, ClientShell } from "@/app/(client)/_components/client-ui";
import { PageStructuredData } from "@/components/common/page-structured-data";
import { ProductCard } from "@/features/products/components/product-card";
import { listPublishedProductsByType } from "@/features/products/server/service";
import { buildPageMetadata, getCmsPageBySlug, getPublishedCmsPageBySlug } from "@/lib/cms";
import { ROUTES } from "@/lib/routes";

type BuilderLandingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: BuilderLandingPageProps): Promise<Metadata> {
  const resolvedSearchParams = (await searchParams) ?? {};
  const preview = resolvedSearchParams.preview === "1";
  const page = preview
    ? (await getCurrentUser())?.role === "admin"
      ? await getCmsPageBySlug("builder")
      : null
    : await getPublishedCmsPageBySlug("builder");

  return page ? await buildPageMetadata(page) : {};
}

export default async function BuilderLandingPage({ searchParams }: BuilderLandingPageProps) {
  const user = await getCurrentUser();
  const resolvedSearchParams = (await searchParams) ?? {};
  const preview = resolvedSearchParams.preview === "1";
  const page = preview
    ? user?.role === "admin"
      ? await getCmsPageBySlug("builder")
      : null
    : await getPublishedCmsPageBySlug("builder");
  const builderProducts = await listPublishedProductsByType("builder_template");

  return (
    <ClientShell className="gap-10 py-12">
      <PageStructuredData page={page} />
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.4em] text-stone-400">Tự tạo thiệp</p>
        <h1 className="text-2xl font-semibold text-stone-950 sm:text-3xl lg:text-4xl 2xl:text-5xl">
          {page?.title || "Bắt đầu một mẫu thiệp cưới tùy biến"}
        </h1>
        <p className="max-w-3xl text-sm leading-8 text-stone-600 md:text-base lg:text-lg">
          {page?.excerpt || "Luồng này tạo một `wedding_site` kiểu builder. Hiện tại builder đang ở mức section-based foundation để chuẩn bị cho giao diện kéo-thả sau này."}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {builderProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            href={ROUTES.WEDDING.BUILDER(product.slug)}
            ctaLabel="Chọn starter"
          />
        ))}
      </div>

      {!user && (
        <div className="flex flex-wrap gap-3">
          <ClientLinkButton href={ROUTES.AUTH.LOGIN}>Đăng nhập để bắt đầu</ClientLinkButton>
          <ClientLinkButton href={ROUTES.AUTH.REGISTER} variant="secondary">Đăng ký tài khoản</ClientLinkButton>
        </div>
      )}
    </ClientShell>
  );
}
