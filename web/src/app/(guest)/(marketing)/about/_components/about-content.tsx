import Image from "next/image";
import { GuestPanel, GuestPanelBody, GuestPanelHeader, GuestPanelTitle } from "@/app/(guest)/_components/guest-ui";
import type { ManagedPage } from "@/lib/managed-pages";
import { getPageFields } from "@/lib/page-fields";
import { createRichTextMarkup, RICH_TEXT_CONTENT_CLASSNAME } from "@/lib/rich-text";

export function AboutContent({ page }: { page: ManagedPage }) {
  const fields = getPageFields<{
    bannerImage?: string;
    introHeading?: string;
    introText?: string;
  }>(page);

  const highlights = [
    {
      label: "Định hướng",
      value: "Guest riêng, admin rõ ràng",
    },
    {
      label: "Cách làm",
      value: "Bắt đầu nhanh rồi tinh chỉnh sâu",
    },
    {
      label: "Mục tiêu",
      value: "Thiệp cưới online gọn và dễ dùng",
    },
  ];

  const principles = [
    {
      title: "Rõ luồng sử dụng",
      body: "Chúng tôi tách phần public, customer, admin và builder để mỗi khu vực có trách nhiệm rõ ràng, dễ phát triển và dễ bảo trì.",
    },
    {
      title: "Tối ưu cho chỉnh sửa",
      body: "Mẫu có sẵn giúp đi nhanh, còn builder cho phép mở rộng khi bạn cần một giao diện linh hoạt hơn.",
    },
    {
      title: "Dễ phát triển tiếp",
      body: "Cấu trúc hiện tại được giữ đơn giản để đội ngũ có thể bổ sung template, social, CMS và workflow mới mà không bị rối.",
    },
  ];

  return (
    <div className="flex-1">
      <section className="pt-10 lg:pt-15 2xl:pt-20">
        <div className="container mx-auto px-4">
          <div className="space-y-10">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <p className="text-xs uppercase tracking-[0.35em] text-stone-400">
                <span>Trang chủ</span>
                <span className="mx-2">/</span>
                <span>Giới thiệu</span>
              </p>
              <h1 className="text-2xl font-semibold text-stone-950 sm:text-3xl lg:text-4xl 2xl:text-5xl">{page.title}</h1>
              {page.excerpt ? (
                <p className="mx-auto max-w-2xl text-sm leading-8 text-stone-600 md:text-base lg:text-lg">
                  {page.excerpt}
                </p>
              ) : null}
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <div className="relative min-h-[340px] overflow-hidden rounded-xl border border-stone-200 bg-[linear-gradient(135deg,#f7efe7_0%,#f1e7de_100%)] lg:rounded-2xl">
                  {fields.bannerImage ? (
                    <Image src={fields.bannerImage} alt="Banner" fill className="object-cover" priority />
                  ) : null}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.82)_100%)]" />
                  <div className="relative flex h-full flex-col justify-end p-8 lg:p-10">
                    <div className="max-w-2xl space-y-4">
                      <p className="text-xs uppercase tracking-[0.35em] text-stone-500">pinklove</p>
                      <h2 className="text-xl font-semibold text-stone-950 sm:text-2xl lg:text-3xl 2xl:text-4xl">
                        {fields.introHeading || "Thiệp cưới online hiện đại, rõ ràng và dễ mở rộng."}
                      </h2>
                      <p className="text-sm leading-8 text-stone-700 md:text-base lg:text-lg">
                        {fields.introText || "Chúng tôi xây dựng trải nghiệm public, customer và admin theo từng vai trò rõ ràng để việc vận hành và chỉnh sửa luôn gọn."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 lg:col-span-4">
                {highlights.map((item) => (
                  <GuestPanel key={item.label}>
                    <GuestPanelBody className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.3em] text-stone-400">{item.label}</p>
                      <p className="text-lg font-semibold text-stone-950">{item.value}</p>
                    </GuestPanelBody>
                  </GuestPanel>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
              <GuestPanel className="col-span-12 lg:col-span-7">
                <GuestPanelHeader>
                  <GuestPanelTitle>Chúng tôi đang làm gì</GuestPanelTitle>
                </GuestPanelHeader>
                <GuestPanelBody>
                  <div className="space-y-5">
                    {page.body ? (
                      <div
                        className={RICH_TEXT_CONTENT_CLASSNAME}
                        dangerouslySetInnerHTML={createRichTextMarkup(page.body)}
                      />
                    ) : (
                      <p className="text-sm leading-8 text-stone-700 md:text-base lg:text-lg">
                        PinkLove tập trung vào trải nghiệm tạo thiệp cưới online đơn giản, có thể bắt đầu nhanh nhưng vẫn đủ linh hoạt để mở rộng khi cần.
                      </p>
                    )}
                  </div>
                </GuestPanelBody>
              </GuestPanel>

              <GuestPanel className="col-span-12 lg:col-span-5">
                <GuestPanelHeader>
                  <GuestPanelTitle>Vì sao cấu trúc này hợp lý</GuestPanelTitle>
                </GuestPanelHeader>
                <GuestPanelBody className="space-y-5">
                  {principles.map((item) => (
                    <div key={item.title} className="space-y-2 border-b border-stone-100 pb-4 last:border-b-0 last:pb-0">
                      <h3 className="text-lg font-semibold text-stone-950">{item.title}</h3>
                      <p className="text-sm leading-7 text-stone-600 md:text-base lg:text-lg">{item.body}</p>
                    </div>
                  ))}
                </GuestPanelBody>
              </GuestPanel>
            </div>

            <div className="grid grid-cols-12 gap-6">
              <GuestPanel className="col-span-12 md:col-span-4">
                <GuestPanelBody className="space-y-2 text-center">
                  <p className="text-3xl font-semibold text-stone-950">01</p>
                  <p className="text-sm uppercase tracking-[0.3em] text-stone-400">Guest</p>
                  <p className="text-sm leading-7 text-stone-600">Phần public được code riêng để giữ giao diện chủ động và sạch.</p>
                </GuestPanelBody>
              </GuestPanel>
              <GuestPanel className="col-span-12 md:col-span-4">
                <GuestPanelBody className="space-y-2 text-center">
                  <p className="text-3xl font-semibold text-stone-950">02</p>
                  <p className="text-sm uppercase tracking-[0.3em] text-stone-400">Customer</p>
                  <p className="text-sm leading-7 text-stone-600">Khách hàng có luồng riêng để quản lý thiệp, chỉnh nội dung và publish.</p>
                </GuestPanelBody>
              </GuestPanel>
              <GuestPanel className="col-span-12 md:col-span-4">
                <GuestPanelBody className="space-y-2 text-center">
                  <p className="text-3xl font-semibold text-stone-950">03</p>
                  <p className="text-sm uppercase tracking-[0.3em] text-stone-400">Admin</p>
                  <p className="text-sm leading-7 text-stone-600">Admin quản lý sản phẩm, CMS, media và workflow mà không lẫn với public UI.</p>
                </GuestPanelBody>
              </GuestPanel>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
