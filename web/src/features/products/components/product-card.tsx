import Image from "next/image";
import Link from "next/link";
import {
  GuestLinkButton,
  GuestPanel,
  GuestPanelBody,
  GuestPanelHeader,
  GuestPanelTitle,
} from "@/app/(guest)/_components/guest-ui";
import type { Product } from "@/features/products/types";
import { getInvitationTemplateLabel } from "@/features/invitations/templates/registry";
import { LoopProductCardImage } from "@/features/products/components/loop-product-card-image";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

export function LoopProductCard({
  product,
  href = ROUTES.CATALOG.TEMPLATE(product.slug),
  ctaLabel = "Xem chi tiết",
  variant = "default",
  className,
  imageClassName,
}: {
  product: Product;
  href?: string;
  ctaLabel?: string;
  variant?: "default" | "gallery";
  className?: string;
  imageClassName?: string;
}) {
  if (variant === "gallery") {
    return (
      <Link
        href={href}
        className={cn(
          "group relative block h-[24rem] w-[15rem] overflow-hidden rounded-[22px] border border-[#efe8ea] bg-white p-0 shadow-[0_18px_40px_rgba(35,31,39,0.1)]",
          className
        )}
      >
        {product.thumbnailUrl ? (
          <LoopProductCardImage
            src={product.thumbnailUrl}
            alt={product.name}
            className={imageClassName}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-stone-50 text-stone-400">
            Preview
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#231f27]/82 via-[#231f27]/32 to-transparent px-5 pb-5 pt-16 text-left text-white">
          <h3 className="text-lg font-bold leading-tight">{product.name}</h3>
          <p className="mt-1 text-sm text-white/88">
            {product.excerpt || getInvitationTemplateLabel(product.templateKey)}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <GuestPanel className={cn("flex h-full flex-col", className)}>
      <GuestPanelHeader>
        <GuestPanelTitle>{product.name}</GuestPanelTitle>
        <p className="mt-2 text-sm text-stone-500">{getInvitationTemplateLabel(product.templateKey)}</p>
      </GuestPanelHeader>
      <GuestPanelBody className="flex flex-1 flex-col gap-4">
        {product.thumbnailUrl ? (
          <Image
            src={product.thumbnailUrl}
            alt={product.name}
            width={800}
            height={600}
            className={cn("aspect-[4/3] w-full rounded-xl object-cover lg:rounded-2xl", imageClassName)}
          />
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-stone-400 lg:rounded-2xl">
            Preview
          </div>
        )}
        <p className="text-sm leading-6 text-stone-600">
          {product.excerpt || "Mẫu thiệp sẵn sàng để bạn chỉnh sửa và xuất bản nhanh."}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <div>
            <p className="text-xs uppercase tracking-[3px] text-stone-400">Giá</p>
            <p className="mt-1 font-medium text-stone-900">{product.price.toLocaleString("vi-VN")}đ</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[3px] text-stone-400">Loại</p>
            <p className="mt-1 font-medium text-stone-900">
              {product.productType === "coded_template" ? "Thiếp mẫu sẵn" : "Tự tạo thiệp"}
            </p>
          </div>
          <GuestLinkButton href={href}>{ctaLabel}</GuestLinkButton>
        </div>
      </GuestPanelBody>
    </GuestPanel>
  );
}
