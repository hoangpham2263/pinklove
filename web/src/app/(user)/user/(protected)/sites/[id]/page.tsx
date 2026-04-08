import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { NativeForm } from "@/components/common/native-form";
import { FieldsEditor } from "@/components/common/fields-editor";
import { PageToast } from "@/components/common/page-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireAppUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getWeddingSiteByIdForUser } from "@/features/sites/server/service";
import { getWeddingTemplateFields } from "@/features/sites/templates/registry";

type WeddingSiteEditorPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WeddingSiteEditorPage({ params, searchParams }: WeddingSiteEditorPageProps) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const site = await getWeddingSiteByIdForUser(user.id, id);
  if (!site) {
    notFound();
  }

  if (site.siteType === "builder_template") {
    redirect(ROUTES.USER.DESIGN(site.id));
  }

  const data = site.customData;
  const fieldValues: Record<string, unknown> = {
    ...data,
    gallery: Array.isArray(data.gallery) ? (data.gallery as string[]).join("\n") : (data.gallery ?? ""),
  };
  const templateFields = getWeddingTemplateFields(site.templateKey);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      {query.saved ? <PageToast message="Đã lưu thiệp cưới." variant="success" /> : null}
      {query.error ? <PageToast message="Không thể lưu thiệp cưới lúc này." variant="error" /> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{site.title}</h1>
          <p className="text-sm text-muted-foreground">
            {site.siteType === "coded_template"
              ? "Chỉnh nội dung theo schema của template code sẵn."
              : "Builder đang dùng Konva để chỉnh các block text, shape, image trực tiếp trên thiệp."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" render={<Link href={ROUTES.USER.SITES}>Quay lại danh sách</Link>} />
          <Button render={<Link href={`${ROUTES.WEDDING.SITE(site.slug)}?preview=1`}>Preview</Link>} />
        </div>
      </div>

      <NativeForm action={ROUTES.API.USER.SITES.UPDATE} method="POST" className="grid gap-6 lg:grid-cols-12">
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

            <FieldsEditor
              fields={templateFields}
              values={fieldValues}
            />
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
              Public URL: {ROUTES.WEDDING.SITE(site.slug)}
            </div>

            <Button type="submit" className="w-full">
              Lưu thiệp cưới
            </Button>
          </CardContent>
        </Card>
      </NativeForm>
    </section>
  );
}
