import type { Metadata } from "next";
import { ClientPanel, ClientPanelBody, ClientPanelHeader, ClientPanelTitle, ClientShell, ClientLinkButton } from "@/app/(client)/_components/client-ui";
import { PageStructuredData } from "@/components/common/page-structured-data";
import { getCurrentUser } from "@/lib/auth";
import { buildPageMetadata, getCmsPageBySlug, getPublishedCmsPageBySlug } from "@/lib/cms";
import { ROUTES } from "@/lib/routes";

type ToolsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: ToolsPageProps): Promise<Metadata> {
  const resolvedSearchParams = (await searchParams) ?? {};
  const preview = resolvedSearchParams.preview === "1";
  const page = preview
    ? (await getCurrentUser())?.role === "admin"
      ? await getCmsPageBySlug("tools")
      : null
    : await getPublishedCmsPageBySlug("tools");

  return page ? await buildPageMetadata(page) : {};
}

const tools = [
  {
    title: "QR mừng cưới custom",
    description: "Tạo mã QR mừng cưới đẹp hơn để chèn vào thiệp, bảng gallery hoặc website cưới.",
    href: ROUTES.TOOLS_PAGES.QR_BUILDER,
    cta: "Mở tool QR",
  },
  {
    title: "Bảng tính chi phí cưới",
    description: "Chia ngân sách cưới theo từng hạng mục để dễ dự trù và ra quyết định nhanh hơn.",
    href: ROUTES.TOOLS_PAGES.WEDDING_BUDGET,
    cta: "Mở bảng chi phí",
  },
];

export default async function ToolsPage({ searchParams }: ToolsPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const preview = resolvedSearchParams.preview === "1";
  const page = preview
    ? (await getCurrentUser())?.role === "admin"
      ? await getCmsPageBySlug("tools")
      : null
    : await getPublishedCmsPageBySlug("tools");

  return (
    <ClientShell className="gap-10 py-12">
      <PageStructuredData page={page} />
      <div className="mx-auto max-w-3xl space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-stone-400">
          <span>Trang chủ</span>
          <span className="mx-2">/</span>
          <span>Công cụ</span>
        </p>
        <h1 className="text-2xl font-semibold text-stone-950 sm:text-3xl lg:text-4xl 2xl:text-5xl">{page?.title || "Công cụ"}</h1>
        <p className="text-sm leading-8 text-stone-600 md:text-base lg:text-lg">
          {page?.excerpt || "Các mini-tool này giúp giải quyết nhanh những việc nhỏ trong hành trình chuẩn bị cưới, đồng thời dẫn sang flow tạo thiệp online tự nhiên hơn."}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {tools.map((tool) => (
          <ClientPanel key={tool.href} className="h-full">
            <ClientPanelHeader>
              <ClientPanelTitle>{tool.title}</ClientPanelTitle>
            </ClientPanelHeader>
            <ClientPanelBody className="flex h-full flex-col gap-6">
              <p className="text-sm leading-8 text-stone-600 md:text-base lg:text-lg">{tool.description}</p>
              <div className="mt-auto">
                <ClientLinkButton href={tool.href}>{tool.cta}</ClientLinkButton>
              </div>
            </ClientPanelBody>
          </ClientPanel>
        ))}
      </div>
    </ClientShell>
  );
}
