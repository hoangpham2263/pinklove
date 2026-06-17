import Link from "next/link";
import type { ReactNode } from "react";
import { Check, HeartHandshake, Images, Megaphone, Palette } from "lucide-react";
import { ROUTES } from "@/lib/routes";

export type ServiceGroupItemInput = {
  headerImage?: string;
  title?: string;
  description?: string;
  detailItems?: string;
  descriptionItems?: string;
  badge?: string;
  ctaText?: string;
  ctaLink?: string;
};

export type ServiceGroupItem = {
  title: string;
  description: string;
  badge: string;
  details: string[];
  ctaText: string;
  ctaLink: string;
};

const fallbackServices: ServiceGroupItemInput[] = [
  {
    title: "Thiệp cưới online & website cưới",
    description: "Xây dựng thiệp online, landing page cưới và luồng chia sẻ khách mời trên một nền tảng thống nhất.",
    detailItems: "Mẫu coded và builder\nRSVP, lời chúc, album, bản đồ\nTối ưu hiển thị mobile và SEO",
    badge: "Digital",
    ctaText: "Xem mẫu thiệp",
    ctaLink: ROUTES.TEMPLATES,
  },
  {
    title: "Thiệp giấy & sản phẩm cưới",
    description: "Kết nối nhu cầu in ấn, quà cưới và sản phẩm vật lý với quy trình đặt hàng, thanh toán, fulfillment.",
    detailItems: "Thiệp giấy, phụ kiện, quà tặng\nQuản lý đơn hàng và thanh toán\nSẵn sàng mở provider supply",
    badge: "Commerce",
    ctaText: "Khám phá thiệp giấy",
    ctaLink: ROUTES.PAPER,
  },
  {
    title: "Dịch vụ cưới từ provider",
    description: "Tổ chức các dịch vụ như makeup, chụp ảnh, quay video, trang trí và wedding planner theo mô hình marketplace.",
    detailItems: "Provider profile và phê duyệt dịch vụ\nLịch khả dụng theo từng dịch vụ\nSẵn sàng mở booking và điều phối",
    badge: "Marketplace",
    ctaText: "Trao đổi nhu cầu",
    ctaLink: ROUTES.CONTACT,
  },
];

const serviceIcons = [Palette, Images, HeartHandshake, Megaphone];

function splitLines(value?: string) {
  return (value ?? "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeServiceGroupItems(items: ServiceGroupItemInput[] | undefined, maxItems = 6): ServiceGroupItem[] {
  const source = Array.isArray(items) && items.length ? items : fallbackServices;

  return source
    .filter((item) => item.title?.trim() && item.description?.trim())
    .slice(0, maxItems)
    .map((item, index) => ({
      title: item.title?.trim() || "",
      description: item.description?.trim() || "",
      badge: item.badge?.trim() || fallbackServices[index % fallbackServices.length].badge || "Dịch vụ",
      details: splitLines(item.detailItems || item.descriptionItems),
      ctaText: item.ctaText?.trim() || "Trao đổi nhu cầu",
      ctaLink: item.ctaLink?.trim() || ROUTES.CONTACT,
    }));
}

export function ServiceGroupSection({
  eyebrow,
  title,
  description,
  items,
  action,
  theme = "rose",
  gridClassName = "grid gap-5 lg:grid-cols-3",
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
  items: ServiceGroupItem[];
  action?: ReactNode;
  theme?: "rose" | "home";
  gridClassName?: string;
}) {
  const isHome = theme === "home";
  const eyebrowClassName = isHome ? "text-[#b529aa]" : "text-rose-600";
  const cardClassName = isHome
    ? "border-[#f8d8f4] hover:border-[#ff6ff5] hover:shadow-[0_18px_44px_rgba(217,77,206,0.12)]"
    : "border-rose-100 hover:border-rose-200";
  const iconClassName = isHome ? "bg-[#fff5fd] text-[#b529aa]" : "bg-rose-50 text-rose-700";
  const badgeClassName = isHome ? "bg-[#fff5fd] text-[#b529aa]" : "bg-stone-100 text-stone-600";
  const ctaClassName = isHome ? "text-[#b529aa] hover:text-stone-950" : "text-rose-700 hover:text-stone-950";

  return (
    <div>
      <div className={`mb-8 flex flex-col gap-5 ${action ? "lg:flex-row lg:items-end lg:justify-between" : (isHome ? "items-center text-center mx-auto" : "")}`}>
        <div className="max-w-3xl">
          {eyebrow?.trim() ? (
            <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${eyebrowClassName}`}>
              {eyebrow.trim()}
            </p>
          ) : null}
          <h2 className="mt-3 text-2xl font-semibold text-stone-950 sm:text-3xl lg:text-4xl">
            {title?.trim() || "Chọn đúng dịch vụ theo nhu cầu cưới"}
          </h2>
          {description?.trim() ? (
            <p className="mt-4 text-sm leading-8 text-stone-600 md:text-base">
              {description.trim()}
            </p>
          ) : null}
        </div>
        {action ? <div className="flex shrink-0 justify-start lg:justify-end">{action}</div> : null}
      </div>

      <div className={gridClassName}>
        {items.map((item, index) => {
          const Icon = serviceIcons[index % serviceIcons.length];

          return (
            <article key={item.title} className={`flex h-full flex-col rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 ${cardClassName}`}>
              <div className="flex items-start justify-between gap-4">
                <span className={`flex size-11 items-center justify-center rounded-xl ${iconClassName}`}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${badgeClassName}`}>
                  {item.badge}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-stone-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-stone-600 md:text-base">{item.description}</p>
              {item.details.length ? (
                <ul className="mt-5 space-y-3 text-sm text-stone-700">
                  {item.details.map((detail) => (
                    <li key={detail} className="flex gap-3">
                      <Check className="mt-1 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <Link href={item.ctaLink} className={`mt-auto inline-flex pt-6 text-sm font-semibold ${ctaClassName}`}>
                {item.ctaText}
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
