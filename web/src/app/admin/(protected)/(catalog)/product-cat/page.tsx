import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminDialogCreateTrigger } from "@/features/admin/components/admin-buttons";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { AdminProductCategoriesTable } from "@/features/products/admin/admin-product-categories-table";
import { QuickCreateProductCategoryForm } from "@/features/products/admin/quick-create-product-category-form";
import { requireAdmin } from "@/lib/auth";
import { listAllProductCategories, listAllProducts } from "@/features/products/server/service";
import { CheckCircle2, FolderTree, PackageCheck, PackageX } from "lucide-react";

export default async function AdminProductCatPage() {
  await requireAdmin();
  const [categories, products] = await Promise.all([listAllProductCategories(), listAllProducts()]);
  const publishedCount = categories.filter((category) => category.status === "published").length;
  const draftCount = categories.length - publishedCount;
  const assignedCount = products.filter((product) => product.categoryId).length;
  const unassignedCount = products.length - assignedCount;
  const productCountByCategory = products.reduce<Record<string, number>>((acc, product) => {
    if (product.categoryId) {
      acc[product.categoryId] = (acc[product.categoryId] ?? 0) + 1;
    }
    return acc;
  }, {});

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <AdminOverviewGrid>
        <AdminOverviewCard title="Total" value={categories.length} icon={FolderTree} />
        <AdminOverviewCard title="Published" value={publishedCount} description={`Draft: ${draftCount}`} icon={CheckCircle2} />
        <AdminOverviewCard title="Đã gắn sản phẩm" value={assignedCount} icon={PackageCheck} />
        <AdminOverviewCard title="Chưa gắn Product Cat" icon={PackageX} contentClassName="flex items-center justify-between gap-3">
            <p>{unassignedCount}</p>
            <Dialog>
              <AdminDialogCreateTrigger>
                Tạo Product Cat
              </AdminDialogCreateTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Tạo Product Cat</DialogTitle>
                  <DialogDescription>Tạo Product Cat mới ngay tại đây, không cần chuyển sang trang khác.</DialogDescription>
                </DialogHeader>
                <QuickCreateProductCategoryForm />
              </DialogContent>
            </Dialog>
        </AdminOverviewCard>
      </AdminOverviewGrid>

      <AdminProductCategoriesTable
        categories={categories}
        productCountByCategory={productCountByCategory}
      />
    </section>
  );
}
