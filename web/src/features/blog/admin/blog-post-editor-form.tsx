"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NativeForm } from "@/components/common/native-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MediaSelector } from "@/features/media/components/media-selector";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import { slugify } from "@/lib/utils";
import type { BlogCategory, BlogPost } from "@/features/blog/types";

export function BlogPostEditorForm({ post, categories }: { post: BlogPost; categories: BlogCategory[] }) {
  const router = useRouter();
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [coverImage, setCoverImage] = useState(post.coverImage || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const result = await adminApi.updateBlogPost(new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã lưu bài viết.");
      finishMutation(router, result, { redirect: "replace", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu bài viết.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Bạn có chắc chắn muốn xóa bài viết: ${post.title}?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const formData = new FormData();
      formData.append("slug", post.slug);
      const result = await adminApi.deleteBlogPost(formData);
      toast.success(result.message ?? "Đã xóa bài viết.");
      finishMutation(router, result, { redirect: "push", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa bài viết.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <NativeForm action={adminApiActions.updateBlogPost} method="POST" className="grid gap-6 lg:grid-cols-12" onSubmit={handleSave}>
      <input type="hidden" name="originalSlug" value={post.slug} />
      <input type="hidden" name="coverImage" value={coverImage} />

      <Card className="rounded-lg lg:col-span-9">
        <CardHeader>
          <CardTitle>Thông tin bài viết</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="font-medium">Tiêu đề</label>
              <Input
                name="title"
                value={title}
                onChange={(event) => {
                  const next = event.target.value;
                  setTitle(next);
                  setSlug(slugify(next));
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="font-medium">Slug</label>
              <Input name="slug" value={slug} onChange={(event) => setSlug(event.target.value)} required />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="font-medium">Danh mục</label>
              <select
                name="categoryId"
                defaultValue={post.categoryId}
                className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                required
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="font-medium">Trạng thái</label>
              <select
                name="status"
                defaultValue={post.status}
                className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="draft">draft</option>
                <option value="published">published</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="font-medium">Mô tả ngắn</label>
            <textarea
              name="excerpt"
              defaultValue={post.excerpt}
              className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label className="font-medium">Nội dung</label>
            <textarea
              name="content"
              defaultValue={post.content}
              className="min-h-56 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6 lg:col-span-3">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Ảnh cover</CardTitle>
          </CardHeader>
          <CardContent>
            <MediaSelector value={coverImage} onChange={setCoverImage} />
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Thao tác</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? "Đang lưu..." : "Lưu bài viết"}
            </Button>
            <Button type="button" variant="destructive" className="w-full" disabled={isDeleting} onClick={() => void handleDelete()}>
              {isDeleting ? "Đang xóa..." : "Xóa bài viết"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </NativeForm>
  );
}
