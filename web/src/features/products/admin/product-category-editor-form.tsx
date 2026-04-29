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
import { slugify } from "@/lib/utils";
import type { ProductCategory } from "@/features/products/types";

export function ProductCategoryEditorForm({ category }: { category: ProductCategory }) {
  const router = useRouter();
  const [name, setName] = useState(category.name);
  const [slug, setSlug] = useState(category.slug);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const result = await adminApi.updateProductCategory(new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã lưu Product Cat.");
      finishMutation(router, result, { redirect: "replace", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu Product Cat.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Bạn có chắc chắn muốn xóa Product Cat: ${category.name}?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const formData = new FormData();
      formData.append("slug", category.slug);
      const result = await adminApi.deleteProductCategory(formData);
      toast.success(result.message ?? "Đã xóa Product Cat.");
      finishMutation(router, result, { redirect: "push", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa Product Cat.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <NativeForm action={adminApiActions.updateProductCategory} method="POST" className="grid gap-6 lg:grid-cols-12" onSubmit={handleSave}>
      <input type="hidden" name="originalSlug" value={category.slug} />

      <Card className="rounded-lg lg:col-span-9">
        <CardHeader>
          <CardTitle>Thông tin Product Cat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="font-medium">Tên Product Cat</label>
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
            {isSaving ? "Đang lưu..." : "Lưu Product Cat"}
          </Button>
          <Button type="button" variant="destructive" className="w-full" disabled={isDeleting} onClick={() => void handleDelete()}>
            {isDeleting ? "Đang xóa..." : "Xóa Product Cat"}
          </Button>
        </CardContent>
      </Card>
    </NativeForm>
  );
}
