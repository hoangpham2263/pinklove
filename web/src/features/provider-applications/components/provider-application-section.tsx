import Link from "next/link";
import { CheckCircle2, Factory, ShieldCheck, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ManagedPage } from "@/lib/managed-pages";
import { createRichTextMarkup, RICH_TEXT_CONTENT_CLASSNAME } from "@/lib/rich-text";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

type ProviderApplicationSectionProps = {
  page: ManagedPage;
  submitted?: boolean;
  error?: string;
};

export function ProviderApplicationSection({
  page,
  submitted = false,
  error,
}: ProviderApplicationSectionProps) {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,#fff2dd_0%,#fff9f1_34%,#ffffff_72%)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 lg:px-10 lg:py-14">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-white/90 px-4 py-2 text-sm text-amber-900">
            <Factory className="h-4 w-4" />
            Chương trình đối tác cung ứng
          </div>
          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 md:text-6xl">
              {page.title || page.name}
            </h1>
            <p className="text-base leading-7 text-zinc-600 md:text-lg">
              {page.excerpt || "Gửi hồ sơ để đội ngũ quản trị review trước khi mở quyền provider cho đối tác cung ứng."}
            </p>
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

        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-zinc-200/80 bg-white/92 p-5">
                <ShieldCheck className="h-5 w-5 text-amber-700" />
                <p className="mt-3 font-medium text-zinc-950">Duyệt trước khi mở quyền</p>
                <p className="mt-2 text-sm leading-6 text-zinc-600">Admin review hồ sơ năng lực trước khi cho vào hệ thống provider.</p>
              </div>
              <div className="rounded-3xl border border-zinc-200/80 bg-white/92 p-5">
                <Truck className="h-5 w-5 text-amber-700" />
                <p className="mt-3 font-medium text-zinc-950">Giao hàng trực tiếp</p>
                <p className="mt-2 text-sm leading-6 text-zinc-600">Phù hợp mô hình đối tác giao hàng trực tiếp theo luồng dropshipping.</p>
              </div>
              <div className="rounded-3xl border border-zinc-200/80 bg-white/92 p-5">
                <CheckCircle2 className="h-5 w-5 text-amber-700" />
                <p className="mt-3 font-medium text-zinc-950">Quản lý riêng theo supplier</p>
                <p className="mt-2 text-sm leading-6 text-zinc-600">Sản phẩm và trạng thái đối tác có thể được block hoặc duyệt theo supplier.</p>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200/80 bg-white/92 p-6">
              <p className="text-sm font-medium text-zinc-950">Hồ sơ nên có gì?</p>
              <div className="mt-3 grid gap-3 text-sm text-zinc-600 md:grid-cols-2">
                <p>Tên doanh nghiệp hoặc xưởng in</p>
                <p>Người liên hệ chính</p>
                <p>Số điện thoại và email làm việc</p>
                <p>Nhóm sản phẩm có thể cung ứng</p>
                <p>Khu vực hoạt động / kho hàng</p>
                <p>Kinh nghiệm và năng lực giao đơn</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-zinc-200/80 bg-white/95 p-6 shadow-[0_20px_80px_rgba(32,24,8,0.08)]">
            <div className="mb-5">
              <h2 className="text-2xl font-semibold text-zinc-950">Gửi hồ sơ đối tác</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Hồ sơ sẽ vào hàng chờ review. Nếu phù hợp, đội ngũ quản trị sẽ liên hệ và mở quyền provider.
              </p>
            </div>

            {submitted ? (
              <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                Hồ sơ đã được gửi thành công. Đội ngũ quản trị sẽ review và liên hệ lại.
              </div>
            ) : null}

            {error ? (
              <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                {error === "MISSING_REQUIRED_FIELDS"
                  ? "Vui lòng điền đủ các trường bắt buộc."
                  : error === "INVALID_EMAIL"
                    ? "Email chưa đúng định dạng."
                    : error === "APPLICATION_ALREADY_EXISTS"
                      ? "Email này đã có hồ sơ đang chờ xử lý."
                      : "Không thể gửi hồ sơ lúc này."}
              </div>
            ) : null}

            <form action={ROUTES.API.APPLICATIONS.PROVIDER} method="POST" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-900">Tên doanh nghiệp / xưởng in</label>
                  <input name="companyName" required className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-zinc-400" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-900">Người liên hệ</label>
                  <input name="contactName" required className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-zinc-400" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-900">Số điện thoại</label>
                  <input name="phone" required className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-zinc-400" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-900">Email làm việc</label>
                  <input name="email" type="email" required className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-zinc-400" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-900">Thành phố / khu vực</label>
                  <input name="city" className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-zinc-400" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-900">Website / Fanpage</label>
                  <input name="website" className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-zinc-400" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-900">Nhóm sản phẩm có thể cung ứng</label>
                <input name="categories" placeholder="Ví dụ: thiệp cưới, in ấn, hộp quà, phụ kiện..." className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-zinc-400" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-900">Kinh nghiệm / năng lực xử lý đơn</label>
                <textarea name="experience" rows={4} className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-900">Ghi chú thêm</label>
                <textarea name="notes" rows={4} className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400" />
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button type="submit" className="rounded-full px-6">Gửi hồ sơ đăng ký</Button>
                <Button type="button" variant="outline" className="rounded-full px-6" render={<Link href={ROUTES.CONTACT}>Liên hệ trước với đội ngũ</Link>} />
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
