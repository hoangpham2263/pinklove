import type { LandingPageTemplate } from "@/features/landing-pages/types";
import { getContentString, getContentStringArray, getSectionContent, PriceLine, ProductImage, LandingPageCta, LandingPageFrame, type LandingPageTemplateProps } from "./shared";

export const fashionLandingTemplate: LandingPageTemplate = {
  id: "fashion",
  name: "Fashion Editorial",
  slug: "fashion",
  description: "Landing page visual, tập trung lifestyle, chất liệu và cảm giác thương hiệu.",
  pageType: "landing",
  themeConfig: {
    templateId: "fashion",
    palette: "editorial-light",
    typography: "fashion-serif",
    accentColor: "#B35C7A",
  },
  sections: [
    {
      sectionType: "hero",
      content: {
        eyebrow: "PinkLove Editorial",
        headline: "Một thiết kế khiến khách mời nhớ đến ngày cưới của bạn",
        subheadline: "Landing page tập trung cảm xúc thị giác, phù hợp cho sản phẩm cần hình ảnh đẹp, chất liệu rõ và cảm giác cao cấp ngay từ màn đầu tiên.",
        primaryCta: "Chọn mẫu này",
      },
    },
    {
      sectionType: "gallery",
      content: {
        title: "Soft finish, clean detail",
        layout: "editorial_grid",
        imageRatio: "4:5",
        captions: ["Ảnh hero chính", "Chi tiết giấy/in", "Mood phối màu"],
      },
    },
    {
      sectionType: "features",
      content: {
        title: "Điểm làm nên cảm giác premium",
        items: ["Lookbook visual rõ phong cách", "Chi tiết tinh gọn dễ ra quyết định", "Dễ dùng cho concept cưới hiện đại"],
      },
    },
    {
      sectionType: "reviews",
      content: {
        title: "Khách hàng yêu phần nhìn đầu tiên",
        style: "quote_cards",
        quotes: ["Ảnh lên rất sang và dễ chọn tone.", "Nhìn landing là hiểu ngay concept sản phẩm."],
      },
    },
    {
      sectionType: "cta",
      content: {
        headline: "Sẵn sàng chọn thiết kế cho ngày đặc biệt?",
        buttonLabel: "Chọn mẫu này",
      },
    },
  ],
};

export function FashionLandingPage({ offering, landingPage, sections }: LandingPageTemplateProps) {
  const hero = getSectionContent(sections, "hero");
  const gallery = getSectionContent(sections, "gallery");
  const features = getSectionContent(sections, "features");
  const cta = getSectionContent(sections, "cta");
  const featureItems = getContentStringArray(features, "items", ["Lookbook visual", "Chi tiết tinh gọn", "Dễ dùng cho concept cưới"]);

  return (
    <LandingPageFrame offering={offering} landingPage={landingPage} className="bg-[#fbf7f8] text-stone-950">
    <main>
      <section className="grid min-h-screen items-center gap-10 px-5 pb-16 pt-28 md:px-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="mx-auto max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#B35C7A]">{getContentString(hero, "eyebrow", "PinkLove Editorial")}</p>
          <h1 className="mt-5 text-5xl font-semibold leading-none md:text-7xl">{getContentString(hero, "headline", offering.name)}</h1>
          <p className="mt-6 text-lg leading-8 text-stone-600">{getContentString(hero, "subheadline", offering.description || offering.excerpt || "")}</p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <LandingPageCta offering={offering} label={getContentString(cta, "buttonLabel", "Chọn mẫu này")} className="bg-[#B35C7A] text-white hover:bg-[#984864]" />
            <PriceLine offering={offering} className="text-[#B35C7A]" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_0.7fr]">
          <div className="overflow-hidden rounded-sm shadow-2xl">
            <ProductImage offering={offering} />
          </div>
          <div className="hidden flex-col justify-end gap-4 md:flex">
            <div className="border border-[#ead4dc] bg-white p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-stone-400">Material</p>
              <p className="mt-3 text-2xl font-semibold">{getContentString(gallery, "title", "Soft finish, clean detail")}</p>
            </div>
            <div className="border border-[#ead4dc] bg-white p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-stone-400">Mood</p>
              <p className="mt-3 text-2xl font-semibold">Romantic, modern, refined</p>
            </div>
          </div>
        </div>
      </section>
      <section className="grid gap-6 bg-white px-5 py-16 md:grid-cols-3 md:px-10">
        {featureItems.map((item) => (
          <div key={item} className="border-t border-stone-200 pt-6">
            <p className="text-2xl font-semibold">{item}</p>
            <p className="mt-3 text-sm leading-7 text-stone-600">Thiết kế nhấn vào cảm giác khi khách nhìn sản phẩm, phù hợp traffic cần cảm hứng trước khi mua.</p>
          </div>
        ))}
      </section>
    </main>
    </LandingPageFrame>
  );
}
