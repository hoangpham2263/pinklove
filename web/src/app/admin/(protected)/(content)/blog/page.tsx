import { CheckCircle2, FileText, Newspaper } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminDialogCreateTrigger } from "@/features/admin/components/admin-buttons";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { AdminBlogPostsTable } from "@/features/blog/admin/admin-blog-posts-table";
import { QuickCreateBlogPostForm } from "@/features/blog/admin/quick-create-blog-post-form";
import { requireAdmin } from "@/lib/auth";
import { listAllBlogCategories, listAllBlogPosts } from "@/features/blog/server/service";

export default async function AdminBlogPostsPage() {
  await requireAdmin();
  const [posts, categories] = await Promise.all([listAllBlogPosts(), listAllBlogCategories()]);
  const publishedCount = posts.filter((post) => post.status === "published").length;
  const draftCount = posts.length - publishedCount;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blog Posts</h1>
        </div>
        <Dialog>
          <AdminDialogCreateTrigger>
            Tạo Blog Post
          </AdminDialogCreateTrigger>
          <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tạo Blog Post</DialogTitle>
              <DialogDescription>Tạo bài viết mới ngay tại đây, không cần chuyển sang trang khác.</DialogDescription>
            </DialogHeader>
            <QuickCreateBlogPostForm categories={categories} />
          </DialogContent>
        </Dialog>
      </div>

      <AdminOverviewGrid className="md:grid-cols-3 lg:grid-cols-3">
        <AdminOverviewCard title="Tổng bài viết" value={posts.length} icon={Newspaper} />
        <AdminOverviewCard title="Published" value={publishedCount} icon={CheckCircle2} />
        <AdminOverviewCard title="Draft" value={draftCount} icon={FileText} />
      </AdminOverviewGrid>

      <AdminBlogPostsTable posts={posts} categories={categories} />
    </section>
  );
}
