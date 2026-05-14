import { CheckCircle2, FilePenLine, FolderTree, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4" />
            Tạo Blog Category
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Tạo Blog Category</DialogTitle>
              <DialogDescription>Tạo danh mục blog mới ngay tại đây, không cần chuyển sang trang khác.</DialogDescription>
            </DialogHeader>
            <QuickCreateBlogCategoryForm />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FolderTree className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{categories.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{publishedCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <FilePenLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{draftCount}</p>
          </CardContent>
        </Card>
      </div>

      <AdminBlogCategoriesTable categories={categories} postCountByCategory={postCountByCategory} />
    </section>
  );
}
