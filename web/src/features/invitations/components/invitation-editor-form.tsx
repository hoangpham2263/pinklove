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
import type { FieldSchema } from "@/features/pages/schema";

type InvitationEditorFormProps = {
  site: InvitationSite;
  publicHref: string;
  canPublish: boolean;
};

function getTemplateFieldTabKey(field: FieldSchema, index: number) {
  return "name" in field ? `${field.type}-${field.name}` : `${field.type}-${field.label}-${index}`;
}

function getTemplateFieldTabLabel(field: FieldSchema) {
  return "label" in field ? field.label : "Field";
}

export function InvitationEditorForm({ site, publicHref, canPublish }: InvitationEditorFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(site.title);
  const [slug, setSlug] = useState(site.slug);
  const [customData, setCustomData] = useState<Record<string, unknown>>(site.customData);
  const templateFields = getInvitationTemplateFields(site.templateKey);
  const [activeTemplateFieldTab, setActiveTemplateFieldTab] = useState("");
  const firstTemplateField = templateFields[0];
  const activeTemplateFieldKey = templateFields.some((field, index) => getTemplateFieldTabKey(field, index) === activeTemplateFieldTab)
    ? activeTemplateFieldTab
    : firstTemplateField
      ? getTemplateFieldTabKey(firstTemplateField, 0)
      : "";

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
      <input type="hidden" name="customData" value={JSON.stringify(customData)} />

      <div className="min-w-0 space-y-6 lg:col-span-9">
        <Card className="min-w-0 overflow-visible rounded-lg gap-0">
          <CardHeader className="border-b gap-0 pb-0">
            <CardTitle>Thông tin thiệp</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <div className="grid gap-5 md:grid-cols-2">
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
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden rounded-lg gap-0">
          <CardHeader className="border-b gap-0 pb-0">
            <CardTitle>Nội dung thiệp</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid min-h-[30rem] lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className="border-b bg-white p-3 lg:border-r lg:border-b-0">
                <div className="grid gap-1">
                  {templateFields.map((field, index) => {
                    const tabKey = getTemplateFieldTabKey(field, index);
                    const active = activeTemplateFieldKey === tabKey;
                    return (
                      <button
                        key={tabKey}
                        type="button"
                        className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                          active
                            ? "border-primary/30 bg-primary/5"
                            : "border-border/50 bg-white hover:border-primary/30 hover:bg-primary/5"
                        }`}
                        onClick={() => setActiveTemplateFieldTab(tabKey)}
                      >
                        <span className="block truncate font-medium">{getTemplateFieldTabLabel(field)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="min-w-0 p-5 md:p-6">
                {templateFields.map((field, index) => {
                  const tabKey = getTemplateFieldTabKey(field, index);
                  if (tabKey !== activeTemplateFieldKey) {
                    return null;
                  }

                  return (
                    <FieldsEditor
                      key={tabKey}
                      fields={[field]}
                      values={customData}
                      showTabs={false}
                      forceSingleColumn
                      className="grid grid-cols-12 gap-4"
                      onChange={(name, value) => {
                        setCustomData((current) => ({ ...current, [name]: value }));
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="min-w-0 space-y-6 lg:col-span-3">
        <Card className="min-w-0 rounded-lg lg:self-start">
          <CardHeader>
            <CardTitle>Xuất bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="font-medium">Trạng thái</label>
              <select
                name="status"
                defaultValue={site.status}
                className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
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

            <Button type="submit" className="w-full">
              Lưu thiệp cưới
            </Button>
            <Button variant="outline" className="w-full" render={<Link href={`${publicHref}?preview=1`}>Preview</Link>} />
          </CardContent>
        </Card>

        <Card className="min-w-0 rounded-lg">
          <CardHeader>
            <CardTitle>Public URL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="break-all rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
              {publicHref}
            </div>
          </CardContent>
        </Card>
      </div>
    </NativeForm>
  );
}
