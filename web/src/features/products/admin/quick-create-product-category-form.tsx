"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NativeForm } from "@/components/common/native-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import { slugify } from "@/lib/utils";

type QuickCreateProductCategoryFormProps = {
  onCreated?: () => void;
};

export function QuickCreateProductCategoryForm({ onCreated }: QuickCreateProductCategoryFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [isSlugEdited, setIsSlugEdited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await adminApi.createProductCategory(new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã tạo Product Cat.");
      setName("");
      setSlug("");
      setDescription("");
      setStatus("draft");
      setIsSlugEdited(false);
      onCreated?.();
      finishMutation(router, result, { redirect: false, refresh: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo Product Cat.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <NativeForm action={adminApiActions.createProductCategory} method="POST" className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="font-medium text-sm">Tên Product Cat</label>
        <Input
          name="name"
          value={name}
          onChange={(event) => {
            const next = event.target.value;
            setName(next);
            if (!isSlugEdited) {
              setSlug(slugify(next));
            }
          }}
          required
        />
      </div>
      <div className="space-y-2">
        <label className="font-medium text-sm">Slug</label>
        <Input
          name="slug"
          value={slug}
          onChange={(event) => {
            setSlug(event.target.value);
            setIsSlugEdited(true);
          }}
          required
        />
      </div>
      <div className="space-y-2">
        <label className="font-medium text-sm">Mô tả</label>
        <textarea
          name="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      <div className="space-y-2">
        <label className="font-medium text-sm">Trạng thái</label>
        <select
          name="status"
          value={status}
          onChange={(event) => setStatus(event.target.value as "draft" | "published")}
          className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="draft">draft</option>
          <option value="published">published</option>
        </select>
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Đang tạo..." : "Tạo Product Cat"}
      </Button>
    </NativeForm>
  );
}
