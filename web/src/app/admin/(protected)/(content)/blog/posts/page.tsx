import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickCreateBlogPostForm } from "@/features/admin/components/blog/quick-create-blog-post-form";
import { requireAdmin } from "@/lib/auth";
import { listAllBlogCategories, listAllBlogPosts } from "@/features/blog/server/service";
import { ROUTES } from "@/lib/routes";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export default async function AdminBlogPostsPage() {
  await requireAdmin();
  const [posts, categories] = await Promise.all([listAllBlogPosts(), listAllBlogCategories()]);
  const publishedCount = posts.filter((post) => post.status === "published").length;
  const draftCount = posts.length - publishedCount;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Blog Posts</h1>
        <p className="text-sm text-muted-foreground">Quản lý bài viết blog, danh mục gắn kèm và trạng thái xuất bản.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tổng bài viết</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{posts.length}</CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Published</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{publishedCount}</CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Draft</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{draftCount}</CardContent>
        </Card>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Tạo bài viết nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <QuickCreateBlogPostForm categories={categories} />
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Danh sách bài viết</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-3 pr-4 font-medium">Title</th>
                  <th className="py-3 pr-4 font-medium">Slug</th>
                  <th className="py-3 pr-4 font-medium">Category</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="py-3 pr-4 font-medium">Updated</th>
                  <th className="py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">{post.title}</td>
                    <td className="py-3 pr-4">{post.slug}</td>
                    <td className="py-3 pr-4">{post.categoryName}</td>
                    <td className="py-3 pr-4">{post.status}</td>
                    <td className="py-3 pr-4">{formatDate(post.updatedAt)}</td>
                    <td className="py-3 text-right">
                      <Link href={ROUTES.ADMIN.BLOG_POST(post.slug)} className="inline-flex rounded-md border px-3 py-2 font-medium transition hover:bg-muted">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
