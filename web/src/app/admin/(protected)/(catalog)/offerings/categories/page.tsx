import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminDialogCreateTrigger } from "@/features/admin/components/admin-buttons";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { AdminOfferingCategoriesTable } from "@/features/offerings/admin/admin-offering-categories-table";
import { QuickCreateOfferingCategoryForm } from "@/features/offerings/admin/quick-create-offering-category-form";
import { requireAdmin } from "@/lib/auth";
import { listAllOfferingCategories, listAllOfferings } from "@/features/offerings/server/service";
import { CheckCircle2, FolderTree, PackageCheck, PackageX } from "lucide-react";

export default async function AdminOfferingCatPage() {
  await requireAdmin();
  const [categories, offerings] = await Promise.all([listAllOfferingCategories(), listAllOfferings()]);
  const publishedCount = categories.filter((category) => category.status === "published").length;
  const draftCount = categories.length - publishedCount;
  const assignedCount = offerings.filter((offering) => offering.categoryId).length;
  const unassignedCount = offerings.length - assignedCount;
  const offeringCountByCategory = offerings.reduce<Record<string, number>>((acc, offering) => {
    if (offering.categoryId) {
      acc[offering.categoryId] = (acc[offering.categoryId] ?? 0) + 1;
    }
    return acc;
  }, {});

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <AdminOverviewGrid>
        <AdminOverviewCard title="Total" value={categories.length} icon={FolderTree} />
        <AdminOverviewCard title="Published" value={publishedCount} description={`Draft: ${draftCount}`} icon={CheckCircle2} />
        <AdminOverviewCard title="Đã gắn sản phẩm" value={assignedCount} icon={PackageCheck} />
        <AdminOverviewCard title="Chưa gắn Offering Cat" icon={PackageX} contentClassName="flex items-center justify-between gap-3">
            <p>{unassignedCount}</p>
            <Dialog>
              <AdminDialogCreateTrigger>
                Tạo Offering Cat
              </AdminDialogCreateTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Tạo Offering Cat</DialogTitle>
                  <DialogDescription>Tạo Offering Cat mới ngay tại đây, không cần chuyển sang trang khác.</DialogDescription>
                </DialogHeader>
                <QuickCreateOfferingCategoryForm />
              </DialogContent>
            </Dialog>
        </AdminOverviewCard>
      </AdminOverviewGrid>

      <AdminOfferingCategoriesTable
        categories={categories}
        offeringCountByCategory={offeringCountByCategory}
      />
    </section>
  );
}
