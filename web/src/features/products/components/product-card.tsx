import Image from "next/image";
import {
  ClientLinkButton,
  ClientPanel,
  ClientPanelBody,
  ClientPanelHeader,
  ClientPanelTitle,
} from "@/app/(client)/_components/client-ui";
import type { Product } from "@/features/products/types";
import { getWeddingTemplateLabel } from "@/features/sites/templates/registry";
import { ROUTES } from "@/lib/routes";

export function ProductCard({
  product,
  href = ROUTES.WEDDING.TEMPLATE(product.slug),
  ctaLabel = "Xem chi tiết",
}: {
  product: Product;
  href?: string;
  ctaLabel?: string;
}) {
  return (
    <ClientPanel className="flex h-full flex-col">
      <ClientPanelHeader>
        <ClientPanelTitle>{product.name}</ClientPanelTitle>
        <p className="mt-2 text-sm text-stone-500">{getWeddingTemplateLabel(product.templateKey)}</p>
      </ClientPanelHeader>
      <ClientPanelBody className="flex flex-1 flex-col gap-4">
        {product.thumbnailUrl ? (
          <Image
            src={product.thumbnailUrl}
            alt={product.name}
            width={800}
            height={600}
            className="aspect-[4/3] w-full rounded-xl object-cover lg:rounded-2xl"
          />
        ) : (
          <div className="flex aspect-[4/3] w-full rounded-xl border border-stone-200 bg-stone-50 text-stone-400 lg:rounded-2xl items-center justify-center">
            Preview
          </div>
        )}
        <p className="text-sm leading-6 text-stone-600">
          {product.excerpt || "Mẫu thiệp sẵn sàng để bạn chỉnh sửa và xuất bản nhanh."}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <div>
            <p className="text-xs uppercase tracking-[3px] text-stone-400">Loại</p>
            <p className="mt-1 font-medium text-stone-900">
              {product.productType === "coded_template" ? "Thiếp mẫu sẵn" : "Tự tạo thiệp"}
            </p>
          </div>
          <ClientLinkButton href={href}>{ctaLabel}</ClientLinkButton>
        </div>
      </ClientPanelBody>
    </ClientPanel>
  );
}
