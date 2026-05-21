import { CheckCircle2, FilePenLine, FolderTree } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminDialogCreateTrigger } from "@/features/admin/components/admin-buttons";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { AdminBlogCategoriesTable } from "@/features/blog/admin/admin-blog-categories-table";
import { QuickCreateBlogCategoryForm } from "@/features/blog/admin/quick-create-blog-category-form";
import { requireAdmin } from "@/lib/auth";
import { listAllBlogCategories, listAllBlogPosts } from "@/features/blog/server/service";

export default async function AdminBlogCategoriesPage() {
  await requireAdmin();
  const [categories, posts] = await Promise.all([listAllBlogCategories(), listAllBlogPosts()]);
  const publishedCount = categories.filter((category) => category.status === "published").length;
  const draftCount = categories.length - publishedCount;
  const postCountByCategory = posts.reduce<Record<string, number>>((acc, post) => {
    acc[post.categoryId] = (acc[post.categoryId] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blog Categories</h1>
        </div>
        <Dialog>
          <AdminDialogCreateTrigger>
            Tạo Blog Category
          </AdminDialogCreateTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Tạo Blog Category</DialogTitle>
              <DialogDescription>Tạo danh mục blog mới ngay tại đây, không cần chuyển sang trang khác.</DialogDescription>
            </DialogHeader>
            <QuickCreateBlogCategoryForm />
          </DialogContent>
        </Dialog>
      </div>

      <AdminOverviewGrid className="md:grid-cols-3 lg:grid-cols-3">
        <AdminOverviewCard title="Total" value={categories.length} icon={FolderTree} />
        <AdminOverviewCard title="Published" value={publishedCount} icon={CheckCircle2} />
        <AdminOverviewCard title="Draft" value={draftCount} icon={FilePenLine} />
      </AdminOverviewGrid>

      <AdminBlogCategoriesTable categories={categories} postCountByCategory={postCountByCategory} />
    </section>
  );
}
