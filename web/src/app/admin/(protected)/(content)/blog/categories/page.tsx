import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BlogCategory } from "@/features/blog/types";
import { QuickCreateBlogCategoryForm } from "@/features/admin/components/blog/quick-create-blog-category-form";
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
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Blog Categories</h1>
        <p className="text-sm text-muted-foreground">Quản lý danh mục blog, mô tả và số lượng bài viết gắn với từng danh mục.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tổng danh mục</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{categories.length}</CardContent>
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
          <CardTitle>Tạo danh mục nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <QuickCreateBlogCategoryForm />
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Danh sách danh mục</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-3 pr-4 font-medium">Name</th>
                  <th className="py-3 pr-4 font-medium">Slug</th>
                  <th className="py-3 pr-4 font-medium">Posts</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="py-3 pr-4 font-medium">Updated</th>
                  <th className="py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category: BlogCategory) => (
                  <tr key={category.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">{category.name}</td>
                    <td className="py-3 pr-4">{category.slug}</td>
                    <td className="py-3 pr-4">{postCountByCategory[category.id] ?? 0}</td>
                    <td className="py-3 pr-4">{category.status}</td>
                    <td className="py-3 pr-4">{formatDate(category.updatedAt)}</td>
                    <td className="py-3 text-right">
                      <Link href={ROUTES.ADMIN.BLOG_CATEGORY(category.slug)} className="inline-flex rounded-md border px-3 py-2 font-medium transition hover:bg-muted">
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
