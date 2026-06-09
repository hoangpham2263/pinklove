import type { LandingPageTemplate } from "@/features/landing-pages/types";
import { getContentString, getContentStringArray, getSectionContent, PriceLine, ProductImage, LandingPageCta, LandingPageFrame, type LandingPageTemplateProps } from "./shared";

export const luxuryLandingTemplate: LandingPageTemplate = {
  id: "luxury",
  name: "Luxury Signature",
  slug: "luxury",
  description: "Landing page cao cấp, ít chữ, nhấn craftsmanship, exclusivity và brand trust.",
  pageType: "landing",
  themeConfig: {
    templateId: "luxury",
    palette: "luxury-neutral",
    typography: "premium-serif",
    accentColor: "#8A6A3F",
  },
  sections: [
    {
      sectionType: "hero",
      content: {
        eyebrow: "Signature edition",
        headline: "Một lựa chọn được hoàn thiện tỉ mỉ",
        subheadline: "Landing page cao cấp cho sản phẩm cần cảm giác riêng tư, ít nhiễu và tập trung vào craftsmanship.",
      },
    },
    {
      sectionType: "gallery",
      content: {
        title: "Tinh tế trong từng chi tiết",
        layout: "full_bleed",
        imageRatio: "3:4",
      },
    },
    {
      sectionType: "features",
      content: {
        title: "Premium experience",
        items: ["Private consultation", "Premium finishing", "Careful delivery"],
      },
    },
    {
      sectionType: "pricing",
      content: {
        layout: "premium_offer",
        showInstallments: false,
      },
    },
    {
      sectionType: "cta",
      content: {
        headline: "Trao đổi riêng với tư vấn viên",
        buttonLabel: "Đặt lịch tư vấn",
      },
    },
  ],
};

export function LuxuryLandingPage({ offering, landingPage, sections }: LandingPageTemplateProps) {
  const hero = getSectionContent(sections, "hero");
  const features = getSectionContent(sections, "features");
  const cta = getSectionContent(sections, "cta");
  const items = getContentStringArray(features, "items", ["Private consultation", "Premium finishing", "Careful delivery"]);

  return (
    <LandingPageFrame offering={offering} landingPage={landingPage} className="bg-[#f8f5ef] text-[#211b15]">
    <main>
      <section className="min-h-screen px-5 pb-16 pt-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1.05fr]">
          <div className="flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#8A6A3F]">{getContentString(hero, "eyebrow", "Signature edition")}</p>
            <h1 className="mt-6 text-5xl font-semibold leading-none md:text-7xl">{getContentString(hero, "headline", offering.name)}</h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-[#6f6253]">{getContentString(hero, "subheadline", offering.description || offering.excerpt || "")}</p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <LandingPageCta offering={offering} label={getContentString(cta, "buttonLabel", "Đặt lịch tư vấn")} className="bg-[#211b15] text-white hover:bg-[#3a3026]" />
              <PriceLine offering={offering} className="text-[#8A6A3F]" />
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-[0.7fr_1fr]">
            <div className="hidden self-end border border-[#ded3c1] p-6 md:block">
              <p className="text-sm uppercase tracking-[0.24em] text-[#8A6A3F]">Craft</p>
              <p className="mt-4 text-3xl font-semibold">Tinh tế trong từng chi tiết</p>
            </div>
            <div className="overflow-hidden border border-[#ded3c1] bg-white p-3 shadow-2xl">
              <ProductImage offering={offering} className="aspect-[3/4]" />
            </div>
          </div>
        </div>
      </section>
      <section className="border-y border-[#ded3c1] bg-[#211b15] px-5 py-12 text-white">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
          {items.map((item) => (
            <div key={item}>
              <p className="text-2xl font-semibold">{item}</p>
              <p className="mt-3 text-sm leading-7 text-white/70">Dành cho sản phẩm cần cảm giác cao cấp và quyết định mua có cân nhắc.</p>
            </div>
          ))}
        </div>
      </section>
    </main>
    </LandingPageFrame>
  );
}
