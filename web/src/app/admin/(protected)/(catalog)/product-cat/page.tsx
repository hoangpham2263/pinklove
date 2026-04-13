import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AdminProductCategoriesTable } from "@/features/products/admin/admin-product-categories-table";
import { QuickCreateProductCategoryForm } from "@/features/products/admin/quick-create-product-category-form";
import { requireAdmin } from "@/lib/auth";
import { listAllProductCategories, listAllProducts } from "@/features/products/server/service";
import { Plus } from "lucide-react";

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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Product Cat</h1>
        </div>
        <Dialog>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4" />
            Tạo Product Cat
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Tạo Product Cat</DialogTitle>
              <DialogDescription>Tạo Product Cat mới ngay tại đây, không cần chuyển sang trang khác.</DialogDescription>
            </DialogHeader>
            <QuickCreateProductCategoryForm />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tổng Product Cat</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{categories.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{publishedCount}</p>
            <p className="text-sm text-muted-foreground">Draft: {draftCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Đã gắn sản phẩm</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{assignedCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Chưa gắn Product Cat</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{unassignedCount}</p>
          </CardContent>
        </Card>
      </div>

      <AdminProductCategoriesTable
        categories={categories}
        productCountByCategory={productCountByCategory}
      />
    </section>
  );
}
