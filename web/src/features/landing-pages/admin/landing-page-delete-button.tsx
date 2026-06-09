"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NativeForm } from "@/components/common/native-form";
import { useConfirm } from "@/components/common/confirm-provider";
import { AdminTableActionButton } from "@/features/admin/components/admin-table-actions";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";

type LandingPageDeleteButtonProps = {
  landingPageId: string;
  landingPageName: string;
};

export function LandingPageDeleteButton({ landingPageId, landingPageName }: LandingPageDeleteButtonProps) {
  const router = useRouter();
  const confirm = useConfirm();

  return (
    <NativeForm
      action={adminApiActions.deleteLandingPage}
      method="POST"
      className="inline-block"
      onSubmit={async (event) => {
        event.preventDefault();
        const isConfirmed = await confirm({
          title: "Xóa landing",
          description: `Xóa “${landingPageName}” và dữ liệu liên quan?`,
          confirmText: "Xóa",
          cancelText: "Hủy",
          variant: "destructive",
        });
        if (!isConfirmed) {
          return;
        }

        try {
          const result = await adminApi.deleteLandingPage(new FormData(event.currentTarget));
          toast.success(result.message ?? "Đã xóa landing.");
          finishMutation(router, result, { redirect: false });
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Không thể xóa landing.");
        }
      }}
    >
      <input type="hidden" name="landingPageId" value={landingPageId} />
      <AdminTableActionButton action="delete" label="Xóa" type="submit" />
    </NativeForm>
  );
}
