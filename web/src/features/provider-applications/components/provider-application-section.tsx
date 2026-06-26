import Link from "next/link";
import { Boxes, CheckCircle2, Factory, ReceiptText, ShieldCheck, Truck } from "lucide-react";

import { GuestMarketingHeroDecor, GuestMarketingPageShell } from "@/app/user-site/_components/guest-marketing-background";
import type { ManagedPage } from "@/lib/managed-pages";
import { createRichTextMarkup, RICH_TEXT_CONTENT_CLASSNAME } from "@/lib/rich-text";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { getPageFields } from "@/lib/page-fields";

type ProviderPageFields = {
  heroBadge?: string;
  registerButtonText?: string;
  loginButtonText?: string;
  benefits?: {
    title: string;
    value: string;
    description: string;
    icon: "Truck" | "ReceiptText" | "ShieldCheck";
  }[];
  processTitle?: string;
  processSubtitle?: string;
  steps?: {
    number: string;
    title: string;
    description: string;
  }[];
  partnersTitle?: string;
  partnerItems?: string[];
  profileTitle?: string;
  profileItems?: string[];
};

const benefitIcons = {
  Truck,
  ReceiptText,
  ShieldCheck,
};

type ProviderApplicationSectionProps = {
  page: ManagedPage;
};

export function ProviderApplicationSection({
  page,
}: ProviderApplicationSectionProps) {
  const fields = getPageFields<ProviderPageFields>(page);

  const benefits = fields.benefits || [
    {
      title: "Nhận lead và đơn phù hợp",
      value: "Kết nối đúng nhu cầu",
      description: "Đưa dịch vụ hoặc nguồn cung của bạn vào hệ sinh thái cưới hỏi, nơi khách đang tìm thiệp, quà tặng và dịch vụ cưới.",
      icon: "Truck" as const,
    },
    {
      title: "Quản lý dịch vụ riêng",
      value: "Có dashboard provider",
      description: "Theo dõi hồ sơ, dịch vụ, yêu cầu khách hàng, đơn được phân công và trạng thái xử lý trong một khu vực riêng.",
      icon: "ReceiptText" as const,
    },
    {
      title: "Duyệt chất lượng",
      value: "Tăng độ tin cậy",
      description: "Provider được kiểm tra thông tin trước khi hiển thị, giúp khách hàng yên tâm hơn khi lựa chọn đối tác.",
      icon: "ShieldCheck" as const,
    },
  ];
  const steps = fields.steps || [
    { number: "01", title: "Tạo tài khoản", description: "Đăng ký tài khoản PinkLove hoặc đăng nhập nếu bạn đã có tài khoản." },
    { number: "02", title: "Hoàn tất hồ sơ provider", description: "Cập nhật thông tin doanh nghiệp, khu vực phục vụ, nhóm dịch vụ và năng lực xử lý." },
    { number: "03", title: "Chờ duyệt và bắt đầu nhận việc", description: "Sau khi hồ sơ phù hợp, admin sẽ mở quyền provider để bạn quản lý dịch vụ và lead." },
  ];
  const partnerItems = fields.partnerItems || [
    "Xưởng in thiệp, quà tặng",
    "Studio ảnh/video cưới",
    "Wedding planner, decorator",
    "Dịch vụ cưới địa phương",
  ];
  const profileItems = fields.profileItems || [
    "Tên doanh nghiệp và người liên hệ",
    "Số điện thoại, email làm việc",
    "Nhóm dịch vụ/sản phẩm cung ứng",
    "Khu vực phục vụ và năng lực xử lý",
  ];

  return (
    <GuestMarketingPageShell ambientGlowDensity="compact">
      <section className="relative z-10 overflow-hidden">
        <GuestMarketingHeroDecor />
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 lg:px-10 lg:py-14">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ff6ff5]/16 bg-white/72 px-4 py-2 text-sm font-semibold text-primary">
            <Factory className="h-4 w-4" />
            {fields.heroBadge || "Chương trình đối tác cung ứng"}
          </div>
          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 md:text-6xl">
              {page.title || page.name || "Trở thành đối tác của Pinklove"}
            </h1>
            <p className="text-base leading-7 text-zinc-600 md:text-lg">
              {page.excerpt || "Dành cho studio, xưởng in, đơn vị cung ứng và nhà cung cấp dịch vụ cưới muốn tham gia hệ sinh thái PinkLove."}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href={ROUTES.AUTH.REGISTER}
                className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition hover:opacity-90"
              >
                {fields.registerButtonText || "Đăng ký tài khoản"}
              </Link>
              <Link
                href={ROUTES.AUTH.LOGIN}
                className="inline-flex h-11 items-center justify-center rounded-full border border-guest-border bg-white px-6 text-sm font-medium text-stone-900 transition hover:border-guest-primary hover:text-guest-primary"
              >
                {fields.loginButtonText || "Đăng nhập để tiếp tục"}
              </Link>
            </div>
          </div>
        </div>

        {page.body ? (
          <div className="rounded-[2rem] border border-zinc-200/80 bg-white/88 px-6 py-6 shadow-[0_20px_80px_rgba(32,24,8,0.05)]">
            <div
              className={cn(RICH_TEXT_CONTENT_CLASSNAME, "max-w-none")}
              dangerouslySetInnerHTML={createRichTextMarkup(page.body)}
            />
          </div>
        ) : null}

        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            {benefits.map(({ title, value, description, icon }) => {
              const Icon = benefitIcons[icon];
              return (
                <article key={title} className="rounded-3xl border border-zinc-200/80 bg-white/92 p-6 shadow-[0_18px_48px_rgba(35,31,39,0.06)]">
                  <Icon className="h-5 w-5 text-primary" />
                  <p className="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-primary/60">{title}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-zinc-950">{value}</h2>
                  <p className="mt-3 text-sm leading-7 text-zinc-600">{description}</p>
                </article>
              );
            })}
          </div>

          <div className="rounded-[2rem] border border-zinc-200/80 bg-white/95 p-6 shadow-[0_20px_80px_rgba(32,24,8,0.08)]">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary/70">{fields.processTitle || "Quy trình tham gia"}</p>
            <h2 className="mt-3 text-2xl font-semibold text-zinc-950 md:text-4xl">{fields.processSubtitle || "Trở thành provider trong 3 bước"}</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {steps.map(({ number, title, description }) => (
                <div key={number} className="rounded-2xl border border-zinc-200/80 bg-white p-5">
                  <p className="text-sm font-semibold text-primary">{number}</p>
                  <h3 className="mt-3 text-lg font-semibold text-zinc-950">{title}</h3>
                  <p className="mt-2 text-sm leading-7 text-zinc-600">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[2rem] border border-zinc-200/80 bg-white/92 p-6">
              <Boxes className="h-5 w-5 text-primary" />
              <h2 className="mt-4 text-2xl font-semibold text-zinc-950">{fields.partnersTitle || "Nhóm đối tác phù hợp"}</h2>
              <div className="mt-4 grid gap-3 text-sm leading-7 text-zinc-600 sm:grid-cols-2">
                {partnerItems.map((item) => <p key={item}>{item}</p>)}
              </div>
            </div>
            <div className="rounded-[2rem] border border-zinc-200/80 bg-white/92 p-6">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <h2 className="mt-4 text-2xl font-semibold text-zinc-950">{fields.profileTitle || "Hồ sơ nên chuẩn bị"}</h2>
              <div className="mt-4 grid gap-3 text-sm leading-7 text-zinc-600 sm:grid-cols-2">
                {profileItems.map((item) => <p key={item}>{item}</p>)}
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>
    </GuestMarketingPageShell>
  );
}
