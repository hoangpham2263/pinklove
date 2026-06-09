import type { LandingPageTemplate } from "@/features/landing-pages/types";
import { getContentString, getContentStringArray, getSectionContent, PriceLine, ProductImage, LandingPageCta, LandingPageFrame, type LandingPageTemplateProps } from "./shared";

export const codLandingTemplate: LandingPageTemplate = {
  id: "cod",
  name: "COD Trust Landing",
  slug: "cod",
  description: "Landing page tối ưu đơn COD, nhấn cam kết, phí ship và sự tin cậy.",
  pageType: "campaign",
  themeConfig: {
    templateId: "cod",
    palette: "trust-light",
    typography: "clean-sans",
    accentColor: "#166534",
  },
  sections: [
    {
      sectionType: "hero",
      content: {
        eyebrow: "COD verified",
        headline: "Nhận hàng rồi thanh toán",
        subheadline: "Giảm rào cản mua hàng cho khách mới: thông tin rõ, phí rõ, có tư vấn trước khi chốt đơn.",
      },
    },
    {
      sectionType: "features",
      content: {
        title: "Cam kết mua hàng an tâm",
        items: ["Kiểm tra trước khi nhận", "Tư vấn trước khi chốt đơn", "Phí rõ ràng"],
      },
    },
    {
      sectionType: "faq",
      content: {
        title: "Câu hỏi trước khi đặt COD",
        questions: ["Bao lâu nhận hàng?", "Có được kiểm tra trước không?", "Phí ship thế nào?", "Đổi thông tin giao hàng ra sao?"],
      },
    },
    {
      sectionType: "reviews",
      content: {
        title: "Đơn hàng thật",
        style: "compact",
        quotes: ["Shop tư vấn nhanh, phí rõ.", "Nhận hàng đúng mẫu rồi mới thanh toán."],
      },
    },
    {
      sectionType: "cta",
      content: {
        headline: "Để lại thông tin, đội ngũ sẽ xác nhận trước khi giao",
        buttonLabel: "Đặt hàng COD",
      },
    },
  ],
};

export function CodLandingPage({ offering, landingPage, sections }: LandingPageTemplateProps) {
  const hero = getSectionContent(sections, "hero");
  const features = getSectionContent(sections, "features");
  const cta = getSectionContent(sections, "cta");
  const items = getContentStringArray(features, "items", ["Tư vấn trước", "Phí rõ ràng", "Giao tận nơi"]);

  return (
    <LandingPageFrame offering={offering} landingPage={landingPage} className="bg-emerald-50 text-stone-950">
    <main>
      <section className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-5 pb-16 pt-28 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-700">{getContentString(hero, "eyebrow", "COD verified")}</p>
          <h1 className="mt-5 text-4xl font-bold leading-tight md:text-6xl">{getContentString(hero, "headline", "Nhận hàng rồi thanh toán")}</h1>
          <p className="mt-5 text-lg leading-8 text-stone-700">{getContentString(hero, "subheadline", offering.description || offering.excerpt || "")}</p>
          <div className="mt-7 rounded-sm border border-emerald-200 bg-white p-5">
            <p className="text-sm text-stone-500">Giá rõ ràng</p>
            <PriceLine offering={offering} className="mt-1 text-emerald-700" />
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <LandingPageCta offering={offering} label={getContentString(cta, "buttonLabel", "Đặt hàng COD")} className="bg-emerald-700 text-white hover:bg-emerald-800" />
            <span className="inline-flex h-12 items-center border border-emerald-300 bg-white px-5 text-sm font-semibold text-emerald-800">Có thể kiểm tra trước</span>
          </div>
        </div>
        <div className="overflow-hidden rounded-sm border border-emerald-200 bg-white p-4 shadow-xl">
          <ProductImage offering={offering} className="aspect-square rounded-sm" />
          <div className="grid gap-3 pt-4 sm:grid-cols-3">
            {items.map((item) => (
              <div key={item} className="rounded-sm bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">{item}</div>
            ))}
          </div>
        </div>
      </section>
    </main>
    </LandingPageFrame>
  );
}
