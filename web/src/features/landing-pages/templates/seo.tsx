import type { LandingPageTemplate } from "@/features/landing-pages/types";
import { getContentString, getContentStringArray, getSectionContent, PriceLine, ProductImage, LandingPageCta, LandingPageFrame, type LandingPageTemplateProps } from "./shared";

export const seoLandingTemplate: LandingPageTemplate = {
  id: "seo",
  name: "SEO Longform",
  slug: "seo",
  description: "Landing page dài hơn, có mô tả, FAQ, related products và cấu trúc hỗ trợ organic.",
  pageType: "seo",
  themeConfig: {
    templateId: "seo",
    palette: "content-light",
    typography: "readable-sans",
    accentColor: "#2563EB",
  },
  sections: [
    {
      sectionType: "hero",
      content: {
        eyebrow: "Product guide",
        headline: "Thông tin đầy đủ trước khi chọn mua",
        subheadline: "Dành cho khách đến từ Google cần đọc, so sánh, hiểu rõ quy trình và biết sản phẩm có phù hợp không.",
      },
    },
    {
      sectionType: "features",
      content: {
        title: "Nội dung giúp khách tự ra quyết định",
        items: ["Thông tin rõ trước khi mua", "Phù hợp traffic Google", "Có FAQ để giảm phân vân", "Dễ mở rộng nội dung SEO"],
      },
    },
    {
      sectionType: "faq",
      content: {
        title: "FAQ",
        questions: ["Sản phẩm phù hợp với ai?", "Có tùy chỉnh được không?", "Quy trình đặt hàng thế nào?", "Bao lâu có thể nhận sản phẩm?"],
      },
    },
    {
      sectionType: "related_products",
      content: {
        title: "Sản phẩm liên quan",
        source: "same_category",
      },
    },
    {
      sectionType: "cta",
      content: {
        headline: "Cần tư vấn lựa chọn trước khi đặt?",
        buttonLabel: "Xem giá và đặt mua",
      },
    },
  ],
};

export function SeoLandingPage({ offering, landingPage, sections }: LandingPageTemplateProps) {
  const hero = getSectionContent(sections, "hero");
  const features = getSectionContent(sections, "features");
  const cta = getSectionContent(sections, "cta");
  const items = getContentStringArray(features, "items", ["Thông tin rõ trước khi mua", "Phù hợp traffic Google", "Có FAQ để giảm phân vân", "Dễ mở rộng nội dung SEO"]);

  return (
    <LandingPageFrame offering={offering} landingPage={landingPage} className="bg-white text-slate-950">
    <main>
      <section className="border-b border-slate-200 px-5 pb-14 pt-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-700">{getContentString(hero, "eyebrow", "Product guide")}</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight md:text-6xl">{getContentString(hero, "headline", offering.name)}</h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">{getContentString(hero, "subheadline", offering.description || offering.excerpt || "")}</p>
            <div className="mt-7 flex flex-wrap items-center gap-5">
              <LandingPageCta offering={offering} label={getContentString(cta, "buttonLabel", "Xem giá và đặt mua")} className="bg-blue-700 text-white hover:bg-blue-800" />
              <PriceLine offering={offering} className="text-blue-700" />
            </div>
          </div>
          <ProductImage offering={offering} className="aspect-[4/3] rounded-sm" />
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-14 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Nội dung</p>
          <h2 className="mt-3 text-3xl font-bold">Tại sao nên chọn?</h2>
        </aside>
        <div className="grid gap-5 md:grid-cols-2">
          {items.map((item) => (
            <article key={item} className="rounded-sm border border-slate-200 p-6">
              <h3 className="text-xl font-semibold">{item}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">Khối nội dung được thiết kế để khách đọc, so sánh và ra quyết định mà không phá flow ecommerce hiện tại.</p>
            </article>
          ))}
        </div>
      </section>
    </main>
    </LandingPageFrame>
  );
}
