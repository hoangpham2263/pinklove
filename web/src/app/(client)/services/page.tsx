import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageStructuredData } from "@/components/common/page-structured-data";
import {
  ClientLinkButton,
  ClientPanel,
  ClientPanelBody,
  ClientPanelHeader,
  ClientPanelTitle,
  ClientShell,
} from "@/app/(client)/_components/client-ui";
import { buildPageMetadata, getAccessibleCmsPageBySlug } from "@/lib/cms";
import { ROUTES } from "@/lib/routes";

type ServicesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: ServicesPageProps): Promise<Metadata> {
  const resolvedSearchParams = (await searchParams) ?? {};
  const page = await getAccessibleCmsPageBySlug("services", {
    preview: resolvedSearchParams.preview === "1",
  });

  return page ? await buildPageMetadata(page) : {};
}

const plans = [
  {
    name: "Free Plan",
    price: "0đ",
    summary: "Bắt đầu nhanh với nhu cầu cơ bản.",
    features: [
      "Dùng mẫu thiệp có sẵn",
      "Tự chỉnh nội dung cơ bản",
      "Xuất bản 1 thiệp",
      "Phù hợp để thử nghiệm ban đầu",
    ],
  },
  {
    name: "Basic Plan",
    price: "499.000đ",
    summary: "Phù hợp cho nhu cầu triển khai thực tế, gọn và đủ dùng.",
    features: [
      "Dùng mẫu có sẵn và starter builder",
      "Tùy chỉnh nội dung đầy đủ",
      "Ưu tiên hỗ trợ khi setup",
      "Phù hợp cho đa số cặp đôi",
    ],
  },
  {
    name: "Premium Plan",
    price: "1.490.000đ",
    summary: "Dành cho nhu cầu chỉn chu hơn và cần hỗ trợ sâu hơn.",
    features: [
      "Tùy chỉnh sâu hơn theo yêu cầu",
      "Ưu tiên hỗ trợ nhanh",
      "Định hướng giao diện và nội dung",
      "Phù hợp khi cần trải nghiệm riêng",
    ],
  },
];

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const page = await getAccessibleCmsPageBySlug("services", {
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
          <span>Trang chủ</span>
          <span className="mx-2">/</span>
          <span>Gói dịch vụ</span>
        </p>
        <h1 className="text-2xl font-semibold text-stone-950 sm:text-3xl lg:text-4xl 2xl:text-5xl">{page?.title || "Gói dịch vụ"}</h1>
        <p className="text-sm leading-8 text-stone-600 md:text-base lg:text-lg">
          {page?.excerpt || "Chọn gói phù hợp với mức độ tùy chỉnh và hỗ trợ mà bạn cần cho thiệp cưới online của mình."}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <ClientPanel key={plan.name} className="h-full">
            <ClientPanelHeader>
              <p className="text-xs uppercase tracking-[0.3em] text-stone-400">{plan.name}</p>
              <ClientPanelTitle className="mt-3">{plan.price}</ClientPanelTitle>
              <p className="mt-3 text-sm leading-7 text-stone-600">{plan.summary}</p>
            </ClientPanelHeader>
            <ClientPanelBody className="flex h-full flex-col gap-6">
              <div className="space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700 lg:rounded-2xl">
                    {feature}
                  </div>
                ))}
              </div>
              <div className="mt-auto">
                <ClientLinkButton href={ROUTES.CONTACT ?? "/contact"} className="flex w-full justify-center">
                  Liên hệ tư vấn
                </ClientLinkButton>
              </div>
            </ClientPanelBody>
          </ClientPanel>
        ))}
      </div>
    </ClientShell>
  );
}
