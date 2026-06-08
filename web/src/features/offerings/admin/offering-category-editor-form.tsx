"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NativeForm } from "@/components/common/native-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminDeleteButton, AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import { slugify } from "@/lib/utils";
import type { OfferingCategory } from "@/features/offerings/types";

export function OfferingCategoryEditorForm({ category }: { category: OfferingCategory }) {
  const router = useRouter();
  const [name, setName] = useState(category.name);
  const [slug, setSlug] = useState(category.slug);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const result = await adminApi.updateOfferingCategory(new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã lưu Offering Cat.");
      finishMutation(router, result, { redirect: "replace", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu Offering Cat.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Bạn có chắc chắn muốn xóa Offering Cat: ${category.name}?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const formData = new FormData();
      formData.append("slug", category.slug);
      const result = await adminApi.deleteOfferingCategory(formData);
      toast.success(result.message ?? "Đã xóa Offering Cat.");
      finishMutation(router, result, { redirect: "push", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa Offering Cat.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <NativeForm action={adminApiActions.updateOfferingCategory} method="POST" className="grid gap-6 lg:grid-cols-12" onSubmit={handleSave}>
      <input type="hidden" name="originalSlug" value={category.slug} />

      <Card className="rounded-lg lg:col-span-9">
        <CardHeader>
          <CardTitle>Thông tin Offering Cat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="font-medium">Tên Offering Cat</label>
              <Input
                name="name"
                value={name}
                onChange={(event) => {
                  const next = event.target.value;
                  setName(next);
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
          <div className="space-y-2">
            <label className="font-medium">Mô tả</label>
            <textarea
              name="description"
              defaultValue={category.description}
              className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
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
              className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <AdminSubmitButton className="w-full" disabled={isSaving}>
            {isSaving ? "Đang lưu..." : "Lưu Offering Cat"}
          </AdminSubmitButton>
          <AdminDeleteButton className="w-full" disabled={isDeleting} onClick={() => void handleDelete()}>
            {isDeleting ? "Đang xóa..." : "Xóa Offering Cat"}
          </AdminDeleteButton>
        </CardContent>
      </Card>
    </NativeForm>
  );
}
