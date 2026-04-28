"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NativeForm } from "@/components/common/native-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import type { BlogCategory } from "@/features/blog/types";

export function BlogCategoryEditorForm({ category }: { category: BlogCategory }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const result = await adminApi.updateBlogCategory(new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã lưu danh mục.");
      finishMutation(router, result, { redirect: "replace", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu danh mục.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Bạn có chắc chắn muốn xóa danh mục: ${category.name}?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const formData = new FormData();
      formData.append("slug", category.slug);
      const result = await adminApi.deleteBlogCategory(formData);
      toast.success(result.message ?? "Đã xóa danh mục.");
      finishMutation(router, result, { redirect: "push", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa danh mục.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <NativeForm action={adminApiActions.updateBlogCategory} method="POST" className="grid gap-6 lg:grid-cols-12" onSubmit={handleSave}>
      <input type="hidden" name="originalSlug" value={category.slug} />

      <Card className="rounded-lg lg:col-span-9">
        <CardHeader>
          <CardTitle>Thông tin danh mục</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="font-medium">Tên danh mục</label>
              <Input name="name" defaultValue={category.name} required />
            </div>
            <div className="space-y-2">
              <label className="font-medium">Slug</label>
              <Input name="slug" defaultValue={category.slug} required />
            </div>
          </div>
          <div className="space-y-2">
            <label className="font-medium">Mô tả</label>
            <textarea
              name="description"
              defaultValue={category.description}
              className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg lg:col-span-3 lg:self-start">
        <CardHeader>
          <CardTitle>Xuất bản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="font-medium">Trạng thái</label>
            <select
              name="status"
              defaultValue={category.status}
              className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
          </div>
          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? "Đang lưu..." : "Lưu danh mục"}
          </Button>
          <Button type="button" variant="destructive" className="w-full" disabled={isDeleting} onClick={() => void handleDelete()}>
            {isDeleting ? "Đang xóa..." : "Xóa danh mục"}
          </Button>
        </CardContent>
      </Card>
    </NativeForm>
  );
}
