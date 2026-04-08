import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClientShell } from "@/app/(client)/_components/client-ui";
import { PageStructuredData } from "@/components/common/page-structured-data";
import { ProductCard } from "@/features/products/components/product-card";
import { listPublishedProducts } from "@/features/products/server/service";
import { buildPageMetadata, getAccessibleCmsPageBySlug } from "@/lib/cms";
import { ROUTES } from "@/lib/routes";

type TemplatesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: TemplatesPageProps): Promise<Metadata> {
  const resolvedSearchParams = (await searchParams) ?? {};
  const page = await getAccessibleCmsPageBySlug("templates", {
    preview: resolvedSearchParams.preview === "1",
  });

  return page ? await buildPageMetadata(page) : {};
}

export default async function Page({ searchParams }: TemplatesPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const page = await getAccessibleCmsPageBySlug("templates", {
    preview: resolvedSearchParams.preview === "1",
  });
  if (!page) {
    notFound();
  }
  const products = await listPublishedProducts();
  const codedTemplates = products.filter((product) => product.productType === "coded_template");
  const builderTemplates = products.filter((product) => product.productType === "builder_template");

  return (
    <ClientShell className="gap-10 py-12">
      <PageStructuredData page={page} />
      <div className="mx-auto max-w-3xl space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-stone-400">
          <span>Trang chủ</span>
          <span className="mx-2">/</span>
          <span>Mẫu thiệp</span>
        </p>
        <h1 className="text-2xl font-semibold text-stone-950 sm:text-3xl lg:text-4xl 2xl:text-5xl">{page?.title || "Mẫu thiệp"}</h1>
        <p className="text-sm leading-8 text-stone-600 md:text-base lg:text-lg">
          {page?.excerpt || "Hiện tại PinkLove có 2 loại mẫu thiệp để bạn bắt đầu nhanh hơn: mẫu code sẵn và mẫu builder linh hoạt."}
        </p>
      </div>

      <section className="space-y-6">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Loại 1</p>
          <h2 className="text-xl font-semibold text-stone-950 sm:text-2xl lg:text-3xl 2xl:text-4xl">Mẫu thiệp code sẵn</h2>
          <p className="max-w-3xl text-sm leading-8 text-stone-600 md:text-base lg:text-lg">
            Phù hợp khi bạn muốn đi nhanh với bố cục đã hoàn chỉnh, chỉ cần chỉnh nội dung và xuất bản.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {codedTemplates.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Loại 2</p>
          <h2 className="text-xl font-semibold text-stone-950 sm:text-2xl lg:text-3xl 2xl:text-4xl">Mẫu thiệp builder</h2>
          <p className="max-w-3xl text-sm leading-8 text-stone-600 md:text-base lg:text-lg">
            Phù hợp khi bạn muốn chủ động hơn trong cách sắp nội dung và dựng thiệp theo ý của mình.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {builderTemplates.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              href={ROUTES.WEDDING.BUILDER(product.slug)}
              ctaLabel="Xem builder"
            />
          ))}
        </div>
      </section>
    </ClientShell>
  );
}
