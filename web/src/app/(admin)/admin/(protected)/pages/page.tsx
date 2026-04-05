import { QuickCreatePageForm } from"@/features/admin/components/quick-create-page-form";
import Link from"next/link";

import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Badge } from"@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from"@/components/ui/table";
import { requireAdmin } from"@/lib/auth";
import { listCmsPages } from"@/lib/cms";
import { CMS_TEMPLATES } from"@/features/client/templates";

type AdminPagesIndexProps = { searchParams ?: Promise<Record<string, string | string[] | undefined>>; };

export default async function AdminPagesIndex({ searchParams }: AdminPagesIndexProps) {

 await requireAdmin();
 const pages = await listCmsPages();
 const query = (await searchParams) ?? { };
 const saved = typeof query.saved ==="string" ? query.saved:"";
 const error = typeof query.error ==="string" ? query.error:"";

 return (
 <section className="flex w-full flex-1 flex-col gap-8 p-5 md:p-7.5">
 <div className="flex items-center justify-between">
 <h1 className="text-3xl font-bold tracking-tight">Pages</h1>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
 {/* Left: Pages List (9/12) */}
 <div className="lg:col-span-9 space-y-6">
 <Card className="shadow-sm">
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
 <CardTitle className="text-xl font-bold">All Pages</CardTitle>
 </CardHeader>
 <CardContent>
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
 No pages found. Create your first page.
 </TableCell>
 </TableRow>
 ): (
 pages.map((page) => (
 <TableRow key={page.id}>
 <TableCell className="font-medium">
 <div>
 <p className="font-semibold">{page.name}</p>
 <p className="text-muted-foreground">{page.title}</p>
 </div>
 </TableCell>
 <TableCell>
 <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono">
 /{page.slug}
 </code>
 </TableCell>
 <TableCell>
 <Badge variant={page.status ==="published" ?"default":"secondary"}>
 {page.status}
 </Badge>
 </TableCell>
 <TableCell className="capitalize">
 {CMS_TEMPLATES[page.template as keyof typeof CMS_TEMPLATES]?.label || page.template}
 </TableCell>
 <TableCell className="text-right">
 <div className="flex justify-end gap-2">
 <Link
 href={page.slug ==="home" ?"/": `/${page.slug}`}
 target="_blank"
 className="inline-flex h-8 items-center justify-center rounded-md border px-3 font-medium hover:bg-accent"
 >
 View
 </Link>
 <Link
 href={`/admin/pages/${page.slug}`}
 className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 font-medium text-primary-foreground hover:bg-primary/90"
 >
 Edit
 </Link>
 </div>
 </TableCell>
 </TableRow>
 ))
 )}
 </TableBody>
 </Table>
 </div>
 </CardContent>
 </Card>
 </div>

 {/* Right: Quick Create (3/12) */}
 <div className="lg:col-span-3 space-y-6">
 <Card className="shadow-sm">
 <CardHeader>
 <CardTitle className="text-lg">Quick Create</CardTitle>
 </CardHeader>
 <CardContent>
 <QuickCreatePageForm />
 </CardContent>
 </Card>
 </div>
 </div>
 </section>
 ); }
