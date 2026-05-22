"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NativeForm } from "@/components/common/native-form";
import { AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { Input } from "@/components/ui/input";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import { slugify } from "@/lib/utils";

type QuickCreateOfferingCategoryFormProps = {
  onCreated?: () => void;
};

export function QuickCreateOfferingCategoryForm({ onCreated }: QuickCreateOfferingCategoryFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await adminApi.createOfferingCategory(new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã tạo Offering Cat.");
      setName("");
      setSlug("");
      setDescription("");
      setStatus("draft");
      onCreated?.();
      finishMutation(router, result, { redirect: false, refresh: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo Offering Cat.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <NativeForm action={adminApiActions.createOfferingCategory} method="POST" className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm">Tên Offering Cat</label>
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
        <label className="text-sm">Slug</label>
        <Input
          name="slug"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm">Mô tả</label>
        <textarea
          name="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm">Trạng thái</label>
        <select
          name="status"
          value={status}
          onChange={(event) => setStatus(event.target.value as "draft" | "published")}
          className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
        >
          <option value="draft">draft</option>
          <option value="published">published</option>
        </select>
      </div>
      <AdminSubmitButton className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Đang tạo..." : "Tạo Offering Cat"}
      </AdminSubmitButton>
    </NativeForm>
  );
}
