import Image from "next/image";
import {
  GuestPanel,
  GuestPanelBody,
  GuestPanelHeader,
  GuestPanelTitle,
} from "@/app/(guest)/_components/guest-ui";
import type { ManagedPage } from "@/lib/managed-pages";
import { getPageFields } from "@/lib/page-fields";
import { resolveMediaUrl } from "@/lib/media-resolver";
import { createRichTextMarkup, RICH_TEXT_CONTENT_CLASSNAME } from "@/lib/rich-text";

type ContactSocialLink = {
  label?: string;
  url?: string;
  description?: string;
  image?: string;
};

type ContactMethod = {
  label?: string;
  value?: string;
  description?: string;
  href?: string;
};

type ContactFaqItem = {
  question?: string;
  answer?: string;
};

export async function ContactContent({ page }: { page: ManagedPage }) {
  const fields = getPageFields<{
    heroBadge?: string;
    supportTitle?: string;
    supportDescription?: string;
    contactEmail?: string;
    contactPhone?: string;
    contactAddress?: string;
    googleMapsEmbed?: string;
    socialLinks?: ContactSocialLink[];
    contactMethods?: ContactMethod[];
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

  const contactMethods = (Array.isArray(fields.contactMethods) ? fields.contactMethods : []).filter(
    (item) => item.label?.trim() && item.value?.trim()
  );

  return (
    <section className="bg-[radial-gradient(circle_at_top,#f8ede2_0%,#fff8f2_24%,#fffdf9_56%,#ffffff_100%)] pt-10 lg:pt-14 2xl:pt-18">
      <div className="container mx-auto flex w-full flex-1 flex-col gap-10 px-4 pb-14">
        <div className="mx-auto max-w-4xl space-y-5 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-400">
            <span>Trang chủ</span>
            <span className="mx-2">/</span>
            <span>Liên hệ</span>
          </p>
          {fields.heroBadge ? (
            <p className="mx-auto inline-flex rounded-full border border-stone-200 bg-white/80 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.24em] text-stone-500 shadow-sm">
              {fields.heroBadge}
            </p>
          ) : null}
          <h1 className="text-3xl font-semibold text-stone-950 sm:text-4xl lg:text-5xl">{page.title}</h1>
          {page.excerpt ? <p className="text-sm leading-8 text-stone-600 md:text-base lg:text-lg">{page.excerpt}</p> : null}

          {contactMethods.length > 0 ? (
            <div className="grid gap-3 pt-3 sm:grid-cols-2 xl:grid-cols-4">
              {contactMethods.slice(0, 4).map((item) => (
                <div key={`${item.label}-${item.value}`} className="rounded-2xl border border-stone-200 bg-white/90 px-5 py-4 text-left shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
                  <p className="text-xs uppercase tracking-[0.24em] text-stone-400">{item.label}</p>
                  <p className="mt-2 text-base font-semibold text-stone-900">{item.value}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <GuestPanel className="border-stone-200 bg-white/90">
          <GuestPanelBody className="space-y-8 px-6 py-7 lg:px-8">
            {(fields.supportTitle || fields.supportDescription) ? (
              <div className="space-y-3 text-center">
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-stone-400">Thông tin liên hệ</p>
                {fields.supportTitle ? (
                  <h2 className="text-2xl font-semibold text-stone-950 lg:text-3xl">
                    {fields.supportTitle}
                  </h2>
                ) : null}
                {fields.supportDescription ? (
                  <p className="mx-auto max-w-2xl text-sm leading-7 text-stone-600 md:text-base">
                    {fields.supportDescription}
                  </p>
                ) : null}
              </div>
            ) : null}

            {socialLinks.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {socialLinks.map((item) => {
                const content = (
                  <div className="flex h-full flex-col items-center gap-4 rounded-2xl border border-stone-200 bg-white px-5 py-6 text-center transition hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(15,23,42,0.08)]">
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-stone-100 text-sm font-semibold text-stone-900">
                      {item.image ? (
                        <Image src={item.image} alt={item.label} width={64} height={64} className="h-full w-full object-cover" />
                      ) : (
                        item.label.charAt(0).toUpperCase()
                      )}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-stone-950">{item.label}</h3>
                      <p className="mt-1 text-sm leading-6 text-stone-600">{item.description}</p>
                    </div>
                  </div>
                );

                if (!item.href) {
                  return <div key={item.label} className="opacity-60">{content}</div>;
                }

                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                  >
                    {content}
                  </a>
                );
              })}
              </div>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              {(fields.contactEmail || fields.contactPhone || fields.contactAddress) ? (
                <div className="rounded-[28px] border border-stone-200 bg-stone-50 px-6 py-6">
                  <p className="text-xs uppercase tracking-[0.24em] text-stone-400">Liên hệ ngay</p>
                  <div className="mt-4 space-y-3">
                    {fields.contactEmail ? <p className="text-lg font-semibold text-stone-950">{fields.contactEmail}</p> : null}
                    {fields.contactPhone ? <p className="text-base font-medium text-stone-900">{fields.contactPhone}</p> : null}
                    {fields.contactAddress ? <p className="text-sm leading-7 text-stone-600">{fields.contactAddress}</p> : null}
                  </div>
                </div>
              ) : null}

              {contactMethods.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {contactMethods.map((item) => {
                  const card = (
                    <div className="rounded-[28px] border border-stone-200 bg-white px-6 py-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
                      <p className="text-xs uppercase tracking-[0.24em] text-stone-400">{item.label}</p>
                      <p className="mt-3 text-lg font-semibold text-stone-950">{item.value}</p>
                      {item.description ? (
                        <p className="mt-2 text-sm leading-7 text-stone-600">{item.description}</p>
                      ) : null}
                    </div>
                  );

                  if (!item.href) {
                    return <div key={`${item.label}-${item.value}`}>{card}</div>;
                  }

                  return (
                    <a key={`${item.label}-${item.value}`} href={item.href}>
                      {card}
                    </a>
                  );
                })}
                </div>
              ) : null}
            </div>
          </GuestPanelBody>
        </GuestPanel>

        {faqItems.length > 0 ? (
          <div className="space-y-4">
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold text-stone-950 sm:text-2xl lg:text-3xl">Câu hỏi thường gặp</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {faqItems.map((item) => (
              <GuestPanel key={item.question} className="border-stone-200 bg-white/90">
                <GuestPanelHeader>
                  <GuestPanelTitle>{item.question}</GuestPanelTitle>
                </GuestPanelHeader>
                <GuestPanelBody>
                  <p className="text-sm leading-8 text-stone-600 md:text-base">{item.answer}</p>
                </GuestPanelBody>
              </GuestPanel>
            ))}
          </div>
          </div>
        ) : null}

        {fields.googleMapsEmbed ? (
          <div className="aspect-video w-full overflow-hidden rounded-xl border border-stone-200 bg-stone-50 lg:rounded-2xl">
            <iframe
              src={fields.googleMapsEmbed}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        ) : null}

        {page.body ? (
          <div
            className={`border-t border-stone-200 pt-8 ${RICH_TEXT_CONTENT_CLASSNAME}`}
            dangerouslySetInnerHTML={createRichTextMarkup(page.body)}
          />
        ) : null}
      </div>
    </section>
  );
}
