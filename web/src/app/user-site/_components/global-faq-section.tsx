import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { getGlobalFields } from "@/lib/global-fields";
import { createRichTextMarkup, RICH_TEXT_CONTENT_CLASSNAME } from "@/lib/rich-text";

type GlobalFaqItem = {
  question?: string;
  answer?: string;
};

type GlobalFaqSectionProps = {
  className?: string;
  containerClassName?: string;
};

export async function GlobalFaqSection({ className, containerClassName }: GlobalFaqSectionProps) {
  const globalFields = await getGlobalFields<{
    globalFaqTitle?: string;
    globalFaqDescription?: string;
    globalFaqItems?: GlobalFaqItem[];
  }>();

  const faqTitle = globalFields.globalFaqTitle?.trim() || "Câu hỏi thường gặp";
  const faqDescription = globalFields.globalFaqDescription?.trim();
  const faqItems = (Array.isArray(globalFields.globalFaqItems) ? globalFields.globalFaqItems : []).filter(
    (item) => item.question?.trim() && item.answer?.trim()
  );

  if (faqItems.length === 0) {
    return null;
  }

  return (
    <section className={className}>
      <div className={containerClassName}>
        <div className="grid grid-cols-12 gap-4 lg:gap-7.5">
          <div className="col-span-12 lg:col-span-6 space-y-5 lg:space-y-7.5">
            <div className="inline-flex items-center gap-3 rounded-full border border-stone-200 bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-primary" />FAQ · ZENLOVE</div>

            <div className="space-y-4">
              <h2 className="inline-block text-2xl sm:text-3xl lg:text-4xl 2xl:text-5xl font-semibold">{faqTitle}</h2>
              {faqDescription ? <p className="text-sm lg:text-base leading-8">{faqDescription}</p> : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-stone-200 bg-white px-5 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                <p className="text-sm font-medium text-slate-400">Trải nghiệm hiện đại</p>
                <p className="mt-2 text-xl font-semibold leading-snug text-slate-800">
                  Thiệp online, quà online
                </p>
              </div>
              <div className="rounded-[24px] border border-stone-200 bg-white px-5 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                <p className="text-sm font-medium text-slate-400">Bảo mật & minh bạch</p>
                <p className="mt-2 text-xl font-semibold leading-snug text-slate-800">
                  Theo dõi quà tặng dễ dàng
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                Cần hỗ trợ thêm?
              </p>
              <Link
                href={ROUTES.CONTACT}
                className="inline-flex items-center gap-3 rounded-full border border-stone-200 bg-white px-5 py-3 text-base font-semibold text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5"
              >
                Zeny ơi, giúp tôi
                <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-6 rounded-xl lg:rounded-2xl border border-stone-200 p-2.5 lg:p-5">
            {faqItems.map((item, index) => (
              <details key={item.question} className="group border-b border-stone-200/80 last:border-b-0" open={index === 0}>
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-3 py-2.5 text-left marker:hidden [&::-webkit-details-marker]:hidden">
                  <span className="text-sm lg:text-base font-medium">{item.question}</span>
                  <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-lg font-light">
                    <span className="group-open:hidden">+</span>
                    <span className="hidden text-primary group-open:inline">−</span>
                  </span>
                </summary>
                <div className="px-3 pb-5">
                  <div className={`${RICH_TEXT_CONTENT_CLASSNAME} max-w-none text-xs lg:text-sm`} dangerouslySetInnerHTML={createRichTextMarkup(item.answer ?? "")} />
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
