import Link from "next/link";
import { notFound } from "next/navigation";
import { NativeForm } from "@/components/common/native-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireAppUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getWeddingSiteByIdForUser } from "@/features/sites/server/service";
import { BuilderEditorClient } from "@/features/sites/builder/editor-client";

type BuilderDesignPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BuilderDesignPage({ params, searchParams }: BuilderDesignPageProps) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const site = await getWeddingSiteByIdForUser(user.id, id);

  if (!site || site.siteType !== "builder_template") {
    notFound();
  }

  const data = site.customData;

  return (
    <section className="flex min-h-screen flex-col bg-[#f5f5f5]">
      <NativeForm action={ROUTES.API.USER.SITES.UPDATE} method="POST" className="flex min-h-screen flex-col">
        <input type="hidden" name="siteId" value={String(site.id)} />
        <input type="hidden" name="templateKey" value={site.templateKey} />

        <div className="flex-1 px-5 py-5">
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-10">
              <BuilderEditorClient initialValue={data.builderDocument ?? data.builderCanvas} />
            </div>

            <div className="lg:col-span-2">
              <div className="sticky top-22 space-y-4 rounded-2xl border bg-card p-4">
                <div className="space-y-3 border-b pb-4">
                  <Button className="w-full" variant="outline" render={<Link href={ROUTES.USER.SITES}>Quay lại</Link>} />
                  <div className="space-y-1">
                    <h1 className="truncate text-base font-semibold">{site.title}</h1>
                    {query.saved ? <p className="text-sm text-primary">Đã lưu</p> : null}
                    {query.error ? <p className="text-sm text-destructive">Lưu thất bại</p> : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-medium">Tên thiệp</label>
                  <Input name="title" defaultValue={site.title} placeholder="Tên thiệp" />
                </div>

                <div className="space-y-2">
                  <label className="font-medium">Slug public</label>
                  <Input name="slug" defaultValue={site.slug} placeholder="Slug public" />
                </div>

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

                <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                  Public URL: {ROUTES.WEDDING.SITE(site.slug)}
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  render={
                    <Link
                      href={`${ROUTES.WEDDING.SITE(site.slug)}?preview=1`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Xem trước
                    </Link>
                  }
                />
                <Button type="submit" className="w-full">Lưu thay đổi</Button>
              </div>
            </div>
          </div>
        </div>
      </NativeForm>
    </section>
  );
}
