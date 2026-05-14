import { CheckCircle2, FileText, Newspaper, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4" />
            Tạo Blog Post
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tạo Blog Post</DialogTitle>
              <DialogDescription>Tạo bài viết mới ngay tại đây, không cần chuyển sang trang khác.</DialogDescription>
            </DialogHeader>
            <QuickCreateBlogPostForm categories={categories} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Tổng bài viết</CardTitle>
            <Newspaper className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{posts.length}</p>
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
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{draftCount}</p>
          </CardContent>
        </Card>
      </div>

      <AdminBlogPostsTable posts={posts} categories={categories} />
    </section>
  );
}
