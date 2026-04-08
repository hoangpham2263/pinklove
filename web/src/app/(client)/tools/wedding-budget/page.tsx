import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClientPanel, ClientPanelBody, ClientPanelHeader, ClientPanelTitle, ClientShell, ClientLinkButton, ClientInput } from "@/app/(client)/_components/client-ui";
import { PageStructuredData } from "@/components/common/page-structured-data";
import { buildPageMetadata, getAccessibleCmsPageBySlug } from "@/lib/cms";
import { ROUTES } from "@/lib/routes";

type WeddingBudgetPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: WeddingBudgetPageProps): Promise<Metadata> {
  const resolvedSearchParams = (await searchParams) ?? {};
  const page = await getAccessibleCmsPageBySlug("tools/wedding-budget", {
    preview: resolvedSearchParams.preview === "1",
  });

  return page ? await buildPageMetadata(page) : {};
}

const categories = [
  { label: "Nhà hàng", percent: "50%" },
  { label: "Chụp ảnh", percent: "15%" },
  { label: "Trang phục", percent: "10%" },
  { label: "Trang trí", percent: "10%" },
  { label: "Thiệp & in ấn", percent: "5%" },
  { label: "Khác", percent: "10%" },
];

export default async function WeddingBudgetPage({ searchParams }: WeddingBudgetPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const page = await getAccessibleCmsPageBySlug("tools/wedding-budget", {
    preview: resolvedSearchParams.preview === "1",
  });
  if (!page) {
    notFound();
  }

  return (
    <ClientShell className="gap-10 py-12">
      <PageStructuredData page={page} />
      <div className="mx-auto max-w-3xl space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-stone-400">
          <span>Công cụ</span>
          <span className="mx-2">/</span>
          <span>Chi phí cưới</span>
        </p>
        <h1 className="text-2xl font-semibold text-stone-950 sm:text-3xl lg:text-4xl 2xl:text-5xl">{page?.title || "Bảng tính chi phí cưới"}</h1>
        <p className="text-sm leading-8 text-stone-600 md:text-base lg:text-lg">
          {page?.excerpt || "Bản v1 giúp chia ngân sách cưới theo tỷ lệ tham khảo để bạn có một khung dự trù nhanh trước khi chốt chi tiết."}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <ClientPanel>
          <ClientPanelHeader>
            <ClientPanelTitle>Ngân sách dự kiến</ClientPanelTitle>
          </ClientPanelHeader>
          <ClientPanelBody className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Tổng ngân sách</label>
              <ClientInput placeholder="Ví dụ: 150000000" />
            </div>
            <p className="text-sm leading-7 text-stone-600">
              Bước tiếp theo có thể thêm slider và tính tiền realtime cho từng hạng mục.
            </p>
          </ClientPanelBody>
        </ClientPanel>

        <ClientPanel>
          <ClientPanelHeader>
            <ClientPanelTitle>Phân bổ tham khảo</ClientPanelTitle>
          </ClientPanelHeader>
          <ClientPanelBody className="space-y-3">
            {categories.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 lg:rounded-2xl">
                <span className="text-sm font-medium text-stone-800">{item.label}</span>
                <span className="text-sm text-stone-500">{item.percent}</span>
              </div>
            ))}
            <div className="pt-3">
              <ClientLinkButton href={ROUTES.TEMPLATES} className="flex w-full justify-center">
                Tiết kiệm bằng thiệp online
              </ClientLinkButton>
            </div>
          </ClientPanelBody>
        </ClientPanel>
      </div>
    </ClientShell>
  );
}
