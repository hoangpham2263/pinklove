"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NativeForm } from "@/components/common/native-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminDeleteButton, AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { AdminField, AdminInput, AdminSelect, AdminTextarea } from "@/features/admin/components/admin-form";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import { slugify } from "@/lib/utils";
import type { BlogCategory } from "@/features/blog/types";

export function BlogCategoryEditorForm({ category }: { category: BlogCategory }) {
  const router = useRouter();
  const [name, setName] = useState(category.name);
  const [slug, setSlug] = useState(category.slug);
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
            <AdminField label="Tên danh mục">
              <AdminInput
                name="name"
                value={name}
                onChange={(event) => {
                  const next = event.target.value;
                  setName(next);
                  setSlug(slugify(next));
                }}
                required
              />
            </AdminField>
            <AdminField label="Slug">
              <AdminInput name="slug" value={slug} onChange={(event) => setSlug(event.target.value)} required />
            </AdminField>
          </div>
          <AdminField label="Mô tả">
            <AdminTextarea
              name="description"
              defaultValue={category.description}
              className="min-h-32"
            />
          </AdminField>
        </CardContent>
      </Card>

      <Card className="rounded-lg lg:col-span-3 lg:self-start">
        <CardHeader>
          <CardTitle>Xuất bản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AdminField label="Trạng thái">
            <AdminSelect
              name="status"
              defaultValue={category.status}
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
            </AdminSelect>
          </AdminField>
          <AdminSubmitButton className="w-full" disabled={isSaving}>
            {isSaving ? "Đang lưu..." : "Lưu danh mục"}
          </AdminSubmitButton>
          <AdminDeleteButton className="w-full" disabled={isDeleting} onClick={() => void handleDelete()}>
            {isDeleting ? "Đang xóa..." : "Xóa danh mục"}
          </AdminDeleteButton>
        </CardContent>
      </Card>
    </NativeForm>
  );
}
