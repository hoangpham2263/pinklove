import Link from "next/link";
import { ArrowLeft, Heart, Search } from "lucide-react";
import { GuestLinkButton, GuestPanel, GuestPanelBody, GuestShell } from "@/app/(guest)/_components/guest-ui";
import { getCurrentUser, isAdminRole } from "@/lib/auth";
import { getPageBySlug } from "@/lib/managed-pages";
import { getPageFields } from "@/lib/page-fields";
import { ROUTES } from "@/lib/routes";

type NotFoundFields = {
  badgeText?: string;
  panelTitle?: string;
  panelDescription?: string;
  primaryButtonText?: string;
  primaryButtonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  card1Title?: string;
  card1Description?: string;
  card1Link?: string;
  card2Title?: string;
  card2Description?: string;
  card2Link?: string;
  card3Title?: string;
  card3Description?: string;
  card3Link?: string;
  card4Title?: string;
  card4Description?: string;
  card4Link?: string;
  backLinkText?: string;
  backLink?: string;
};

const fallbackCards = [
  {
    title: "Thiệp của tôi",
    description: "Đăng nhập để tự tạo và quản lý thiệp cưới.",
    href: ROUTES.BUILDER,
  },
  {
    title: "Tạo mã QR",
    description: "Tạo mã QR mừng cưới để dùng trên thiệp hoặc website cưới.",
    href: ROUTES.TOOLS_PAGES.QR_BUILDER,
  },
  {
    title: "Blog",
    description: "Xem thêm kinh nghiệm và ý tưởng cho thiệp cưới online.",
    href: ROUTES.BLOG,
  },
  {
    title: "Liên hệ",
    description: "Cần hỗ trợ nhanh, hãy chuyển sang các kênh tư vấn.",
    href: ROUTES.CONTACT,
  },
];

export default async function NotFoundPage() {
  const { user, page } = await Promise.all([getCurrentUser(), getPageBySlug("not-found")])
    .then(([resolvedUser, resolvedPage]) => ({ user: resolvedUser, page: resolvedPage }))
    .catch(() => ({ user: null, page: null }));
  const canUseDraft = page?.status === "published" || isAdminRole(user?.role);
  const resolvedPage = canUseDraft ? page : null;
  const fields = getPageFields<NotFoundFields>(resolvedPage);

  const cards = [
    {
      title: fields.card1Title || fallbackCards[0].title,
      description: fields.card1Description || fallbackCards[0].description,
      href: fields.card1Link || fallbackCards[0].href,
    },
    {
      title: fields.card2Title || fallbackCards[1].title,
      description: fields.card2Description || fallbackCards[1].description,
      href: fields.card2Link || fallbackCards[1].href,
    },
    {
      title: fields.card3Title || fallbackCards[2].title,
      description: fields.card3Description || fallbackCards[2].description,
      href: fields.card3Link || fallbackCards[2].href,
    },
    {
      title: fields.card4Title || fallbackCards[3].title,
      description: fields.card4Description || fallbackCards[3].description,
      href: fields.card4Link || fallbackCards[3].href,
    },
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.12),_transparent_38%),linear-gradient(180deg,_#fff7fb_0%,_#ffffff_48%,_#fffaf2_100%)]">
      <GuestShell className="justify-center py-10 lg:py-15 2 xl:py-20">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
          <div className="mx-auto flex items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.3em] backdrop-blur">
            <Heart className="h-3.5 w-3.5 text-rose-500" />
            {fields.badgeText || "404 Not Found"}
          </div>

          <div className="space-y-4 text-center">
            <h1 className="text-2xl font-semibold sm:text-3xl lg:text-4xl 2 xl:text-5xl">
              {resolvedPage?.title || "Trang bạn tìm không còn ở đây."}
            </h1>
            <p className="mx-auto max-w-2xl text-sm leading-8 text-stone-600 md:text-base lg:text-lg">
              {resolvedPage?.excerpt ||
                "Có thể liên kết đã thay đổi, trang đang ở trạng thái nháp, hoặc đường dẫn chưa đúng. Bạn có thể quay về trang chủ hoặc đi thẳng tới các khu chính của PinkLove."}
            </p>
          </div>

          <GuestPanel className="mx-auto w-full max-w-4xl">
            <GuestPanelBody className="grid gap-4 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
              <div className="space-y-6">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-rose-50 text-rose-500 lg:rounded-2xl">
                  <Search className="h-8 w-8" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-xl font-semibold text-stone-950 sm:text-2xl lg:text-3xl 2 xl:text-4xl">
                    {fields.panelTitle || "Quay lại luồng chính"}
                  </h2>
                  <p className="text-sm leading-8 text-stone-600 md:text-base lg:text-lg">
                    {fields.panelDescription ||
                      "Nếu bạn đang tìm mẫu thiệp, builder, công cụ hoặc blog, hãy bắt đầu lại từ các điểm vào bên phải."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <GuestLinkButton href={fields.primaryButtonLink || ROUTES.HOME}>
                    {fields.primaryButtonText || "Về trang chủ"}
                  </GuestLinkButton>
                  <Link
                    href={fields.secondaryButtonLink || ROUTES.TEMPLATES}
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border border-stone-300 bg-white px-6 text-sm font-semibold text-stone-900 transition hover:bg-stone-50 lg:rounded-2xl"
                  >
                    {fields.secondaryButtonText || "Xem mẫu thiệp"}
                  </Link>
                </div>
              </div>

              <div className="grid gap-3">
                {cards.map((card) => (
                  <Link
                    key={`${card.href}-${card.title}`}
                    href={card.href}
                    className="rounded-xl border border-stone-200 bg-stone-50 px-5 py-4 transition hover:border-stone-300 hover:bg-white lg:rounded-2xl"
                  >
                    <p className="font-medium text-stone-900">{card.title}</p>
                    <p className="mt-1 text-sm text-stone-600">{card.description}</p>
                  </Link>
                ))}
              </div>
            </GuestPanelBody>
          </GuestPanel>

          <Link
            href={fields.backLink || ROUTES.HOME}
            className="mx-auto inline-flex items-center gap-2 text-sm text-stone-500 transition hover:text-stone-900"
          >
            <ArrowLeft className="h-4 w-4" />
            {fields.backLinkText || "Quay lại trang trước đó"}
          </Link>
        </div>
      </GuestShell>
    </main>
  );
}
