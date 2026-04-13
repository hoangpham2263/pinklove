import Image from "next/image";
import {
  GuestLinkButton,
  GuestPanel,
  GuestPanelBody,
  GuestPanelHeader,
  GuestPanelTitle,
} from "@/app/(guest)/_components/guest-ui";
import type { Product } from "@/features/products/types";
import { getInvitationTemplateLabel } from "@/features/invitations/templates/registry";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  href = ROUTES.CATALOG.TEMPLATE(product.slug),
  ctaLabel = "Xem chi tiết",
  className,
  imageClassName,
}: {
  product: Product;
  href?: string;
  ctaLabel?: string;
  className?: string;
  imageClassName?: string;
}) {
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
