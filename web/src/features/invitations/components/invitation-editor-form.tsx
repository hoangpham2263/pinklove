"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NativeForm } from "@/components/common/native-form";
import { FieldsEditor } from "@/components/common/fields-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { customerApi, customerApiActions } from "@/lib/api-client.customer";
import { finishMutation } from "@/lib/client-mutation";
import { slugify } from "@/lib/utils";
import { getInvitationTemplateFields } from "@/features/invitations/templates/registry";
import type { InvitationSite } from "@/features/invitations/types";

type InvitationEditorFormProps = {
  site: InvitationSite;
  publicHref: string;
  canPublish: boolean;
};

export function InvitationEditorForm({ site, publicHref, canPublish }: InvitationEditorFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(site.title);
  const [slug, setSlug] = useState(site.slug);
  const data = site.customData;
  const templateFields = getInvitationTemplateFields(site.templateKey);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const result = await customerApi.updateInvitation(new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã lưu thiệp cưới.");
      finishMutation(router, result, { redirect: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu thiệp cưới lúc này.");
    }
  }

  return (
    <NativeForm action={customerApiActions.updateInvitation} method="POST" className="grid gap-6 lg:grid-cols-12" onSubmit={handleSubmit}>
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
              <Input
                name="title"
                value={title}
                onChange={(event) => {
                  const next = event.target.value;
                  setTitle(next);
                  setSlug(slugify(next));
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="font-medium">Slug public</label>
              <Input name="slug" value={slug} onChange={(event) => setSlug(event.target.value)} />
            </div>
          </div>

          <FieldsEditor fields={templateFields} values={data} />
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
              <option value="published" disabled={!canPublish}>published</option>
            </select>
          </div>

          {!canPublish ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              Bản này đang là demo. Hãy mua mẫu trong danh sách yêu thích trước khi xuất bản public.
            </div>
          ) : null}

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
