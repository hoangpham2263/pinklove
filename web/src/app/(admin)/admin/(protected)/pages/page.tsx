import { QuickCreatePageForm } from "@/features/admin/components/quick-create-page-form";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeletePageButton } from "@/features/admin/components/delete-page-button";
import { requireAdmin } from "@/lib/auth";
import { listCmsPages, CmsPage } from "@/lib/cms";
import { CMS_TEMPLATES, SYSTEM_PAGES } from "@/features/client/templates";

type AdminPagesIndexProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function PageTable({ pages, isSystem }: { pages: (CmsPage & { isStub?: boolean })[], isSystem?: boolean }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Title</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Template</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pages.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                {isSystem ? "No system pages defined." : "No pages found. Create your first page."}
              </TableCell>
            </TableRow>
          ) : (
            pages.map((page) => {
              const isProtectedSlug = !!SYSTEM_PAGES[page.slug];
              const targetUrl = page.slug === "home" ? "/" : (page.slug === "login" || page.slug === "register" ? `/user/${page.slug}` : `/${page.slug}`);
              
              return (
                <TableRow key={page.id}>
                  <TableCell className="font-medium">
                    <div>
                      <p className="font-semibold">{page.name}</p>
                      {page.title && <p className="text-muted-foreground text-xs">{page.title}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                      /{page.slug}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant={page.status === "published" ? "default" : "secondary"}>
                      {page.isStub ? "Not Initialized" : (page.status || "draft")}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize text-muted-foreground text-sm">
                    {CMS_TEMPLATES[page.template as keyof typeof CMS_TEMPLATES]?.label || page.template}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!page.isStub && (
                        <Link
                          href={targetUrl}
                          target="_blank"
                          className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-sm font-medium hover:bg-accent"
                        >
                          View
                        </Link>
                      )}
                      <Link
                        href={`/admin/pages/${page.slug}`}
                        className={`inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium text-primary-foreground ${page.isStub ? "bg-amber-600 hover:bg-amber-600/90" : "bg-primary hover:bg-primary/90"}`}
                      >
                        {page.isStub ? "Initialize" : "Edit"}
                      </Link>
                      {!isProtectedSlug && (
                        <DeletePageButton slug={page.slug} name={page.name} />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default async function AdminPagesIndex({ searchParams }: AdminPagesIndexProps) {
  await requireAdmin();
  const allPages = await listCmsPages();
  const query = (await searchParams) ?? {};

  const createdPages = allPages.filter((page) => !SYSTEM_PAGES[page.slug]);
  
  const systemPagesList = Object.entries(SYSTEM_PAGES).map(([slug, config]) => {
    const existing = allPages.find((p) => p.slug === slug);
    if (existing) return existing;
    return {
      id: `stub-${slug}`,
      slug,
      name: config.name,
      status: "draft",
      template: config.template,
      isStub: true,
    } as CmsPage & { isStub: boolean };
  });

  return (
    <section className="flex w-full flex-1 flex-col gap-8 p-4 md:p-8">
      {query.error && (
        <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm border border-destructive/20">
          An error occurred: {query.error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-9 space-y-10">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Created Pages</h2>
            </div>
            <PageTable pages={createdPages} />
          </div>

          {/* System Pages Section */}
          <div className="space-y-4 pt-10 border-t">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-muted-foreground">System Pages</h2>
            </div>
            <PageTable pages={systemPagesList} isSystem />
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-3">
          <div className="sticky top-20 space-y-6">
            <Card className="border">
              <CardHeader className="pb-3 bg-muted/30">
                <CardTitle className="font-bold">Quick Create</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <QuickCreatePageForm />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}