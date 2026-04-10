"use client";

import { type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NativeForm } from "@/components/common/native-form";
import { FieldsEditor } from "@/components/common/fields-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { finishMutation, postForm } from "@/lib/client-mutation";
import { ROUTES } from "@/lib/routes";
import { getInvitationTemplateFields } from "@/features/invitations/templates/registry";
import type { InvitationSite } from "@/features/invitations/types";

type InvitationEditorFormProps = {
  site: InvitationSite;
  publicHref: string;
};

export function InvitationEditorForm({ site, publicHref }: InvitationEditorFormProps) {
  const router = useRouter();
  const data = site.customData;
  const fieldValues: Record<string, unknown> = {
    ...data,
    gallery: Array.isArray(data.gallery) ? (data.gallery as string[]).join("\n") : (data.gallery ?? ""),
  };
  const templateFields = getInvitationTemplateFields(site.templateKey);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const result = await postForm(ROUTES.API.CUSTOMER.INVITATIONS.UPDATE, new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã lưu thiệp cưới.");
      finishMutation(router, result, { redirect: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu thiệp cưới lúc này.");
    }
  }

  return (
    <NativeForm action={ROUTES.API.CUSTOMER.INVITATIONS.UPDATE} method="POST" className="grid gap-6 lg:grid-cols-12" onSubmit={handleSubmit}>
      <input type="hidden" name="siteId" value={String(site.id)} />
      <input type="hidden" name="templateKey" value={site.templateKey} />

      <Card className="min-w-0 lg:col-span-10">
        <CardHeader>
          <CardTitle>Nội dung thiệp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="font-medium">Tiêu đề hiển thị</label>
              <Input name="title" defaultValue={site.title} />
            </div>

            <div className="space-y-2">
              <label className="font-medium">Slug public</label>
              <Input name="slug" defaultValue={site.slug} />
            </div>
          </div>

          <FieldsEditor fields={templateFields} values={fieldValues} />
        </CardContent>
      </Card>

      <Card className="min-w-0 lg:col-span-2 lg:self-start">
        <CardHeader>
          <CardTitle>Xuất bản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="font-medium">Trạng thái</label>
            <select
              name="status"
              defaultValue={site.status}
              className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
          </div>

          <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
            Public URL: {publicHref}
          </div>

          <Button type="submit" className="w-full">
            Lưu thiệp cưới
          </Button>
          <Button variant="outline" className="w-full" render={<Link href={`${publicHref}?preview=1`}>Preview</Link>} />
        </CardContent>
      </Card>
    </NativeForm>
  );
}
