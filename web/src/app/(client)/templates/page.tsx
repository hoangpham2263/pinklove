import { ProductCard } from "@/features/products/components/product-card";
import { listPublishedProducts } from "@/features/products/server/service";

export default async function TemplatesPage() {
  const products = await listPublishedProducts();
  const codedTemplates = products.filter((product) => product.productType === "coded_template");

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-12">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[4px] text-muted-foreground">Thiếp mẫu sẵn</p>
        <h1 className="text-4xl font-semibold tracking-tight">Chọn mẫu thiệp cưới được code sẵn</h1>
        <p className="max-w-3xl text-muted-foreground">
          Mỗi mẫu là một sản phẩm riêng. Khi tạo từ mẫu, hệ thống sẽ cấp cho bạn một website thiệp cưới riêng để chỉnh sửa nội dung theo schema của template đó.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {codedTemplates.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
