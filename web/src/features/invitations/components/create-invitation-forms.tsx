"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NativeForm } from "@/components/common/native-form";
import { finishMutation, postForm } from "@/lib/client-mutation";

type CreateSiteFormProps = {
  action: string;
  productSlug: string;
  children: React.ReactNode;
};

function CreateSiteForm({ action, productSlug, children }: CreateSiteFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await postForm(action, new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã tạo thiệp mời.");
      finishMutation(router, result, { redirect: "push", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo thiệp mời.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <NativeForm action={action} method="POST" className="space-y-3" onSubmit={handleSubmit}>
      <input type="hidden" name="productSlug" value={productSlug} />
      <div aria-busy={isSubmitting}>{children}</div>
    </NativeForm>
  );
}

export function CreateFromProductForm({ action, productSlug, children }: CreateSiteFormProps) {
  return <CreateSiteForm action={action} productSlug={productSlug}>{children}</CreateSiteForm>;
}

export function CreateBuilderForm({ action, productSlug, children }: CreateSiteFormProps) {
  return <CreateSiteForm action={action} productSlug={productSlug}>{children}</CreateSiteForm>;
}
