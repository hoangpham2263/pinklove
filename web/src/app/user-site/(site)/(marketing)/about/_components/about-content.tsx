import Link from "next/link";
import { GuestMarketingHeroDecor, GuestMarketingPageShell } from "@/app/user-site/_components/guest-marketing-background";
import type { ManagedPage } from "@/lib/managed-pages";
import { getPageFields } from "@/lib/page-fields";
import { createRichTextMarkup, RICH_TEXT_CONTENT_CLASSNAME } from "@/lib/rich-text";
import { ROUTES } from "@/lib/routes";

type AboutStatItem = {
  value?: string;
  label?: string;
  description?: string;
};

type AboutValueItem = {
  title?: string;
  description?: string;
};

type AboutStoryItem = {
  label?: string;
  title?: string;
  description?: string;
};

export async function AboutContent({ page }: { page: ManagedPage }) {
  const fields = getPageFields<{
    bannerImage?: string;
    introHeading?: string;
    introText?: string;
    missionTitle?: string;
    missionText?: string;
    stats?: AboutStatItem[];
    valueItems?: AboutValueItem[];
    storyItems?: AboutStoryItem[];
    ctaTitle?: string;
    ctaDescription?: string;
    ctaButtonText?: string;
    ctaButtonLink?: string;
  }>(page);

  const introTitle = fields.introHeading?.trim() || "Giới thiệu về PinkLove";
  const introText =
    fields.introText?.trim() ||
    "PinkLove đồng hành cùng các cặp đôi và doanh nghiệp dịch vụ cưới bằng trải nghiệm thiệp cưới online hiện đại, dễ dùng và đủ linh hoạt để mở rộng theo từng nhu cầu.";

  const stats = (Array.isArray(fields.stats) ? fields.stats : []).filter(
    (item) => item.value?.trim() && item.label?.trim()
  );

  const valueItems = (Array.isArray(fields.valueItems) ? fields.valueItems : []).filter(
    (item) => item.title?.trim() && item.description?.trim()
  );

  const storyItems = (Array.isArray(fields.storyItems) ? fields.storyItems : []).filter(
    (item) => item.title?.trim() && item.description?.trim()
  );

  const fallbackStats: AboutStatItem[] = [
    { value: "01", label: "Nền tảng tập trung", description: "Thiệp, mẫu, khách hàng và vận hành nằm trong cùng một hệ thống." },
    { value: "03", label: "Khu vực rõ vai trò", description: "Guest, Customer và Admin được tách mạch để trải nghiệm không bị lẫn." },
    { value: "24/7", label: "Trải nghiệm online", description: "Khách mời có thể xem thông tin cưới và phản hồi ngay trên thiết bị cá nhân." },
  ];

  const fallbackValues: AboutValueItem[] = [
    {
      title: "Đẹp nhưng phải dễ dùng",
      description: "Giao diện được ưu tiên cảm xúc, nhưng mọi thao tác quản lý nội dung vẫn cần rõ ràng và tiết kiệm thời gian.",
    },
    {
      title: "Tôn trọng câu chuyện riêng",
      description: "Mỗi mẫu thiệp là điểm bắt đầu để cặp đôi cá nhân hóa màu sắc, nội dung, hình ảnh và phong cách sự kiện.",
    },
    {
      title: "Xây để vận hành lâu dài",
      description: "Hệ thống được tổ chức theo module để có thể mở rộng sản phẩm, dịch vụ, thanh toán và chăm sóc khách hàng.",
    },
  ];

  const fallbackStory: AboutStoryItem[] = [
    {
      label: "Bắt đầu",
      title: "Nhìn lại cách thiệp cưới được chia sẻ",
      description: "Khách hàng cần một cách gửi lời mời nhanh hơn, cập nhật dễ hơn và vẫn giữ được cảm xúc trang trọng của ngày cưới.",
    },
    {
      label: "Xây dựng",
      title: "Tạo nền tảng có thể chỉnh sửa liên tục",
      description: "PinkLove kết hợp mẫu thiết kế, builder, CMS và khu vực khách hàng để giảm thời gian vận hành cho cả người dùng lẫn đội ngũ quản trị.",
    },
    {
      label: "Phát triển",
      title: "Mở rộng thành hệ sinh thái dịch vụ cưới",
      description: "Từ thiệp online, nền tảng có thể tiếp tục kết nối sản phẩm, đối tác, affiliate và các công cụ hỗ trợ kế hoạch cưới.",
    },
  ];

  const visibleStats = stats.length ? stats : fallbackStats;
  const visibleValues = valueItems.length ? valueItems : fallbackValues;
  const visibleStory = storyItems.length ? storyItems : fallbackStory;
  const missionTitle = fields.missionTitle?.trim() || "Chúng tôi giúp việc kể câu chuyện cưới trở nên gọn gàng, đẹp mắt và dễ vận hành.";
  const missionText =
    fields.missionText?.trim() ||
    "Trang giới thiệu không chỉ nói doanh nghiệp là ai. Nó cần cho khách hàng thấy lý do thương hiệu tồn tại, cách làm việc, giá trị cam kết và bước tiếp theo họ có thể thực hiện.";

  return (
    <GuestMarketingPageShell ambientGlowDensity="extended">
      <section className="relative z-10 overflow-hidden">
        <GuestMarketingHeroDecor />

        <div className="container px-4 mx-auto relative z-10 pt-10 lg:pt-15 2xl:pt-20">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.35em] text-stone-700">
            <span>Trang chủ</span>
            <span className="mx-2 text-stone-500">/</span>
            <span className="text-stone-900">Giới thiệu</span>
          </p>

          <h1 className="text-center mt-5 text-3xl font-semibold leading-tight sm:text-4xl lg:text-6xl">
            {introTitle}
          </h1>

          <p className="text-center mt-5 text-sm md:text-base lg:text-lg">
            {introText}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href={fields.ctaButtonLink?.trim() || ROUTES.CONTACT}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[linear-gradient(90deg,#FF95F8_0%,#FF6FF5_50%,#FF95F8_100%)] px-6 text-sm font-semibold uppercase text-white transition hover:-translate-y-0.5"
            >
              {fields.ctaButtonText?.trim() || "Liên hệ tư vấn"}
            </Link>
            <Link
              href={ROUTES.TEMPLATES}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-stone-300 bg-white/70 px-6 text-sm font-semibold uppercase text-stone-900 transition hover:-translate-y-0.5 hover:border-[#ff6ff5]"
            >
              Xem mẫu thiệp
            </Link>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 py-12 lg:py-16">
        <div className="container mx-auto">
          <div className="grid gap-4 md:grid-cols-3">
            {visibleStats.map((item) => (
              <article key={`${item.value}-${item.label}`} className="rounded-2xl border border-[#ffd8fc]/80 bg-white p-6">
                <p className="text-4xl font-semibold text-[#d94dce]">{item.value}</p>
                <h2 className="mt-3 text-lg font-semibold text-stone-950">{item.label}</h2>
                {item.description ? <p className="mt-2 text-sm leading-7 text-stone-600">{item.description}</p> : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 py-14 lg:py-20">
        <div className="container mx-auto">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d94dce]">Sứ mệnh</p>
              <h2 className="mt-4 text-2xl font-semibold leading-tight text-stone-950 sm:text-3xl lg:text-5xl">
                {missionTitle}
              </h2>
            </div>

            <div className="space-y-6 lg:col-span-7">
              <p className="text-sm leading-8 text-stone-700 md:text-base lg:text-lg">{missionText}</p>
              {page.body ? (
                <div
                  className={`${RICH_TEXT_CONTENT_CLASSNAME} text-stone-700`}
                  dangerouslySetInnerHTML={createRichTextMarkup(page.body)}
                />
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 py-14 lg:py-20">
        <div className="container mx-auto">
          <div className="mb-9 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d94dce]">Giá trị cốt lõi</p>
            <h2 className="mt-3 text-2xl font-semibold text-stone-950 sm:text-3xl lg:text-4xl">Điều PinkLove ưu tiên trong từng trải nghiệm</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {visibleValues.map((item) => (
              <article key={item.title} className="rounded-2xl border border-[#ffd8fc]/80 bg-white p-6">
                <h3 className="text-lg font-semibold text-stone-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-8 text-stone-600 md:text-base">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 py-14 lg:py-20">
        <div className="container mx-auto">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d94dce]">Hành trình</p>
              <h2 className="mt-3 text-2xl font-semibold text-stone-950 sm:text-3xl lg:text-4xl">Từ nhu cầu thật đến nền tảng vận hành</h2>
            </div>

            <div className="space-y-4 lg:col-span-8">
              {visibleStory.map((item, index) => (
                <article key={`${item.title}-${index}`} className="grid gap-4 rounded-2xl border border-[#ffd8fc]/80 bg-white p-6 md:grid-cols-[120px_minmax(0,1fr)]">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d94dce]">{item.label || `Bước ${index + 1}`}</p>
                  <div>
                    <h3 className="text-lg font-semibold text-stone-950">{item.title}</h3>
                    <p className="mt-2 text-sm leading-8 text-stone-600 md:text-base">{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 pb-14 lg:pb-20">
        <div className="container mx-auto">
          <div className="overflow-hidden rounded-2xl border border-[#ffd8fc]/80 bg-white px-6 py-10 text-center text-stone-950 lg:px-10 lg:py-14">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d94dce]">Kết nối với PinkLove</p>
            <h2 className="mx-auto mt-4 max-w-3xl text-2xl font-semibold leading-tight sm:text-3xl lg:text-5xl">
              {fields.ctaTitle?.trim() || "Bạn muốn xây dựng trải nghiệm cưới online chỉn chu hơn?"}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-stone-600 md:text-base">
              {fields.ctaDescription?.trim() || "Trao đổi với chúng tôi để chọn mẫu, chỉnh nội dung hoặc mở rộng hệ thống theo nhu cầu vận hành của bạn."}
            </p>
            <Link
              href={fields.ctaButtonLink?.trim() || ROUTES.CONTACT}
              className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-[linear-gradient(90deg,#FF95F8_0%,#FF6FF5_50%,#FF95F8_100%)] px-6 text-sm font-semibold uppercase text-white transition hover:-translate-y-0.5"
            >
              {fields.ctaButtonText?.trim() || "Liên hệ ngay"}
            </Link>
          </div>
        </div>
      </section>
    </GuestMarketingPageShell>
  );
}
