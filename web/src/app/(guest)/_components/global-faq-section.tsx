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
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10 2xl:gap-14">
          <div className="space-y-6 lg:space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-stone-200 bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-rose-400" />
              FAQ · ZENLOVE
            </div>

            <div className="max-w-2xl space-y-4">
              <h2 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
                {faqTitle}
              </h2>
              {faqDescription ? (
                <p className="max-w-xl text-base leading-8 text-slate-500 lg:text-lg">
                  {faqDescription}
                </p>
              ) : null}
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

          <div className="rounded-[28px] border border-stone-200 bg-white/90 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.08)] lg:p-5">
            {faqItems.map((item, index) => (
              <details
                key={item.question}
                className="group border-b border-stone-200/80 last:border-b-0"
                open={index === 0}
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-3 py-5 text-left marker:hidden [&::-webkit-details-marker]:hidden">
                  <span className="text-xl font-semibold leading-snug text-slate-800">
                    {item.question}
                  </span>
                  <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-2xl font-light text-slate-400">
                    <span className="group-open:hidden">+</span>
                    <span className="hidden text-rose-400 group-open:inline">−</span>
                  </span>
                </summary>
                <div className="px-3 pb-5">
                  <div
                    className={`${RICH_TEXT_CONTENT_CLASSNAME} max-w-none text-base leading-8 text-slate-500`}
                    dangerouslySetInnerHTML={createRichTextMarkup(item.answer ?? "")}
                  />
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
