import { requireAdmin } from "@/lib/auth";
import { listAllProductCategories } from "@/features/products/server/service";
import { QuickCreateProductForm } from "@/features/products/admin/quick-create-product-form";

export default async function AdminProductCreatePage() {
  await requireAdmin();
  const categories = await listAllProductCategories();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="space-y-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Product</h1>
          <p className="text-sm text-muted-foreground">Tạo sản phẩm mới và cấu hình thông tin cơ bản.</p>
        </div>
      </div>
      <QuickCreateProductForm categories={categories} />
    </section>
  );
}
