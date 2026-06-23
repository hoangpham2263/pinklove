import Link from "next/link";
import { BadgePercent, CircleDollarSign, Megaphone, UserPlus } from "lucide-react";

import { NativeForm } from "@/components/common/native-form";
import { Button } from "@/components/ui/button";
import type { ManagedPage } from "@/lib/managed-pages";
import { createRichTextMarkup, RICH_TEXT_CONTENT_CLASSNAME } from "@/lib/rich-text";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

type AffiliateApplicationSectionProps = {
  page: ManagedPage;
  submitted?: boolean;
  error?: string;
};

function getErrorMessage(error?: string) {
  if (!error) return null;
  if (error === "MISSING_REQUIRED_FIELDS") return "Vui lòng điền đủ các trường bắt buộc.";
  if (error === "INVALID_EMAIL") return "Email chưa đúng định dạng.";
  if (error === "AFFILIATE_CODE_INVALID") return "Mã affiliate cần tối thiểu 3 ký tự a-z, 0-9 hoặc dấu gạch ngang.";
  if (error === "AFFILIATE_CODE_TAKEN") return "Mã affiliate mong muốn đã có người dùng.";
  if (error === "APPLICATION_ALREADY_EXISTS") return "Email này đã có hồ sơ affiliate đang được xử lý.";
  return "Không thể gửi hồ sơ affiliate lúc này.";
}

export function AffiliateApplicationSection({
  page,
  submitted = false,
  error,
}: AffiliateApplicationSectionProps) {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,#f6efe7_0%,#fbf7f2_36%,#ffffff_72%)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 lg:px-10 lg:py-14">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/90 px-4 py-2 text-sm text-emerald-900">
            <BadgePercent className="h-4 w-4" />
            Chương trình cộng tác viên affiliate
          </div>
          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 md:text-6xl">
              {page.title || page.name}
            </h1>
            <p className="text-base leading-7 text-zinc-600 md:text-lg">
              {page.excerpt || "Gửi hồ sơ đăng ký để đội ngũ quản trị review trước khi kích hoạt tài khoản affiliate và mã giới thiệu."}
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
                <Megaphone className="h-5 w-5 text-emerald-700" />
                <p className="mt-3 font-medium text-zinc-950">Dùng cho khách chưa đăng nhập</p>
                <p className="mt-2 text-sm leading-6 text-zinc-600">Khách có thể gửi yêu cầu trước, chưa cần tạo tài khoản customer ngay.</p>
              </div>
              <div className="rounded-3xl border border-zinc-200/80 bg-white/92 p-5">
                <CircleDollarSign className="h-5 w-5 text-emerald-700" />
                <p className="mt-3 font-medium text-zinc-950">Review trước khi kích hoạt</p>
                <p className="mt-2 text-sm leading-6 text-zinc-600">Admin sẽ kiểm tra hồ sơ, mã mong muốn và kênh triển khai trước khi duyệt.</p>
              </div>
              <div className="rounded-3xl border border-zinc-200/80 bg-white/92 p-5">
                <UserPlus className="h-5 w-5 text-emerald-700" />
                <p className="mt-3 font-medium text-zinc-950">Tách khỏi customer affiliate</p>
                <p className="mt-2 text-sm leading-6 text-zinc-600">Trang này dành cho đầu vào guest; luồng dashboard affiliate hiện có vẫn giữ riêng cho user đã login.</p>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200/80 bg-white/92 p-6">
              <p className="text-sm font-medium text-zinc-950">Hồ sơ nên có gì?</p>
              <div className="mt-3 grid gap-3 text-sm text-zinc-600 md:grid-cols-2">
                <p>Họ tên và số điện thoại liên hệ</p>
                <p>Email làm việc chính</p>
                <p>Mã affiliate mong muốn</p>
                <p>Kênh social hoặc landing page đang dùng</p>
                <p>Tệp khách hàng / nguồn traffic</p>
                <p>Ghi chú cách bạn dự kiến triển khai</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-zinc-200/80 bg-white/95 p-6 shadow-[0_20px_80px_rgba(32,24,8,0.08)]">
            <div className="mb-5">
              <h2 className="text-2xl font-semibold text-zinc-950">Gửi hồ sơ affiliate</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Sau khi duyệt, bạn có thể được tạo tài khoản hoặc được mời hoàn tất thông tin để kích hoạt dashboard affiliate.
              </p>
            </div>

            {submitted ? (
              <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                Hồ sơ đã được gửi thành công. Đội ngũ quản trị sẽ review và liên hệ lại.
              </div>
            ) : null}

            {error ? (
              <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                {getErrorMessage(error)}
              </div>
            ) : null}

            <NativeForm action={ROUTES.API.APPLICATIONS.AFFILIATE} method="POST" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-900">Họ và tên</label>
                  <input name="fullName" required className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-zinc-400" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-900">Số điện thoại</label>
                  <input name="phone" required className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-zinc-400" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-900">Email</label>
                  <input name="email" type="email" required className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-zinc-400" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-900">Mã affiliate mong muốn</label>
                  <input name="preferredCode" placeholder="vi-du: quoc-hoang" className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-zinc-400" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-900">Khu vực hoạt động</label>
                  <input name="city" className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-zinc-400" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-900">Link kênh / social / landing page</label>
                  <input name="channelLink" className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-zinc-400" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-900">Bạn tiếp cận khách hàng theo cách nào?</label>
                <textarea name="audienceNote" rows={4} className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-900">Ghi chú thêm</label>
                <textarea name="notes" rows={4} className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400" />
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button type="submit" className="rounded-full px-6">Gửi yêu cầu affiliate</Button>
                <Button type="button" variant="outline" className="rounded-full px-6" render={<Link href={ROUTES.AUTH.LOGIN}>Đã có tài khoản? Đăng nhập</Link>} />
              </div>
            </NativeForm>
          </div>
        </div>
      </div>
    </section>
  );
}
