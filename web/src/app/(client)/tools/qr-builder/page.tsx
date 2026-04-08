import type { Metadata } from "next";
import { ClientPanel, ClientPanelBody, ClientPanelHeader, ClientPanelTitle, ClientShell, ClientLinkButton, ClientInput } from "@/app/(client)/_components/client-ui";
import { PageStructuredData } from "@/components/common/page-structured-data";
import { getCurrentUser } from "@/lib/auth";
import { buildPageMetadata, getCmsPageBySlug, getPublishedCmsPageBySlug } from "@/lib/cms";
import { ROUTES } from "@/lib/routes";

type QrBuilderPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: QrBuilderPageProps): Promise<Metadata> {
  const resolvedSearchParams = (await searchParams) ?? {};
  const preview = resolvedSearchParams.preview === "1";
  const page = preview
    ? (await getCurrentUser())?.role === "admin"
      ? await getCmsPageBySlug("tools/qr-builder")
      : null
    : await getPublishedCmsPageBySlug("tools/qr-builder");

  return page ? await buildPageMetadata(page) : {};
}

export default async function QrBuilderPage({ searchParams }: QrBuilderPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const preview = resolvedSearchParams.preview === "1";
  const page = preview
    ? (await getCurrentUser())?.role === "admin"
      ? await getCmsPageBySlug("tools/qr-builder")
      : null
    : await getPublishedCmsPageBySlug("tools/qr-builder");

  return (
    <ClientShell className="gap-10 py-12">
      <PageStructuredData page={page} />
      <div className="mx-auto max-w-3xl space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-stone-400">
          <span>Công cụ</span>
          <span className="mx-2">/</span>
          <span>QR mừng cưới</span>
        </p>
        <h1 className="text-2xl font-semibold text-stone-950 sm:text-3xl lg:text-4xl 2xl:text-5xl">{page?.title || "QR mừng cưới custom"}</h1>
        <p className="text-sm leading-8 text-stone-600 md:text-base lg:text-lg">
          {page?.excerpt || "Bản v1 để chốt luồng sản phẩm. Bước tiếp theo có thể nối dữ liệu ngân hàng, render QR thật và xuất ảnh để chèn vào thiệp."}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <ClientPanel>
          <ClientPanelHeader>
            <ClientPanelTitle>Thông tin mã QR</ClientPanelTitle>
          </ClientPanelHeader>
          <ClientPanelBody className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Tên cô dâu chú rể</label>
              <ClientInput placeholder="Ví dụ: Linh & Tuan" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Ngân hàng</label>
              <ClientInput placeholder="Ví dụ: MB Bank" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Số tài khoản</label>
              <ClientInput placeholder="Ví dụ: 123456789" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Chủ tài khoản</label>
              <ClientInput placeholder="Ví dụ: Nguyen Van A" />
            </div>
          </ClientPanelBody>
        </ClientPanel>

        <ClientPanel>
          <ClientPanelHeader>
            <ClientPanelTitle>Xem trước</ClientPanelTitle>
          </ClientPanelHeader>
          <ClientPanelBody className="space-y-6">
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
            <ClientLinkButton href={ROUTES.TEMPLATES} className="flex w-full justify-center">
              Dùng QR này trong mẫu thiệp
            </ClientLinkButton>
          </ClientPanelBody>
        </ClientPanel>
      </div>
    </ClientShell>
  );
}
