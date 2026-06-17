import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Check,
  ClipboardCheck,
  MapPin,
  Search,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { normalizeServiceGroupItems, ServiceGroupSection, type ServiceGroupItemInput } from "@/app/(guest)/_components/service-group-section";
import { GuestPromotedProviders } from "@/features/ads/components/guest-ads";
import { listPublishedOfferings } from "@/features/offerings/server/service";
import type { ManagedPage } from "@/lib/managed-pages";
import { getPageFields } from "@/lib/page-fields";
import { createRichTextMarkup, RICH_TEXT_CONTENT_CLASSNAME } from "@/lib/rich-text";
import { ROUTES } from "@/lib/routes";
import { ServicesFaqAccordion } from "./services-faq-accordion";

type ServiceFaqItem = {
  question?: string;
  answer?: string;
};

type WorkflowItem = {
  title?: string;
  description?: string;
};

type PlatformItem = {
  title?: string;
  description?: string;
};

const fallbackWorkflow: Required<WorkflowItem>[] = [
  {
    title: "Hiểu nhu cầu",
    description: "Xác định loại dịch vụ, thời điểm cưới, địa điểm, phong cách và mức hỗ trợ cần thiết.",
  },
  {
    title: "Ghép giải pháp",
    description: "Chọn mẫu, sản phẩm hoặc provider phù hợp; tách rõ phần digital, vật lý và dịch vụ có người thực hiện.",
  },
  {
    title: "Triển khai & điều phối",
    description: "Hoàn thiện nội dung, kết nối provider, theo dõi đơn/dịch vụ và chuẩn bị các bước booking tiếp theo.",
  },
];

const fallbackPlatformItems: Required<PlatformItem>[] = [
  {
    title: "Catalog dịch vụ mở rộng",
    description: "Mỗi dịch vụ là một offering có loại, fulfillment, nội dung SEO và khả năng mở rộng riêng.",
  },
  {
    title: "Provider ecosystem",
    description: "Dịch vụ có thể gắn với provider, hồ sơ năng lực, vùng phục vụ, giá và lịch khả dụng.",
  },
  {
    title: "Luồng commerce thống nhất",
    description: "Digital, physical và service cùng nằm trong một kiến trúc để dễ mở checkout, order và fulfillment.",
  },
  {
    title: "Quản trị nội dung linh hoạt",
    description: "Admin vẫn chỉnh được thông điệp trang dịch vụ qua managed page mà không đổi code cho từng nội dung nhỏ.",
  },
];

const fallbackFaqs: ServiceFaqItem[] = [
  {
    question: "PinkLove đang cung cấp dịch vụ theo cách nào?",
    answer: "Trang này được định hướng theo mô hình dịch vụ/platform. Khách hàng chọn nhu cầu cụ thể như thiệp online, thiệp giấy, video, makeup, chụp ảnh hoặc planner.",
  },
  {
    question: "Dịch vụ có thể do PinkLove hoặc provider thực hiện không?",
    answer: "Có. Kiến trúc hiện tại tách rõ offering, provider service và lịch khả dụng để nền tảng có thể vận hành cả dịch vụ nội bộ lẫn dịch vụ từ đối tác.",
  },
  {
    question: "Nếu chưa biết cần dịch vụ nào thì bắt đầu từ đâu?",
    answer: "Bạn có thể gửi brief tổng quan về ngày cưới, địa điểm, ngân sách dự kiến và hạng mục cần hỗ trợ. PinkLove sẽ đề xuất nhóm dịch vụ phù hợp trước khi triển khai chi tiết.",
  },
];

const workflowIcons = [Search, ClipboardCheck, CalendarClock];
const platformIcons = [Sparkles, UsersRound, MapPin, Check];

function normalizeServiceExcerpt(value?: string) {
  return value?.replace(/\bGói\s+/gi, "Dịch vụ ").trim();
}

function normalizeWorkflowItems(items: WorkflowItem[] | undefined) {
  const source = Array.isArray(items) && items.length ? items : fallbackWorkflow;

  return source
    .filter((item) => item.title?.trim() && item.description?.trim())
    .slice(0, 4)
    .map((item) => ({
      title: item.title?.trim() || "",
      description: item.description?.trim() || "",
    }));
}

function normalizePlatformItems(items: PlatformItem[] | undefined) {
  const source = Array.isArray(items) && items.length ? items : fallbackPlatformItems;

  return source
    .filter((item) => item.title?.trim() && item.description?.trim())
    .slice(0, 6)
    .map((item) => ({
      title: item.title?.trim() || "",
      description: item.description?.trim() || "",
    }));
}

export async function ServicesContent({ page }: { page: ManagedPage }) {
  const fields = getPageFields<{
    heroEyebrow?: string;
    heroTitle?: string;
    heroDescription?: string;
    primaryCtaText?: string;
    primaryCtaLink?: string;
    secondaryCtaText?: string;
    secondaryCtaLink?: string;
    servicesEyebrow?: string;
    servicesTitle?: string;
    servicesDescription?: string;
    serviceItems?: ServiceGroupItemInput[];
    catalogEyebrow?: string;
    catalogTitle?: string;
    catalogDescription?: string;
    workflowEyebrow?: string;
    workflowTitle?: string;
    workflowDescription?: string;
    workflowItems?: WorkflowItem[];
    platformEyebrow?: string;
    platformTitle?: string;
    platformDescription?: string;
    platformItems?: PlatformItem[];
    faqEyebrow?: string;
    faqTitle?: string;
    faqDescription?: string;
    faqItems?: ServiceFaqItem[];
    ctaTitle?: string;
    ctaDescription?: string;
    ctaButtonText?: string;
    ctaButtonLink?: string;
  }>(page);

  const publishedServices = (await listPublishedOfferings())
    .filter((offering) => offering.fulfillmentType === "service")
    .slice(0, 6);
  const serviceItems = normalizeServiceGroupItems(fields.serviceItems);
  const workflowItems = normalizeWorkflowItems(fields.workflowItems);
  const platformItems = normalizePlatformItems(fields.platformItems);
  const faqs = (Array.isArray(fields.faqItems) && fields.faqItems.length ? fields.faqItems : fallbackFaqs).filter(
    (item) => item.question?.trim() && item.answer?.trim()
  );

  const heroEyebrow = fields.heroEyebrow?.trim() || "Dịch vụ cưới trên nền tảng PinkLove";
  const heroTitle = fields.heroTitle?.trim() || page.title || "Dịch vụ cưới được tổ chức như một platform";
  const heroDescription =
    fields.heroDescription?.trim() ||
    "PinkLove không chỉ là bảng gói đăng ký. Nền tảng gom digital invitation, sản phẩm cưới, provider service, booking và vận hành đơn hàng vào một trải nghiệm dịch vụ liền mạch.";

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
        <span className="cta-sparkle-float absolute left-[14%] top-[3%] bg-[linear-gradient(180deg,#ffffff_0%,#ffb8fb_42%,#ff6ff5_100%)] bg-clip-text text-3xl text-transparent drop-shadow-[0_6px_16px_rgba(255,111,245,0.16)]">✦</span>
        <span className="cta-sparkle-float absolute left-[36%] top-[5%] bg-[linear-gradient(180deg,#ffffff_0%,#ffd8fc_48%,#ff95f8_100%)] bg-clip-text text-2xl text-transparent opacity-70 drop-shadow-[0_6px_14px_rgba(255,184,251,0.12)]">✦</span>
        <span className="cta-heart-pop absolute left-[20%] top-[14%] bg-[linear-gradient(180deg,#ffd8fc_0%,#ff8be8_45%,#d94dce_100%)] bg-clip-text text-2xl text-transparent opacity-65 drop-shadow-[0_8px_18px_rgba(217,77,206,0.14)]">♥</span>
        <span className="cta-sparkle-float absolute right-[28%] top-[8%] bg-[linear-gradient(180deg,#ffffff_0%,#ffb8fb_42%,#ff6ff5_100%)] bg-clip-text text-3xl text-transparent opacity-75 drop-shadow-[0_6px_16px_rgba(255,111,245,0.14)]">✦</span>
        <span className="cta-heart-pop absolute right-[18%] top-[22%] bg-[linear-gradient(180deg,#ffd8fc_0%,#ff8be8_45%,#d94dce_100%)] bg-clip-text text-2xl text-transparent opacity-25 drop-shadow-[0_8px_18px_rgba(217,77,206,0.08)]">♥</span>
        <span className="cta-sparkle-float absolute right-[10%] top-[34%] bg-[linear-gradient(180deg,#ffffff_0%,#ffb8fb_42%,#ff6ff5_100%)] bg-clip-text text-3xl text-transparent opacity-20 drop-shadow-[0_8px_20px_rgba(255,111,245,0.08)]">✦</span>
      </div>

      <section className="relative z-10 isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 hidden lg:block">
          <span className="cta-sparkle-float absolute left-[8%] top-[18%] text-4xl text-[#ff6ff5]/75 drop-shadow-[0_6px_16px_rgba(255,111,245,0.2)]">✦</span>
          <span className="cta-heart-pop absolute left-[13%] bottom-[26%] text-3xl text-[#d94dce]/70 drop-shadow-[0_8px_18px_rgba(217,77,206,0.24)]">♥</span>
          <span className="cta-sparkle-float absolute right-[8%] top-[46%] text-4xl text-[#ff6ff5]/70 drop-shadow-[0_8px_20px_rgba(255,111,245,0.35)]">✦</span>
        </div>

        <div className="container relative z-10 mx-auto px-4 pb-10 pt-16 lg:pb-12 lg:pt-24">
          <div className="mx-auto max-w-4xl space-y-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-500">{heroEyebrow}</p>
            <h1 className="text-3xl font-semibold leading-tight text-stone-950 sm:text-4xl lg:text-6xl">{heroTitle}</h1>
            <p className="mx-auto max-w-3xl text-sm font-medium leading-8 text-stone-700 md:text-base lg:text-lg">{heroDescription}</p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href={fields.primaryCtaLink?.trim() || ROUTES.CONTACT}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-stone-950 px-6 text-sm font-semibold uppercase text-white transition hover:-translate-y-0.5 hover:bg-rose-700"
              >
                {fields.primaryCtaText?.trim() || "Tư vấn dịch vụ"}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href={fields.secondaryCtaLink?.trim() || ROUTES.TEMPLATES}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-rose-200 bg-white px-6 text-sm font-semibold uppercase text-stone-900 transition hover:-translate-y-0.5 hover:border-rose-300 hover:text-rose-700"
              >
                {fields.secondaryCtaText?.trim() || "Xem hệ sinh thái"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 py-12 lg:py-16">
        <div className="container mx-auto">
          <ServiceGroupSection
            eyebrow={fields.servicesEyebrow?.trim() || "Nhóm dịch vụ"}
            title={fields.servicesTitle?.trim() || "Chọn đúng dịch vụ theo nhu cầu cưới"}
            description={fields.servicesDescription?.trim() || "Mỗi nhóm dịch vụ có thể mở rộng thành offering, provider, đơn hàng và lịch triển khai riêng trong hệ thống."}
            items={serviceItems}
          />
        </div>
      </section>

      <GuestPromotedProviders placementKey="provider_directory_top" limit={17} className="relative z-10 py-10 lg:py-14" />

      {publishedServices.length ? (
        <section className="relative z-10 border-y border-stone-100 bg-white/75 px-4 py-12 lg:py-16">
          <div className="container mx-auto">
            <div className="mb-8 max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-600">
                {fields.catalogEyebrow?.trim() || "Catalog đang mở"}
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-stone-950 sm:text-3xl lg:text-4xl">
                {fields.catalogTitle?.trim() || "Dịch vụ đã được xuất bản trong hệ thống"}
              </h2>
              <p className="mt-4 text-sm leading-8 text-stone-600 md:text-base">
                {fields.catalogDescription?.trim() || "Các dịch vụ này đến trực tiếp từ offering catalog, giúp trang dịch vụ phản ánh đúng dữ liệu vận hành thay vì chỉ là bảng giá tĩnh."}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {publishedServices.map((service) => {
                const serviceExcerpt = normalizeServiceExcerpt(service.excerpt);

                return (
                  <Link
                    key={service.id}
                    href={ROUTES.CONTACT}
                    className="rounded-2xl border border-stone-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-rose-200"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">{service.categoryName || service.offeringType}</p>
                    <h3 className="mt-3 text-lg font-semibold text-stone-950">{service.name}</h3>
                    {serviceExcerpt ? <p className="mt-3 line-clamp-3 text-sm leading-7 text-stone-600">{serviceExcerpt}</p> : null}
                    <span className="mt-5 inline-flex text-sm font-semibold text-rose-700">Trao đổi dịch vụ này</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {page.body ? (
        <section className="relative z-10 px-4 py-12 lg:py-16">
          <div className="container mx-auto max-w-4xl">
            <div className={`${RICH_TEXT_CONTENT_CLASSNAME} text-stone-700`} dangerouslySetInnerHTML={createRichTextMarkup(page.body)} />
          </div>
        </section>
      ) : null}

      <section className="relative z-10 px-4 py-12 lg:py-16">
        <div className="container mx-auto grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-600">
              {fields.workflowEyebrow?.trim() || "Workflow"}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-stone-950 sm:text-3xl lg:text-4xl">
              {fields.workflowTitle?.trim() || "Triển khai dịch vụ theo luồng rõ ràng"}
            </h2>
            <p className="mt-4 text-sm leading-8 text-stone-600 md:text-base">
              {fields.workflowDescription?.trim() || "Từ brief khách hàng đến catalog, provider và lịch thực hiện, trang dịch vụ phản ánh cách nền tảng vận hành thật."}
            </p>
          </div>

          <div className="grid gap-4">
            {workflowItems.map((item, index) => {
              const Icon = workflowIcons[index % workflowIcons.length];

              return (
                <article key={item.title} className="grid gap-4 rounded-2xl border border-stone-100 bg-white p-5 shadow-sm sm:grid-cols-[auto_minmax(0,1fr)]">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">Bước {index + 1}</p>
                    <h3 className="mt-2 text-lg font-semibold text-stone-950">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-stone-600 md:text-base">{item.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative z-10 bg-stone-950 px-4 py-12 text-white lg:py-16">
        <div className="container mx-auto">
          <div className="mb-8 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-300">
              {fields.platformEyebrow?.trim() || "Năng lực platform"}
            </p>
            <h2 className="mt-3 text-2xl font-semibold sm:text-3xl lg:text-4xl">
              {fields.platformTitle?.trim() || "Thiết kế để mở rộng thành hệ sinh thái dịch vụ cưới"}
            </h2>
            <p className="mt-4 text-sm leading-8 text-stone-300 md:text-base">
              {fields.platformDescription?.trim() || "Trang dịch vụ mới đặt trọng tâm vào catalog, provider, booking và commerce để phù hợp với định hướng platform lớn."}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {platformItems.map((item, index) => {
              const Icon = platformIcons[index % platformIcons.length];

              return (
                <article key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-rose-200">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-base font-semibold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-stone-300">{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 py-12 lg:py-16">
        <div className="container mx-auto">
          <div className="mb-8 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-600">
              {fields.faqEyebrow?.trim() || "FAQ dịch vụ"}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-stone-950 sm:text-3xl lg:text-4xl">
              {fields.faqTitle?.trim() || "Câu hỏi thường gặp"}
            </h2>
            <p className="mt-4 text-sm leading-8 text-stone-600 md:text-base">
              {fields.faqDescription?.trim() || "Giải đáp nhanh trước khi khách hàng gửi brief hoặc chọn một dịch vụ cụ thể."}
            </p>
          </div>

          <ServicesFaqAccordion items={faqs} />
        </div>
      </section>

      <section className="relative z-10 px-4 pb-14 lg:pb-20">
        <div className="container mx-auto">
          <div className="overflow-hidden rounded-2xl border border-rose-100 bg-white px-6 py-10 text-center text-stone-950 shadow-sm lg:px-10 lg:py-14">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-600">Bắt đầu với nhu cầu thật</p>
            <h2 className="mx-auto mt-4 max-w-3xl text-2xl font-semibold leading-tight sm:text-3xl lg:text-5xl">
              {fields.ctaTitle?.trim() || "Cần triển khai một hạng mục cưới cụ thể?"}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-stone-600 md:text-base">
              {fields.ctaDescription?.trim() || "Gửi brief dịch vụ, PinkLove sẽ đề xuất hướng triển khai phù hợp với digital invitation, sản phẩm cưới hoặc provider service."}
            </p>
            <Link
              href={fields.ctaButtonLink?.trim() || ROUTES.CONTACT}
              className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-rose-700 px-6 text-sm font-semibold uppercase text-white transition hover:-translate-y-0.5 hover:bg-stone-950"
            >
              {fields.ctaButtonText?.trim() || "Gửi yêu cầu tư vấn"}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
