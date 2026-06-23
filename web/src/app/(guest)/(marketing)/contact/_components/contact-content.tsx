import Image from "next/image";
import Link from "next/link";
import { GuestMarketingHeroDecor, GuestMarketingPageShell } from "@/app/(guest)/_components/guest-marketing-background";
import { ManagedPageBreadcrumb } from "@/components/common/managed-page-breadcrumb";
import type { ManagedPage } from "@/lib/managed-pages";
import { getPageFields } from "@/lib/page-fields";
import { resolveMediaUrl } from "@/lib/media-resolver";

type ContactSocialLink = {
  label?: string;
  url?: string;
  description?: string;
  image?: string;
};

type ContactFaqItem = {
  question?: string;
  answer?: string;
};

export async function ContactContent({ page }: { page: ManagedPage }) {
  const fields = getPageFields<{
    heroTitleText?: string;
    heroTitleKeyword?: string;
    heroTitleKeywordHighlight?: boolean;
    supportDescription?: string;
    responseTime?: string;
    officeHours?: string;
    contactPhone?: string;
    socialLinks?: ContactSocialLink[];
    faqItems?: ContactFaqItem[];
  }>(page);

  const socialLinks = (
    await Promise.all(
      (Array.isArray(fields.socialLinks) ? fields.socialLinks : []).map(async (item) => ({
        label: item.label?.trim() || "",
        href: item.url?.trim() || "",
        description: item.description?.trim() || "",
        image: await resolveMediaUrl(item.image),
      }))
    )
  ).filter((item) => item.label && item.href);

  const faqItems = (Array.isArray(fields.faqItems) ? fields.faqItems : []).filter(
    (item) => item.question?.trim() && item.answer?.trim()
  );

  const introTitle = page.title;
  const heroTitleText = fields.heroTitleText?.trim() || "";
  const heroTitleKeyword = fields.heroTitleKeyword?.trim() || "";
  const introDescription = fields.supportDescription?.trim() || page.excerpt || "";
  const responseChips = [
    { label: "Phản hồi", value: fields.responseTime?.trim() || "Trong vòng 2 giờ làm việc" },
    { label: "Hỗ trợ", value: fields.officeHours?.trim() || "08:30 - 18:00, Thứ 2 - Thứ 7" },
    { label: "Hotline", value: fields.contactPhone?.trim() || "0909 000 999" },
  ];

  return (
    <GuestMarketingPageShell ambientGlowDensity="compact">
      <section className="relative z-10 overflow-hidden">
        <GuestMarketingHeroDecor />
        <div className="container px-4 mx-auto relative z-10 pt-10 lg:pt-15 2xl:pt-20">
          <ManagedPageBreadcrumb
            page={page}
            listClassName="justify-center text-xs font-semibold uppercase tracking-[0.35em] text-stone-700"
            linkClassName="transition-colors hover:text-primary"
            currentClassName="text-stone-900"
            separatorClassName="text-stone-500"
          />

          <h1 className="text-center mt-5 text-3xl font-semibold leading-tight sm:text-4xl lg:text-6xl">
            {heroTitleText || heroTitleKeyword ? (
              <>
                {heroTitleText ? <span className="inline">{heroTitleText}</span> : null}
                {heroTitleText && heroTitleKeyword ? " " : null}
                {heroTitleKeyword ? (
                  <span
                    className={`inline-block text-primary ${fields.heroTitleKeywordHighlight ? "hero-title-keyword-shimmer" : ""}`}
                    data-text={heroTitleKeyword}
                  >
                    {heroTitleKeyword}
                  </span>
                ) : null}
              </>
            ) : (
              introTitle
            )}
          </h1>

          {introDescription ? (
            <p className="text-center mt-5 text-sm md:text-base lg:text-lg">
              {introDescription}
            </p>
          ) : null}

          {responseChips.length > 0 ? (
            <div className="mx-auto mt-8 grid max-w-4xl gap-3 sm:grid-cols-3">
              {responseChips.map((item) => (
                <div key={`${item.label}-${item.value}`} className="rounded-full border border-[#ff6ff5]/16 bg-white/72 px-5 py-3 text-left">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/60">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold text-stone-900">{item.value}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {socialLinks.length > 0 ? (
        <section className="relative z-10 px-4 pt-10 lg:pt-12.5 2xl:pt-15">
          <div className="container mx-auto flex flex-wrap-reverse justify-center gap-4 lg:gap-7.5">
            {socialLinks.map((item) => {
              const content = (
                <div className="group w-full h-full flex flex-col items-center p-5 bg-white rounded-lg lg:rounded-2xl shadow-[0_18px_44px_rgba(35,31,39,0.1)] transition hover:-translate-y-1 hover:shadow-[0_24px_54px_rgba(58,81,114,0.16)]">
                  <span className="flex size-12.5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1877F2]/10 text-lg font-semibold text-white">
                    {item.image ? (
                      <Image src={item.image} alt={item.label} width={56} height={56} className="size-7.5 object-cover" />
                    ) : (
                      item.label.charAt(0).toUpperCase()
                    )}
                  </span>
                  <h3 className="text-center mt-2 text-lg font-semibold">{item.label}</h3>
                  {item.description ? (
                    <p className="text-center mt-2 text-sm leading-7 text-stone-600">{item.description}</p>
                  ) : null}
                </div>
              );

              return item.href.startsWith("/") && !item.href.startsWith("//") ? (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block w-[calc((100%-16px)/2)] lg:w-[calc((100%-90px)/4)]"
                >
                  {content}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                  className="block w-[calc((100%-16px)/2)] lg:w-[calc((100%-90px)/4)]"
                >
                  {content}
                </a>
              );
            })}
          </div>
        </section>
      ) : null}

      {faqItems.length > 0 ? (
        <section className="relative z-10 px-4 py-12 lg:py-16">
          <div className="container mx-auto">
            <div className="mb-8 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d94dce]">FAQ</p>
              <h2 className="mt-3 text-2xl font-semibold text-stone-950 sm:text-3xl lg:text-4xl">Câu hỏi thường gặp</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {faqItems.map((item, index) => (
                <article key={`${item.question}-${index}`} className="rounded-xl border border-stone-200 bg-white p-6 shadow-[0_18px_40px_rgba(35,31,39,0.06)] lg:rounded-2xl">
                  <h3 className="text-base font-semibold text-stone-950 lg:text-lg">{item.question}</h3>
                  <p className="mt-3 text-sm leading-8 text-stone-600 md:text-base">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </GuestMarketingPageShell>
  );
}
