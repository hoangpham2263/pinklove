"use client";

import { type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NativeForm } from "@/components/common/native-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { finishMutation, postForm } from "@/lib/client-mutation";
import { ROUTES } from "@/lib/routes";
import { BuilderEditorClient } from "@/features/invitations/builder/editor-client";
import { BuilderWorkspaceShell } from "@/features/invitations/builder/builder-workspace-shell";
import type { InvitationSite } from "@/features/invitations/types";

type BuilderInvitationFormProps = {
  invitation: InvitationSite;
  publicHref: string;
};

export function BuilderInvitationForm({ invitation, publicHref }: BuilderInvitationFormProps) {
  const router = useRouter();
  const data = invitation.customData;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const result = await postForm(ROUTES.API.CUSTOMER.INVITATIONS.UPDATE, new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã lưu.");
      finishMutation(router, result, { redirect: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lưu thất bại.");
    }
  }

  return (
    <NativeForm action={ROUTES.API.CUSTOMER.INVITATIONS.UPDATE} method="POST" className="flex min-h-screen flex-col" onSubmit={handleSubmit}>
      <input type="hidden" name="siteId" value={String(invitation.id)} />
      <input type="hidden" name="templateKey" value={invitation.templateKey} />

      <BuilderWorkspaceShell
        variant="fullscreen"
        editor={<BuilderEditorClient initialValue={data.builderDocument ?? data.builderCanvas} />}
        sidebar={
          <>
            <div className="space-y-3 border-b pb-4">
              <Button className="w-full" variant="outline" render={<Link href={ROUTES.CUSTOMER.INVITATIONS}>Quay lại</Link>} />
              <div className="space-y-1">
                <h1 className="truncate text-base font-semibold">{invitation.title}</h1>
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-medium">Tên thiệp</label>
              <Input name="title" defaultValue={invitation.title} placeholder="Tên thiệp" />
            </div>

            <div className="space-y-2">
              <label className="font-medium">Slug public</label>
              <Input name="slug" defaultValue={invitation.slug} placeholder="Slug public" />
            </div>

            <div className="space-y-2">
              <label className="font-medium">Trạng thái</label>
              <select
                name="status"
                defaultValue={invitation.status}
                className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="draft">draft</option>
                <option value="published">published</option>
              </select>
            </div>

            <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
              Public URL: {publicHref}
            </div>

            <Button
              variant="outline"
              className="w-full"
              render={
                <Link href={`${publicHref}?preview=1`} target="_blank" rel="noreferrer">
                  Xem trước
                </Link>
              }
            />
            <Button type="submit" className="w-full">Lưu thay đổi</Button>
          </>
        }
      />
    </NativeForm>
  );
}
