import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Product } from "@/features/products/types";
import { getWeddingTemplateLabel } from "@/features/sites/templates";
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
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{product.name}</CardTitle>
        <p className="text-sm text-muted-foreground">{getWeddingTemplateLabel(product.templateKey)}</p>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {product.thumbnailUrl ? (
          <img src={product.thumbnailUrl} alt={product.name} className="aspect-[4/3] w-full rounded-xl object-cover" />
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl border bg-muted/30 text-muted-foreground">
            Preview
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          {product.excerpt || "Mẫu thiệp sẵn sàng để bạn chỉnh sửa và xuất bản nhanh."}
        </p>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[3px] text-muted-foreground">Loại</p>
          <p className="font-medium">{product.productType === "coded_template" ? "Thiếp mẫu sẵn" : "Tự tạo thiệp"}</p>
        </div>
        <Button render={<Link href={href}>{ctaLabel}</Link>} />
      </CardFooter>
    </Card>
  );
}
