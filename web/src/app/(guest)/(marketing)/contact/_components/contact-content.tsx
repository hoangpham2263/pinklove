import Image from "next/image";
import {
  GuestLinkButton,
  GuestPanel,
  GuestPanelBody,
  GuestPanelHeader,
  GuestPanelTitle,
} from "@/app/(guest)/_components/guest-ui";
import type { ManagedPage } from "@/lib/managed-pages";
import { getPageFields } from "@/lib/page-fields";
import { resolveMediaUrl } from "@/lib/media-resolver";

export async function ContactContent({ page }: { page: ManagedPage }) {
  const fields = getPageFields<{
    contactEmail?: string;
    contactPhone?: string;
    contactAddress?: string;
    googleMapsEmbed?: string;
    facebookUrl?: string;
    facebookImage?: string;
    instagramUrl?: string;
    instagramImage?: string;
    zaloUrl?: string;
    zaloImage?: string;
    tiktokUrl?: string;
    tiktokImage?: string;
  }>(page);

  const [zaloImage, facebookImage, instagramImage, tiktokImage] = await Promise.all([
    resolveMediaUrl(fields.zaloImage),
    resolveMediaUrl(fields.facebookImage),
    resolveMediaUrl(fields.instagramImage),
    resolveMediaUrl(fields.tiktokImage),
  ]);

  const socialLinks: Array<{
    label: string;
    href?: string;
    description: string;
    image?: string;
  }> = [
    {
      label: "Zalo",
      href: fields.zaloUrl || (fields.contactPhone ? `https://zalo.me/${fields.contactPhone.replace(/\D/g, "")}` : undefined),
      description: "Nhắn nhanh để được tư vấn trực tiếp.",
      image: zaloImage,
    },
    {
      label: "Facebook",
      href: fields.facebookUrl || undefined,
      description: "Inbox fanpage để trao đổi mẫu và báo giá.",
      image: facebookImage,
    },
    {
      label: "Instagram",
      href: fields.instagramUrl || undefined,
      description: "Xem thêm mẫu và liên hệ qua DM.",
      image: instagramImage,
    },
    {
      label: "TikTok",
      href: fields.tiktokUrl || undefined,
      description: "Xem video ngắn và chuyển sang tư vấn nhanh.",
      image: tiktokImage,
    },
    {
      label: "Email",
      href: fields.contactEmail ? `mailto:${fields.contactEmail}` : undefined,
      description: "Gửi yêu cầu chi tiết qua email.",
    },
  ];

  const faqItems = [
    {
      question: "Tôi nên liên hệ qua kênh nào để được phản hồi nhanh?",
      answer: fields.contactPhone
        ? `Nếu cần phản hồi nhanh nhất, hãy nhắn Zalo hoặc gọi trực tiếp qua ${fields.contactPhone}.`
        : "Nếu cần phản hồi nhanh nhất, hãy ưu tiên Zalo hoặc Facebook để trao đổi trực tiếp.",
    },
    {
      question: "PinkLove hỗ trợ tư vấn những gì?",
      answer: "Chúng tôi hỗ trợ chọn mẫu thiệp, chỉnh nội dung, định hướng giao diện và tư vấn cách triển khai thiệp cưới online phù hợp.",
    },
    {
      question: "Tôi có thể gửi yêu cầu chi tiết ở đâu?",
      answer: fields.contactEmail
        ? `Bạn có thể gửi email chi tiết qua ${fields.contactEmail} hoặc inbox qua các kênh social ở phía trên.`
        : "Bạn có thể inbox trực tiếp qua các kênh social ở phía trên để gửi yêu cầu chi tiết.",
    },
    {
      question: "Tôi có thể đến trao đổi trực tiếp không?",
      answer: fields.contactAddress
        ? fields.contactAddress
        : "Hiện tại bạn có thể hẹn tư vấn trước qua social hoặc điện thoại để được sắp xếp nhanh hơn.",
    },
  ];
  return (
    <section className="pt-10 lg:pt-15 2xl:pt-20">
      <div className="container mx-auto flex w-full flex-1 flex-col gap-10 px-4">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-400">
            <span>Trang chủ</span>
            <span className="mx-2">/</span>
            <span>Liên hệ</span>
          </p>
          <h1 className="text-2xl font-semibold text-stone-950 sm:text-3xl lg:text-4xl 2xl:text-5xl">{page.title}</h1>
          {page.excerpt ? <p className="text-sm leading-8 text-stone-600 md:text-base lg:text-lg">{page.excerpt}</p> : null}
        </div>

        <div className="grid gap-4 xl:grid-cols-5">
          {socialLinks.map((item) => {
            const content = (
              <GuestPanel className="h-full border-stone-200">
                <GuestPanelBody className="flex h-full flex-col items-center gap-4 px-5 py-6 text-center">
                  <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-stone-100 text-xs font-semibold text-stone-900 lg:rounded-2xl">
                    {item.image ? (
                      <Image src={item.image} alt={item.label} width={64} height={64} className="h-full w-full object-cover" />
                    ) : (
                      item.label.charAt(0).toUpperCase()
                    )}
                  </span>
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-stone-950 sm:text-2xl lg:text-3xl 2xl:text-4xl">{item.label}</h2>
                    <p className="text-sm leading-6 text-stone-600">{item.description}</p>
                  </div>
                </GuestPanelBody>
              </GuestPanel>
            );

            if (!item.href) {
              return <div key={item.label} className="h-full opacity-60">{content}</div>;
            }

            return (
              <a
                key={item.label}
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                className="h-full transition hover:-translate-y-1"
              >
                {content}
              </a>
            );
          })}
        </div>

        <div className="space-y-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-xl font-semibold text-stone-950 sm:text-2xl lg:text-3xl 2xl:text-4xl">Câu hỏi thường gặp</h2>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {faqItems.map((item) => (
              <GuestPanel key={item.question} className="col-span-12 md:col-span-6">
                <GuestPanelHeader>
                  <GuestPanelTitle>{item.question}</GuestPanelTitle>
                </GuestPanelHeader>
                <GuestPanelBody>
                  <p className="text-sm leading-8 text-stone-600 md:text-base lg:text-lg">{item.answer}</p>
                </GuestPanelBody>
              </GuestPanel>
            ))}
          </div>
        </div>

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
          <div className="whitespace-pre-wrap border-t border-stone-200 pt-8 text-sm leading-8 text-stone-700 md:text-base lg:text-lg">{page.body}</div>
        ) : null}

        {fields.contactPhone ? (
          <div className="mx-auto w-full max-w-sm">
            <GuestLinkButton href={`https://zalo.me/${fields.contactPhone.replace(/\D/g, "")}`} className="flex w-full justify-center">
              Nhắn Zalo ngay
            </GuestLinkButton>
          </div>
        ) : null}
      </div>
    </section>
  );
}
