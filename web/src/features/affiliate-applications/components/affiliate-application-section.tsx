import Link from "next/link";
import { BadgePercent, CircleDollarSign, Megaphone, MousePointerClick, ReceiptText, UserPlus } from "lucide-react";

import { GuestMarketingHeroDecor, GuestMarketingPageShell } from "@/app/(guest)/_components/guest-marketing-background";
import type { ManagedPage } from "@/lib/managed-pages";
import { createRichTextMarkup, RICH_TEXT_CONTENT_CLASSNAME } from "@/lib/rich-text";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

type AffiliateApplicationSectionProps = {
  page: ManagedPage;
};

export function AffiliateApplicationSection({
  page,
}: AffiliateApplicationSectionProps) {
  const benefits = [
    {
      title: "Hoa hồng theo đơn",
      value: "Theo giá trị đơn",
      description: "Giới thiệu khách tạo thiệp, đặt dịch vụ hoặc mua sản phẩm và nhận hoa hồng khi đơn thanh toán thành công.",
      Icon: CircleDollarSign,
    },
    {
      title: "Link giới thiệu riêng",
      value: "Theo dõi tự động",
      description: "Mỗi tài khoản có mã/link riêng để hệ thống ghi nhận nguồn giới thiệu rõ ràng trong dashboard.",
      Icon: MousePointerClick,
    },
    {
      title: "Nội dung dễ chia sẻ",
      value: "Mẫu thiệp + dịch vụ",
      description: "Phù hợp creator, wedding planner, studio hoặc cộng đồng cưới hỏi muốn chia sẻ sản phẩm có nhu cầu thật.",
      Icon: Megaphone,
    },
  ];
  const steps = [
    ["01", "Đăng ký tài khoản", "Tạo tài khoản PinkLove miễn phí hoặc đăng nhập nếu bạn đã có tài khoản."],
    ["02", "Kích hoạt affiliate", "Vào dashboard để hoàn tất thông tin nhận hoa hồng và lấy link giới thiệu."],
    ["03", "Chia sẻ và theo dõi", "Chia sẻ link, theo dõi đơn phát sinh và số dư hoa hồng ngay trong tài khoản."],
  ];

  return (
    <GuestMarketingPageShell ambientGlowDensity="compact">
      <section className="relative z-10 overflow-hidden">
        <GuestMarketingHeroDecor />
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 lg:px-10 lg:py-14">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ff6ff5]/16 bg-white/72 px-4 py-2 text-sm font-semibold text-primary">
            <BadgePercent className="h-4 w-4" />
            Chương trình cộng tác viên affiliate
          </div>
          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 md:text-6xl">
              {page.title || page.name}
            </h1>
            <p className="text-base leading-7 text-zinc-600 md:text-lg">
              {page.excerpt || "Tham gia chương trình affiliate để giới thiệu thiệp cưới, dịch vụ cưới và nhận hoa hồng khi phát sinh đơn hợp lệ."}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href={ROUTES.AUTH.REGISTER}
                className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition hover:opacity-90"
              >
                Tham gia miễn phí
              </Link>
              <Link
                href={ROUTES.AUTH.LOGIN}
                className="inline-flex h-11 items-center justify-center rounded-full border border-guest-border bg-white px-6 text-sm font-medium text-stone-900 transition hover:border-guest-primary hover:text-guest-primary"
              >
                Đã có tài khoản? Đăng nhập
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
            {benefits.map(({ title, value, description, Icon }) => (
              <article key={title} className="rounded-3xl border border-zinc-200/80 bg-white/92 p-6 shadow-[0_18px_48px_rgba(35,31,39,0.06)]">
                <Icon className="h-5 w-5 text-primary" />
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-primary/60">{title}</p>
                <h2 className="mt-2 text-2xl font-semibold text-zinc-950">{value}</h2>
                <p className="mt-3 text-sm leading-7 text-zinc-600">{description}</p>
              </article>
            ))}
          </div>

          <div className="rounded-[2rem] border border-zinc-200/80 bg-white/95 p-6 shadow-[0_20px_80px_rgba(32,24,8,0.08)]">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary/70">Bắt đầu nhanh</p>
            <h2 className="mt-3 text-2xl font-semibold text-zinc-950 md:text-4xl">Cách tham gia affiliate</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {steps.map(([number, title, description]) => (
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
              <ReceiptText className="h-5 w-5 text-primary" />
              <h2 className="mt-4 text-2xl font-semibold text-zinc-950">Theo dõi trong dashboard</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-600">
                Sau khi đăng nhập, bạn có thể xem link giới thiệu, đơn phát sinh, trạng thái ghi nhận và lịch sử hoa hồng ngay trong khu vực tài khoản.
              </p>
            </div>
            <div className="rounded-[2rem] border border-zinc-200/80 bg-white/92 p-6">
              <UserPlus className="h-5 w-5 text-primary" />
              <h2 className="mt-4 text-2xl font-semibold text-zinc-950">Phù hợp với ai?</h2>
              <div className="mt-4 grid gap-3 text-sm leading-7 text-zinc-600 sm:grid-cols-2">
                <p>Creator nội dung cưới hỏi</p>
                <p>Wedding planner, studio, vendor</p>
                <p>Cộng đồng cô dâu chú rể</p>
                <p>Blog/website về cưới hỏi</p>
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>
    </GuestMarketingPageShell>
  );
}
