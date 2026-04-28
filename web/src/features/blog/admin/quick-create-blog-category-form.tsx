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

export function QuickCreateBlogCategoryForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugEdited, setIsSlugEdited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await adminApi.createBlogCategory(new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã tạo blog category.");
      finishMutation(router, result, { redirect: "push", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo blog category.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <NativeForm action={adminApiActions.createBlogCategory} method="POST" className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="font-medium text-sm">Tên danh mục</label>
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
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Đang tạo..." : "Tạo danh mục"}
      </Button>
    </NativeForm>
  );
}
