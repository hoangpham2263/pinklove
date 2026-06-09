import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminCancelButton, AdminCreateButton } from "@/features/admin/components/admin-buttons";
import { LANDING_PAGE_TEMPLATES } from "@/features/landing-pages/templates";
import type { Offering } from "@/features/offerings/types";
import { ROUTES } from "@/lib/routes";

type LandingPageCreateFormProps = {
  offerings: Array<Pick<Offering, "id" | "name" | "status">>;
  selectedSourceOfferingId?: string;
};

function getOfferingLabel(offering: Pick<Offering, "name" | "status">) {
  return `${offering.name} · ${offering.status}`;
}

export function LandingPageCreateForm({ offerings, selectedSourceOfferingId }: LandingPageCreateFormProps) {
  return (
    <form action={ROUTES.API.ADMIN.LANDING_PAGES.CREATE} method="POST" className="grid gap-5 lg:grid-cols-12">
      <Card className="lg:col-span-9">
        <CardHeader className="border-b gap-0 pb-0">
          <CardTitle>Mẫu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {LANDING_PAGE_TEMPLATES.map((template) => (
              <label key={template.id} className="cursor-pointer rounded-md border p-4 transition hover:border-primary/30 hover:bg-primary/5">
                <input type="radio" name="templateId" value={template.id} defaultChecked={template.id === "fashion"} className="sr-only peer" />
                <div className="space-y-3 peer-checked:[&_.template-title]:text-primary">
                  <div className="flex items-center justify-between gap-2">
                    <p className="template-title font-semibold">{template.name}</p>
                    <span className="rounded border px-2 py-0.5 text-xs">{template.pageType}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {template.sections.slice(0, 3).map((section, index) => (
                      <span key={`${template.id}-${section.sectionType}-${index}`} className="rounded bg-muted px-2 py-0.5 text-xs">
                        {section.sectionType}
                      </span>
                    ))}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-5 lg:col-span-3">
        <Card>
          <CardHeader className="border-b gap-0 pb-0">
            <CardTitle>Thông tin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Sản phẩm</label>
              <select
                name="sourceOfferingId"
                defaultValue={selectedSourceOfferingId}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none"
                required
              >
                <option value="">Chọn sản phẩm</option>
                {offerings.map((offering) => (
                  <option key={offering.id} value={offering.id}>
                    {getOfferingLabel(offering)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Tên</label>
              <input
                name="name"
                placeholder="Dùng tên mẫu nếu trống"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Slug</label>
              <input
                name="slug"
                placeholder="fashion"
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Trạng thái</label>
              <select name="status" defaultValue="draft" className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <AdminCancelButton render={<Link href={ROUTES.ADMIN.LANDING_PAGES}>Hủy</Link>} />
          <AdminCreateButton type="submit">Tạo landing page</AdminCreateButton>
        </div>
      </div>
    </form>
  );
}
