import Image from "next/image";
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
    fields.responseTime ? { label: "Phản hồi", value: fields.responseTime } : null,
    fields.officeHours ? { label: "Hỗ trợ", value: fields.officeHours } : null,
    fields.contactPhone ? { label: "Hotline", value: fields.contactPhone } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <main
      className="contact-wave-bg relative isolate min-h-screen overflow-hidden pt-[74px]"
      style={{
        background:
          "radial-gradient(circle at 16% 7%, color-mix(in srgb, var(--color-guest-primary) 12%, transparent) 0%, transparent 30%), radial-gradient(circle at 84% 9%, color-mix(in srgb, var(--color-guest-primary) 9%, transparent) 0%, transparent 28%), linear-gradient(180deg, color-mix(in srgb, var(--color-guest-primary) 8%, white) 0%, color-mix(in srgb, var(--color-guest-primary) 3%, white) 22%, #fff 50%, #fff 100%)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <span className="contact-cloud-decor contact-cloud-decor-one" />
        <span className="contact-cloud-decor contact-cloud-decor-two" />
        <span className="contact-cloud-decor contact-cloud-decor-three" />
        <span className="contact-cloud-decor contact-cloud-decor-four" />
        <span className="contact-cloud-decor contact-cloud-decor-five" />
        <span className="contact-cloud-decor contact-cloud-decor-six" />
        <span className="contact-cloud-decor contact-cloud-decor-seven" />
        <span className="contact-cloud-decor contact-cloud-decor-eight" />
        <span className="contact-cloud-decor contact-cloud-decor-nine" />
        <span className="contact-cloud-decor contact-cloud-decor-ten" />
        <div className="absolute left-[12%] top-[8%] size-24 rounded-full bg-[#ffb8fb]/10 blur-3xl" />
        <div className="absolute right-[18%] top-[14%] size-28 rounded-full bg-[#ff6ff5]/7 blur-3xl" />
        <div className="absolute left-[16%] top-[48%] size-22 rounded-full bg-[#ffb8fb]/8 blur-3xl" />
        <div className="absolute right-[17%] top-[66%] size-24 rounded-full bg-[#ff6ff5]/7 blur-3xl" />
        <div className="absolute bottom-[10%] left-[42%] size-20 rounded-full bg-white/45 blur-3xl" />
        <span
          className="cta-sparkle-float absolute left-[14%] top-[13%] bg-[linear-gradient(180deg,#ffffff_0%,#ffb8fb_42%,#ff6ff5_100%)] bg-clip-text text-3xl text-transparent drop-shadow-[0_6px_16px_rgba(255,111,245,0.16)]"
          style={{ animationDelay: "-0.2s" }}
        >
          ✦
        </span>
        <span
          className="cta-sparkle-float absolute left-[36%] top-[8%] bg-[linear-gradient(180deg,#ffffff_0%,#ffd8fc_48%,#ff95f8_100%)] bg-clip-text text-2xl text-transparent drop-shadow-[0_6px_14px_rgba(255,184,251,0.14)]"
          style={{ animationDelay: "-1.1s" }}
        >
          ✦
        </span>
        <span
          className="cta-heart-pop absolute left-[20%] top-[30%] bg-[linear-gradient(180deg,#ffd8fc_0%,#ff8be8_45%,#d94dce_100%)] bg-clip-text text-2xl text-transparent drop-shadow-[0_8px_18px_rgba(217,77,206,0.18)]"
          style={{ animationDelay: "-0.7s" }}
        >
          ♥
        </span>
        <span
          className="cta-sparkle-float absolute right-[28%] top-[18%] bg-[linear-gradient(180deg,#ffffff_0%,#ffb8fb_42%,#ff6ff5_100%)] bg-clip-text text-3xl text-transparent drop-shadow-[0_6px_16px_rgba(255,111,245,0.16)]"
          style={{ animationDelay: "-1.7s" }}
        >
          ✦
        </span>
        <span
          className="cta-heart-pop absolute right-[18%] top-[37%] bg-[linear-gradient(180deg,#ffd8fc_0%,#ff8be8_45%,#d94dce_100%)] bg-clip-text text-2xl text-transparent drop-shadow-[0_8px_18px_rgba(217,77,206,0.16)]"
          style={{ animationDelay: "-1.4s" }}
        >
          ♥
        </span>
        <span
          className="cta-sparkle-float absolute right-[13%] top-[52%] bg-[linear-gradient(180deg,#ffffff_0%,#ffb8fb_42%,#ff6ff5_100%)] bg-clip-text text-3xl text-transparent drop-shadow-[0_8px_20px_rgba(255,111,245,0.18)]"
          style={{ animationDelay: "-0.9s" }}
        >
          ✦
        </span>
        <span
          className="cta-sparkle-float absolute left-[24%] top-[66%] bg-[linear-gradient(180deg,#ffffff_0%,#ffd8fc_48%,#ff95f8_100%)] bg-clip-text text-2xl text-transparent opacity-30 drop-shadow-[0_6px_14px_rgba(255,184,251,0.1)]"
          style={{ animationDelay: "-2.1s" }}
        >
          ✦
        </span>
        <span
          className="cta-heart-pop absolute right-[28%] top-[76%] bg-[linear-gradient(180deg,#ffd8fc_0%,#ff8be8_45%,#d94dce_100%)] bg-clip-text text-2xl text-transparent opacity-25 drop-shadow-[0_8px_18px_rgba(217,77,206,0.1)]"
          style={{ animationDelay: "-2.4s" }}
        >
          ♥
        </span>
        <span
          className="cta-sparkle-float absolute left-[45%] bottom-[9%] bg-[linear-gradient(180deg,#ffffff_0%,#ffb8fb_42%,#ff6ff5_100%)] bg-clip-text text-3xl text-transparent opacity-22 drop-shadow-[0_8px_20px_rgba(255,111,245,0.08)]"
          style={{ animationDelay: "-1.8s" }}
        >
          ✦
        </span>
      </div>
      <section className="relative z-10 min-h-[520px] overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <span className="contact-cloud-decor contact-banner-cloud-one" />
          <span className="contact-cloud-decor contact-banner-cloud-two" />
          <span className="contact-cloud-decor contact-banner-cloud-three" />
          <span
            className="cta-sparkle-float absolute left-[7%] top-[24%] bg-[linear-gradient(180deg,#ffffff_0%,#ffb8fb_42%,#ff6ff5_100%)] bg-clip-text text-3xl text-transparent opacity-80 drop-shadow-[0_6px_16px_rgba(255,111,245,0.16)]"
            style={{ animationDelay: "-0.45s" }}
          >
            ✦
          </span>
          <span
            className="cta-sparkle-float absolute right-[8%] top-[28%] bg-[linear-gradient(180deg,#ffffff_0%,#ffd8fc_48%,#ff95f8_100%)] bg-clip-text text-2xl text-transparent opacity-75 drop-shadow-[0_6px_14px_rgba(255,184,251,0.14)]"
            style={{ animationDelay: "-1.35s" }}
          >
            ✦
          </span>
          <span
            className="cta-sparkle-float absolute left-[27%] top-[18%] bg-[linear-gradient(180deg,#ffffff_0%,#ffb8fb_42%,#ff6ff5_100%)] bg-clip-text text-xl text-transparent opacity-65 drop-shadow-[0_6px_12px_rgba(255,111,245,0.12)]"
            style={{ animationDelay: "-2.15s" }}
          >
            ✦
          </span>
          <span
            className="cta-heart-pop absolute right-[30%] top-[20%] bg-[linear-gradient(180deg,#ffd8fc_0%,#ff8be8_45%,#d94dce_100%)] bg-clip-text text-2xl text-transparent opacity-65 drop-shadow-[0_8px_18px_rgba(217,77,206,0.14)]"
            style={{ animationDelay: "-1.75s" }}
          >
            ♥
          </span>
        </div>
        <div className="container relative z-10 mx-auto px-4 py-16 text-center lg:py-24">
          <ManagedPageBreadcrumb
            page={page}
            listClassName="justify-center text-xs font-semibold uppercase tracking-[0.35em] text-stone-700"
            linkClassName="transition-colors hover:text-primary"
            currentClassName="text-stone-900"
            separatorClassName="text-stone-500"
          />

          <h1 className="mx-auto mt-5 text-3xl font-semibold leading-tight sm:text-4xl lg:text-6xl">
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
            <p className="mx-auto mt-5 max-w-3xl text-sm font-medium leading-8 md:text-base lg:text-lg">
              {introDescription}
            </p>
          ) : null}

          {responseChips.length > 0 ? (
            <div className="mx-auto mt-8 grid max-w-4xl gap-3 sm:grid-cols-3">
              {responseChips.map((item) => (
                <div key={`${item.label}-${item.value}`} className="rounded-full border border-[#ff6ff5]/16 bg-white/72 px-5 py-3 text-left shadow-[0_18px_44px_rgba(255,111,245,0.08)] backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/60">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold text-stone-900">{item.value}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {socialLinks.length > 0 ? (
        <section className="container relative z-10 px-4 mx-auto pt-10 lg:pt-12.5 2xl:pt-15">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {socialLinks.map((item) => {
              const content = (
                <div className="group h-full flex flex-col p-5 bg-white rounded-lg lg:rounded-2xl shadow-[0_18px_44px_rgba(35,31,39,0.1)] transition hover:-translate-y-1 hover:shadow-[0_24px_54px_rgba(58,81,114,0.16)]">
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

              return (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                  className="block h-full"
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
    </main>
  );
}
