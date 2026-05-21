import Link from "next/link";
import { Fragment } from "react";
import { Check, X } from "lucide-react";
import type { ManagedPage } from "@/lib/managed-pages";
import { getPageFields } from "@/lib/page-fields";
import { createRichTextMarkup, RICH_TEXT_CONTENT_CLASSNAME } from "@/lib/rich-text";
import { ROUTES } from "@/lib/routes";
import { ServicesFaqAccordion } from "./services-faq-accordion";

type ServiceFaqItem = {
  question?: string;
  answer?: string;
};

type ServiceComparisonLimitRow = {
  label?: string;
  plan1?: string;
  plan2?: string;
  plan3?: string;
};

type ServiceComparisonFeatureRow = {
  label?: string;
  plan1?: boolean;
  plan2?: boolean;
  plan3?: boolean;
};

type PricingPlanItem = {
  name?: string;
  price?: string;
  badge?: string;
  summary?: string;
};

type ComparisonDisplayRow =
  | {
      label: string;
      values: string[];
    }
  | {
      label: string;
      included: boolean[];
    };

const fallbackFaqs: ServiceFaqItem[] = [
  {
    question: "Tôi có thể tự chỉnh nội dung sau khi setup không?",
    answer: "Có. Các gói được thiết kế để bạn có thể tự cập nhật thông tin cơ bản sau khi thiệp đã được tạo.",
  },
  {
    question: "Có hỗ trợ chọn mẫu phù hợp với phong cách cưới không?",
    answer: "Có. PinkLove có thể tư vấn mẫu theo tone màu, concept sự kiện và lượng nội dung bạn muốn hiển thị.",
  },
  {
    question: "Nếu cần chỉnh giao diện riêng thì chọn gói nào?",
    answer: "Bạn nên chọn gói Premium hoặc liên hệ để được báo phạm vi tùy chỉnh cụ thể trước khi triển khai.",
  },
];

export async function ServicesContent({ page }: { page: ManagedPage }) {
  const fields = getPageFields<{
    heroTitle?: string;
    heroDescription?: string;
    plansTitle?: string;
    plansDescription?: string;
    highlightEyebrow?: string;
    highlightTitle?: string;
    highlightBadgeLabel?: string;
    highlightDescription?: string;
    highlightOffer?: string;
    plansEyebrow?: string;
    comparisonEyebrow?: string;
    comparisonFirstColumnTitle?: string;
    planFeaturesTitle?: string;
    comparisonLimitTitle?: string;
    pricingPlans?: PricingPlanItem[];
    comparisonLimitRows?: ServiceComparisonLimitRow[];
    comparisonFeatureRows?: ServiceComparisonFeatureRow[];
    faqItems?: ServiceFaqItem[];
    ctaTitle?: string;
    ctaDescription?: string;
    ctaButtonText?: string;
    ctaButtonLink?: string;
  }>(page);

  const plans = (Array.isArray(fields.pricingPlans) ? fields.pricingPlans : [])
    .filter((item) => item.name?.trim() && item.price?.trim())
    .slice(0, 3)
    .map((item) => ({
      name: item.name?.trim() || "",
      price: item.price?.trim() || "",
      summary: item.summary?.trim() || "",
      badge: item.badge?.trim() || "",
    }));

  const faqs = (Array.isArray(fields.faqItems) && fields.faqItems.length ? fields.faqItems : fallbackFaqs).filter(
    (item) => item.question?.trim() && item.answer?.trim()
  );
  const comparisonLimitRows = (Array.isArray(fields.comparisonLimitRows) ? fields.comparisonLimitRows : [])
    .filter((item) => item.label?.trim())
    .map((item) => ({
      label: item.label?.trim() || "",
      values: [item.plan1?.trim() || "", item.plan2?.trim() || "", item.plan3?.trim() || ""],
    }));
  const comparisonFeatureRows = (Array.isArray(fields.comparisonFeatureRows) ? fields.comparisonFeatureRows : [])
    .filter((item) => item.label?.trim())
    .map((item) => ({
      label: item.label?.trim() || "",
      included: [Boolean(item.plan1), Boolean(item.plan2), Boolean(item.plan3)],
    }));

  const heroTitle = fields.heroTitle?.trim() || page.title || "Dịch vụ thiệp cưới online";
  const heroDescription =
    fields.heroDescription?.trim() ||
    page.excerpt ||
    "Chọn gói phù hợp với mức độ tùy chỉnh và hỗ trợ mà bạn cần để có một thiệp cưới online chỉn chu, đẹp mắt và dễ gửi đến khách mời.";
  const plansTitle = fields.plansTitle?.trim() || "Chọn gói phù hợp với mức độ hỗ trợ";
  const plansDescription =
    fields.plansDescription?.trim() ||
    "Bạn có thể bắt đầu từ gói cơ bản và nâng cấp khi cần tùy chỉnh sâu hơn.";
  const highlightEyebrow = fields.highlightEyebrow?.trim() || "Khuyến mãi đặc biệt";
  const highlightTitle = fields.highlightTitle?.trim() || "Ưu đãi chung cho mọi gói dịch vụ";
  const highlightBadgeLabel = fields.highlightBadgeLabel?.trim() || "Ưu đãi";
  const highlightDescription =
    fields.highlightDescription?.trim() ||
    "Áp dụng chương trình khuyến mãi theo từng thời điểm cho khách hàng tạo thiệp online tại PinkLove.";
  const highlightOffer = fields.highlightOffer?.trim() || "Liên hệ để nhận ưu đãi";
  const plansEyebrow = fields.plansEyebrow?.trim() || "Bảng gói";
  const comparisonEyebrow = fields.comparisonEyebrow?.trim() || "So sánh chi tiết";
  const comparisonFirstColumnTitle = fields.comparisonFirstColumnTitle?.trim() || "Hạng mục";
  const planFeaturesTitle = fields.planFeaturesTitle?.trim() || "Tính năng chính";
  const comparisonLimitTitle = fields.comparisonLimitTitle?.trim() || "Giới hạn gói";
  const comparisonSections: Array<{ title: string; rows: ComparisonDisplayRow[] }> = [
    { title: comparisonLimitTitle, rows: comparisonLimitRows },
    { title: planFeaturesTitle, rows: comparisonFeatureRows },
  ].filter((section) => section.rows.length > 0);
  const paidBenefits = [
    {
      title: "Thiết kế chỉn chu hơn",
      description: "Có thêm phạm vi hỗ trợ để thiệp lên đúng phong cách, nội dung rõ ràng và dễ gửi khách mời.",
    },
    {
      title: "Trải nghiệm đầy đủ hơn",
      description: "Mở rộng phần nội dung, hiệu ứng, hình ảnh và các điểm chạm quan trọng trong thiệp online.",
    },
    {
      title: "Hỗ trợ triển khai nhanh",
      description: "Tiết kiệm thời gian setup, kiểm tra hiển thị và hoàn thiện trước khi publish.",
    },
  ];

  return (
    <main className="guest-soft-top-bg contact-wave-bg relative isolate min-h-screen overflow-hidden pt-[74px]">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <span className="contact-cloud-decor service-cloud-decor-one" />
        <span className="contact-cloud-decor service-cloud-decor-two" />
        <span className="contact-cloud-decor service-cloud-decor-three opacity-20" />
        <span className="contact-cloud-decor service-cloud-decor-four opacity-15" />
        <span className="contact-cloud-decor service-cloud-decor-five opacity-10" />
        <span className="contact-cloud-decor service-cloud-decor-six opacity-10" />
        <span className="contact-cloud-decor service-cloud-decor-seven opacity-15" />
        <span className="contact-cloud-decor service-cloud-decor-eight opacity-10" />
        <span className="contact-cloud-decor service-cloud-decor-nine opacity-10" />
        <span className="contact-cloud-decor service-cloud-decor-ten opacity-10" />
        <div className="absolute left-[12%] top-[2%] size-24 rounded-full bg-[#ffb8fb]/10 blur-3xl" />
        <div className="absolute right-[18%] top-[4%] size-28 rounded-full bg-[#ff6ff5]/7 blur-3xl" />
        <div className="absolute left-[12%] top-[28%] size-22 rounded-full bg-[#ffb8fb]/4 blur-3xl" />
        <div className="absolute right-[15%] top-[76%] size-24 rounded-full bg-[#ff6ff5]/3 blur-3xl" />
        <div className="absolute left-[34%] top-[16%] size-20 rounded-full bg-white/45 blur-3xl" />
        <div className="absolute right-[30%] top-[31%] size-22 rounded-full bg-[#ffb8fb]/3 blur-3xl" />
        <div className="absolute bottom-[9%] left-[42%] size-20 rounded-full bg-white/45 blur-3xl" />
        <span className="cta-sparkle-float absolute left-[14%] top-[3%] bg-[linear-gradient(180deg,#ffffff_0%,#ffb8fb_42%,#ff6ff5_100%)] bg-clip-text text-3xl text-transparent drop-shadow-[0_6px_16px_rgba(255,111,245,0.16)]">✦</span>
        <span className="cta-sparkle-float absolute left-[36%] top-[5%] bg-[linear-gradient(180deg,#ffffff_0%,#ffd8fc_48%,#ff95f8_100%)] bg-clip-text text-2xl text-transparent opacity-70 drop-shadow-[0_6px_14px_rgba(255,184,251,0.12)]">✦</span>
        <span className="cta-heart-pop absolute left-[20%] top-[14%] bg-[linear-gradient(180deg,#ffd8fc_0%,#ff8be8_45%,#d94dce_100%)] bg-clip-text text-2xl text-transparent opacity-65 drop-shadow-[0_8px_18px_rgba(217,77,206,0.14)]">♥</span>
        <span className="cta-sparkle-float absolute right-[28%] top-[8%] bg-[linear-gradient(180deg,#ffffff_0%,#ffb8fb_42%,#ff6ff5_100%)] bg-clip-text text-3xl text-transparent opacity-75 drop-shadow-[0_6px_16px_rgba(255,111,245,0.14)]">✦</span>
        <span className="cta-heart-pop absolute right-[18%] top-[22%] bg-[linear-gradient(180deg,#ffd8fc_0%,#ff8be8_45%,#d94dce_100%)] bg-clip-text text-2xl text-transparent opacity-25 drop-shadow-[0_8px_18px_rgba(217,77,206,0.08)]">♥</span>
        <span className="cta-sparkle-float absolute right-[10%] top-[34%] bg-[linear-gradient(180deg,#ffffff_0%,#ffb8fb_42%,#ff6ff5_100%)] bg-clip-text text-3xl text-transparent opacity-20 drop-shadow-[0_8px_20px_rgba(255,111,245,0.08)]">✦</span>
        <span className="cta-sparkle-float absolute left-[24%] top-[43%] bg-[linear-gradient(180deg,#ffffff_0%,#ffd8fc_48%,#ff95f8_100%)] bg-clip-text text-2xl text-transparent opacity-15 drop-shadow-[0_6px_14px_rgba(255,184,251,0.08)]">✦</span>
        <span className="cta-heart-pop absolute right-[28%] top-[78%] bg-[linear-gradient(180deg,#ffd8fc_0%,#ff8be8_45%,#d94dce_100%)] bg-clip-text text-2xl text-transparent opacity-15 drop-shadow-[0_8px_18px_rgba(217,77,206,0.08)]">♥</span>
        <span className="cta-sparkle-float absolute left-[45%] bottom-[8%] bg-[linear-gradient(180deg,#ffffff_0%,#ffb8fb_42%,#ff6ff5_100%)] bg-clip-text text-3xl text-transparent opacity-15 drop-shadow-[0_8px_20px_rgba(255,111,245,0.06)]">✦</span>
      </div>

      <section className="relative z-10 isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 hidden lg:block">
          <div className="absolute left-[8%] top-[20%] size-24 rounded-full bg-guest-primary/15 blur-3xl" />
          <div className="absolute right-[12%] top-[28%] size-32 rounded-full bg-[#ffb8fb]/30 blur-3xl" />
          <div className="absolute bottom-[16%] left-[38%] size-24 rounded-full bg-white/35 blur-3xl" />
          <span className="cta-sparkle-float absolute left-[8%] top-[18%] text-4xl text-[#ff6ff5]/75 drop-shadow-[0_6px_16px_rgba(255,111,245,0.2)]">✦</span>
          <span className="cta-heart-pop absolute left-[13%] bottom-[26%] text-3xl text-[#d94dce]/70 drop-shadow-[0_8px_18px_rgba(217,77,206,0.24)]">♥</span>
          <span className="cta-sparkle-float absolute right-[8%] top-[46%] text-4xl text-[#ff6ff5]/70 drop-shadow-[0_8px_20px_rgba(255,111,245,0.35)]">✦</span>
        </div>

        <div className="container relative z-10 mx-auto px-4 pb-10 pt-16 lg:pb-12 lg:pt-24">
          <div className="mx-auto max-w-4xl space-y-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-500">
              <span>Trang chủ</span>
              <span className="mx-2">/</span>
              <span>Bảng giá</span>
            </p>
            <h1 className="text-3xl font-semibold leading-tight text-stone-950 sm:text-4xl lg:text-6xl">
              {heroTitle}
            </h1>
            <p className="mx-auto max-w-3xl text-sm font-medium leading-8 text-stone-700 md:text-base lg:text-lg">{heroDescription}</p>
          </div>
        </div>
      </section>

      <section id="service-plans" className="relative z-10 px-4 pb-14 pt-6 lg:pb-20 lg:pt-8">
        <div className="container mx-auto">
          <div className="mx-auto mb-8 grid max-w-5xl gap-4 rounded-2xl border border-[#ffd8fc]/80 bg-white p-5 text-center md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:text-left">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d94dce]">{highlightEyebrow}</p>
                <h2 className="mt-2 text-xl font-semibold text-stone-950">{highlightTitle}</h2>
                <p className="mt-3 text-sm leading-7 text-stone-600 md:text-base">{highlightDescription}</p>
              </div>
              <div className="mx-auto flex size-24 flex-col items-center justify-center rounded-full bg-[linear-gradient(135deg,#FF95F8_0%,#FF6FF5_100%)] text-white">
                <span className="text-xs font-semibold uppercase tracking-[0.18em]">{highlightBadgeLabel}</span>
                <span className="mt-1 max-w-20 text-center text-base font-semibold leading-tight">{highlightOffer}</span>
              </div>
            </div>

          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d94dce]">{plansEyebrow}</p>
            <h2 className="mt-3 text-2xl font-semibold text-stone-950 sm:text-3xl lg:text-5xl">
              {plansTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-stone-600 md:text-base">
              {plansDescription}
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3 lg:items-start">
            {plans.map((plan, planIndex) => {
              const planBorderClass =
                planIndex === 0
                  ? "border-[#ffd8fc]/80 hover:border-[#ffb8fb]"
                  : planIndex === 1
                    ? "border-[#ffb8fb]/90 hover:border-[#FF95F8]"
                    : "border-[#FF95F8]/90 hover:border-[#FF6FF5]";

              return (
                <article key={plan.name} className={`relative flex h-full flex-col rounded-2xl border bg-white p-6 transition duration-300 hover:-translate-y-1 ${planBorderClass}`}>
                  {plan.badge ? (
                    <span className="absolute right-5 top-5 rounded-full bg-[#FF6FF5] px-3 py-1 text-xs font-semibold uppercase text-white">
                      {plan.badge}
                    </span>
                  ) : null}
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-stone-400">{plan.name}</p>
                  <p className="mt-4 text-4xl font-semibold text-stone-950">{plan.price}</p>
                  {plan.summary ? <p className="mt-3 text-sm leading-7 text-stone-600 md:text-base">{plan.summary}</p> : null}
                  <Link href={fields.ctaButtonLink?.trim() || ROUTES.CONTACT} className={`mt-6 inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-semibold uppercase transition hover:-translate-y-0.5 ${plan.badge ? "bg-[linear-gradient(90deg,#FF95F8_0%,#FF6FF5_50%,#FF95F8_100%)] text-white" : "bg-stone-950 text-white hover:bg-[#d94dce]"}`}>
                    {plan.price === "0đ" ? "Tạo tài khoản miễn phí" : `Nâng cấp ${plan.name} ngay`}
                  </Link>

                  {comparisonLimitRows.length ? (
                    <>
                      <div className="mt-7 border-t border-[#ffd8fc]/70 pt-6">
                        <h3 className="text-sm font-semibold text-stone-950">{comparisonLimitTitle}</h3>
                      </div>
                      <ul className="mt-4 space-y-3 text-sm text-stone-700">
                        {comparisonLimitRows.map((row) => (
                          <li key={row.label} className="flex items-start justify-between gap-4">
                            <span className="text-stone-500">{row.label}</span>
                            <span className="text-right font-semibold text-stone-800">{row.values[planIndex] || "-"}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}

                  {comparisonFeatureRows.length ? (
                    <>
                      <div className="mt-7 border-t border-[#ffd8fc]/70 pt-6">
                        <h3 className="text-sm font-semibold text-stone-950">{planFeaturesTitle}</h3>
                      </div>
                      <ul className="mt-4 space-y-3 text-sm text-stone-700">
                        {comparisonFeatureRows.map((feature) => {
                          const isIncluded = feature.included[planIndex] ?? false;

                          return (
                            <li key={feature.label} className="flex items-start gap-3">
                              <span className={`mt-1.5 flex size-5 shrink-0 items-center justify-center rounded-full ${isIncluded ? "bg-[#fff5fd] text-[#d94dce]" : "bg-stone-100 text-stone-300"}`}>
                                {isIncluded ? <Check className="size-3.5 stroke-[3]" aria-hidden="true" /> : <X className="size-3.5 stroke-[3]" aria-hidden="true" />}
                              </span>
                              <span className={isIncluded ? "" : "text-stone-400"}>{feature.label}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {page.body ? (
        <section className="relative z-10 px-4 py-14 lg:py-20">
          <div className="container mx-auto max-w-4xl">
            <div className={`${RICH_TEXT_CONTENT_CLASSNAME} text-stone-700`} dangerouslySetInnerHTML={createRichTextMarkup(page.body)} />
          </div>
        </section>
      ) : null}

      {comparisonSections.length > 0 ? (
        <section className="relative z-10 px-4 py-14 lg:py-20">
          <div className="container mx-auto">
            <div className="mb-10 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d94dce]">{comparisonEyebrow}</p>
              <h2 className="mt-3 text-2xl font-semibold text-stone-950 sm:text-3xl lg:text-5xl">
                {plansTitle}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-stone-600 md:text-base">
                {plansDescription}
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#ffd8fc]/80 bg-white">
              <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#ffd8fc]/70 bg-[#fff7fd]/70">
                    <th className="w-[34%] px-5 py-5 font-semibold uppercase tracking-[0.18em] text-stone-400">{comparisonFirstColumnTitle}</th>
                    {plans.map((plan) => (
                      <th key={plan.name} className="px-5 py-5 text-center font-semibold text-stone-950">
                        <span className="block text-base">{plan.name}</span>
                        <span className="mt-1 block text-sm text-[#d94dce]">{plan.price}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonSections.map((section) => (
                    <Fragment key={section.title}>
                      <tr className="border-b border-[#ffd8fc]/70 bg-[#fffafe]">
                        <td colSpan={plans.length + 1} className="px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#d94dce]">
                          {section.title}
                        </td>
                      </tr>
                      {section.rows.map((row) => (
                        <tr key={`${section.title}-${row.label}`} className="border-b border-[#fff0fb] last:border-b-0">
                          <td className="px-5 py-4 font-medium text-stone-700">{row.label}</td>
                          {plans.map((plan, index) => (
                            <td key={`${plan.name}-${section.title}-${row.label}`} className="px-5 py-4 text-center">
                              {"values" in row ? (
                                <span className="font-semibold text-stone-800">
                                  {row.values[index] ?? row.values[row.values.length - 1]}
                                </span>
                              ) : row.included[index] ?? row.included[row.included.length - 1] ? (
                                <span className="mx-auto inline-flex size-8 items-center justify-center rounded-full bg-[#fff5fd] text-[#d94dce]">
                                  <Check className="size-4 stroke-[3]" aria-hidden="true" />
                                </span>
                              ) : (
                                <span className="mx-auto inline-flex size-8 items-center justify-center rounded-full bg-stone-100 text-stone-300">
                                  <X className="size-4 stroke-[3]" aria-hidden="true" />
                                </span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}

      <section className="relative z-10 px-4 py-14 lg:py-20">
        <div className="container mx-auto">
          <div className="mb-8 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d94dce]">FAQ về gói dịch vụ</p>
            <h2 className="mt-3 text-2xl font-semibold text-stone-950 sm:text-3xl lg:text-4xl">Câu hỏi thường gặp</h2>
            <p className="mt-4 text-sm leading-8 text-stone-600 md:text-base">
              Giải đáp nhanh những thắc mắc phổ biến trước khi bạn chọn gói phù hợp.
            </p>
          </div>

          <ServicesFaqAccordion items={faqs} />
        </div>
      </section>

      <section className="relative z-10 px-4 py-14 lg:py-20">
        <div className="container mx-auto">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-2xl font-semibold text-stone-950 sm:text-3xl lg:text-4xl">Vì sao nên sử dụng gói trả phí?</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {paidBenefits.map((item) => (
              <article key={item.title} className="rounded-2xl border border-[#ffd8fc]/80 bg-white p-6">
                <h3 className="text-lg font-semibold text-stone-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-8 text-stone-600 md:text-base">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 pb-14 lg:pb-20">
        <div className="container mx-auto">
          <div className="overflow-hidden rounded-2xl border border-[#ffd8fc]/80 bg-white px-6 py-10 text-center text-stone-950 lg:px-10 lg:py-14">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d94dce]">Bắt đầu triển khai</p>
            <h2 className="mx-auto mt-4 max-w-3xl text-2xl font-semibold leading-tight sm:text-3xl lg:text-5xl">
              {fields.ctaTitle?.trim() || "Sẵn sàng tạo thiệp online ấn tượng?"}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-stone-600 md:text-base">
              {fields.ctaDescription?.trim() || "Bắt đầu chọn mẫu, tạo thiệp cưới online và nâng cấp gói phù hợp khi bạn cần trải nghiệm chỉn chu hơn."}
            </p>
            <Link href={fields.ctaButtonLink?.trim() || ROUTES.TEMPLATES} className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-[linear-gradient(90deg,#FF95F8_0%,#FF6FF5_50%,#FF95F8_100%)] px-6 text-sm font-semibold uppercase text-white transition hover:-translate-y-0.5">
              {fields.ctaButtonText?.trim() || "Khám phá mẫu thiệp ngay"}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
