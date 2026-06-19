import { requireAdmin } from "@/lib/auth";
import { listSeoRedirectRules } from "@/lib/seo-redirects";
import { ROUTES } from "@/lib/routes";

export const dynamic = "force-dynamic";

export default async function AdminSeoRedirectsPage() {
  await requireAdmin();
  const rules = await listSeoRedirectRules();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">SEO Redirects</h1>
        <p className="text-sm text-muted-foreground">
          Redirect là dữ liệu SEO có chủ đích, không phải route alias trong source code.
        </p>
      </div>

      <form action={ROUTES.API.ADMIN.CONFIG.REDIRECTS_SAVE} method="POST" className="grid gap-3 rounded-md border bg-background p-4 md:grid-cols-6">
        <input name="label" placeholder="Ghi chú" className="h-9 rounded-md border bg-background px-3 md:col-span-1" />
        <input name="sourcePath" placeholder="/duong-dan-cu" required className="h-9 rounded-md border bg-background px-3 md:col-span-2" />
        <input name="targetPath" placeholder="/duong-dan-moi" required className="h-9 rounded-md border bg-background px-3 md:col-span-2" />
        <div className="flex gap-2">
          <select name="statusCode" defaultValue="301" className="h-9 rounded-md border bg-background px-2">
            <option value="301">301</option>
            <option value="302">302</option>
          </select>
          <input type="hidden" name="enabled" value="on" />
          <button type="submit" className="h-9 rounded-md bg-primary px-4 text-primary-foreground">Thêm</button>
        </div>
      </form>

      <div className="space-y-3">
        {rules.map((rule) => (
          <form key={rule.id} action={ROUTES.API.ADMIN.CONFIG.REDIRECTS_SAVE} method="POST" className="grid gap-3 rounded-md border bg-background p-4 md:grid-cols-6">
            <input type="hidden" name="id" value={rule.id} />
            <input name="label" defaultValue={rule.label} className="h-9 rounded-md border bg-background px-3" />
            <input name="sourcePath" defaultValue={rule.sourcePath} required className="h-9 rounded-md border bg-background px-3 md:col-span-2" />
            <input name="targetPath" defaultValue={rule.targetPath} required className="h-9 rounded-md border bg-background px-3 md:col-span-2" />
            <div className="flex flex-wrap gap-2">
              <select name="statusCode" defaultValue={String(rule.statusCode)} className="h-9 rounded-md border bg-background px-2">
                <option value="301">301</option>
                <option value="302">302</option>
              </select>
              <label className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
                <input type="checkbox" name="enabled" defaultChecked={rule.enabled} />
                Active
              </label>
              <button type="submit" className="h-9 rounded-md border px-3">Lưu</button>
              <button
                type="submit"
                formAction={ROUTES.API.ADMIN.CONFIG.REDIRECTS_DELETE}
                className="h-9 rounded-md border border-destructive/40 px-3 text-destructive"
              >
                Xóa
              </button>
            </div>
          </form>
        ))}
        {!rules.length ? <p className="rounded-md border p-6 text-center text-sm text-muted-foreground">Chưa có redirect.</p> : null}
      </div>
    </section>
  );
}
