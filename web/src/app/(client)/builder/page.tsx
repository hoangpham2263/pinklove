import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/features/products/components/product-card";
import { listPublishedProductsByType } from "@/lib/products";
import { ROUTES } from "@/lib/routes";

export default async function BuilderLandingPage() {
  const user = await getCurrentUser();
  const builderProducts = await listPublishedProductsByType("builder_template");

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-12">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[4px] text-muted-foreground">Tự tạo thiệp</p>
        <h1 className="text-4xl font-semibold tracking-tight">Bắt đầu một mẫu thiệp cưới tùy biến</h1>
        <p className="max-w-3xl text-muted-foreground">
          Luồng này tạo một `wedding_site` kiểu builder. Hiện tại builder đang ở mức section-based foundation để chuẩn bị cho giao diện kéo-thả sau này.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {builderProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            href={ROUTES.WEDDING.BUILDER(product.slug)}
            ctaLabel="Chọn starter"
          />
        ))}
      </div>

      {!user && (
        <div className="flex flex-wrap gap-3">
          <Button render={<Link href={ROUTES.AUTH.LOGIN}>Đăng nhập để bắt đầu</Link>} />
          <Button variant="outline" render={<Link href={ROUTES.AUTH.REGISTER}>Đăng ký tài khoản</Link>} />
        </div>
      )}
    </section>
  );
}
