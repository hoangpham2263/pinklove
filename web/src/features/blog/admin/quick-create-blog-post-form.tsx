"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NativeForm } from "@/components/common/native-form";
import { Input } from "@/components/ui/input";
import { AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { MediaSelector } from "@/features/media/components/media-selector";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import { slugify } from "@/lib/utils";
import type { BlogCategory } from "@/features/blog/types";

type QuickCreateBlogPostFormProps = {
  categories: BlogCategory[];
  onCreated?: () => void;
};

export function QuickCreateBlogPostForm({ categories, onCreated }: QuickCreateBlogPostFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await adminApi.createBlogPost(new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã tạo blog post.");
      setTitle("");
      setSlug("");
      setExcerpt("");
      setContent("");
      setCoverImage("");
      setStatus("draft");
      onCreated?.();
      finishMutation(router, result, { redirect: false, refresh: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo blog post.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <NativeForm action={adminApiActions.createBlogPost} method="POST" className="space-y-4" onSubmit={handleSubmit}>
      <input type="hidden" name="coverImage" value={coverImage} />
      <div className="space-y-2">
        <label className="font-medium text-sm">Tiêu đề</label>
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
        <label className="font-medium text-sm">Slug</label>
        <Input
          name="slug"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <label className="font-medium text-sm">Danh mục</label>
        <select
          name="categoryId"
          className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
          required
        >
          <option value="">Chọn danh mục</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="font-medium text-sm">Trạng thái</label>
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
      <div className="space-y-2">
        <label className="font-medium text-sm">Mô tả ngắn</label>
        <textarea
          name="excerpt"
          value={excerpt}
          onChange={(event) => setExcerpt(event.target.value)}
          className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
        />
      </div>
      <div className="space-y-2">
        <label className="font-medium text-sm">Nội dung</label>
        <textarea
          name="content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="min-h-36 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
        />
      </div>
      <div className="space-y-2">
        <label className="font-medium text-sm">Ảnh cover</label>
        <MediaSelector value={coverImage} onChange={setCoverImage} />
      </div>
      <AdminSubmitButton className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Đang tạo..." : "Tạo bài viết"}
      </AdminSubmitButton>
    </NativeForm>
  );
}
