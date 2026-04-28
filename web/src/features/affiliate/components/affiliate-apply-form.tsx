"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NativeForm } from "@/components/common/native-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { customerApi, customerApiActions } from "@/lib/api-client.customer";
import { finishMutation } from "@/lib/client-mutation";

export function AffiliateApplyForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await customerApi.applyAffiliate(new FormData(event.currentTarget));
      toast.success(result.message ?? "Yêu cầu tham gia affiliate đã được gửi.");
      finishMutation(router, result, { redirect: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xử lý yêu cầu affiliate.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <NativeForm action={customerApiActions.applyAffiliate} method="POST" className="grid gap-4 md:grid-cols-[1fr_auto]" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label htmlFor="preferredCode" className="font-medium">
          Mã affiliate mong muốn
        </label>
        <Input id="preferredCode" name="preferredCode" placeholder="ví dụ: quoc-hoang" />
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang gửi..." : "Đăng ký affiliate"}
        </Button>
      </div>
    </NativeForm>
  );
}
