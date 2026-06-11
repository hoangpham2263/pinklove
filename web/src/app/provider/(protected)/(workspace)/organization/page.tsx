import { User } from "lucide-react";

import { NativeForm } from "@/components/common/native-form";
import { DatabasePage } from "@/components/common/database-table";
import { Button } from "@/components/ui/button";
import { listProviderOrganizations } from "@/features/providers/server/workspace";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function ProviderOrganizationPage() {
  const user = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const rows = await listProviderOrganizations(user.id);

  return (
    <>
      <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
        <div className="rounded-md border bg-background p-5">
          <h1 className="text-2xl font-semibold">Organization</h1>
          <NativeForm action={ROUTES.API.PROVIDER.ORGANIZATION} method="POST" className="mt-4 grid gap-3 md:grid-cols-4">
            <input name="name" placeholder="Tên tổ chức" className="h-9 rounded-md border bg-background px-3 text-sm" required />
            <input name="slug" placeholder="Slug (optional)" className="h-9 rounded-md border bg-background px-3 text-sm" />
            <select name="organizationType" className="h-9 rounded-md border bg-background px-3 text-sm">
              {["studio", "agency", "provider_group", "creator_group", "wedding_team"].map((item) => <option key={item}>{item}</option>)}
            </select>
            <Button type="submit" size="lg">Tạo organization</Button>
          </NativeForm>
        </div>
      </section>
      <DatabasePage
        title="Organizations"
        description="Quản lý tổ chức, nhóm provider và số lượng thành viên hiện có."
        rows={rows}
        icon={User}
        metricLabel="Organizations"
        columns={[
          { key: "name", label: "Organization" },
          { key: "slug", label: "Slug" },
          { key: "organization_type", label: "Type" },
          { key: "status", label: "Status" },
          { key: "members", label: "Members" },
          { key: "updated_at", label: "Updated" },
        ]}
      />
      {rows.length > 0 ? (
        <section className="mx-5 mb-7.5 grid gap-5 md:mx-7.5 lg:grid-cols-2">
          <div className="rounded-md border bg-background p-5">
            <h2 className="text-base font-semibold">Tạo role</h2>
            <NativeForm action={ROUTES.API.PROVIDER.ORGANIZATION} method="POST" className="mt-4 grid gap-3">
              <input type="hidden" name="intent" value="role" />
              <select name="organizationId" className="h-9 rounded-md border bg-background px-3 text-sm">
                {rows.map((row) => <option key={String(row.id)} value={String(row.id)}>{String(row.name)}</option>)}
              </select>
              <input name="roleKey" placeholder="role key: manager" className="h-9 rounded-md border bg-background px-3 text-sm" required />
              <input name="roleLabel" placeholder="Role label" className="h-9 rounded-md border bg-background px-3 text-sm" />
              <input name="permissions" placeholder="permissions, comma-separated" className="h-9 rounded-md border bg-background px-3 text-sm" />
              <Button type="submit" size="lg">Lưu role</Button>
            </NativeForm>
          </div>
          <div className="rounded-md border bg-background p-5">
            <h2 className="text-base font-semibold">Mời thành viên</h2>
            <NativeForm action={ROUTES.API.PROVIDER.ORGANIZATION} method="POST" className="mt-4 grid gap-3">
              <input type="hidden" name="intent" value="invite" />
              <select name="organizationId" className="h-9 rounded-md border bg-background px-3 text-sm">
                {rows.map((row) => <option key={String(row.id)} value={String(row.id)}>{String(row.name)}</option>)}
              </select>
              <input name="userId" placeholder="User ID cần mời" className="h-9 rounded-md border bg-background px-3 text-sm" required />
              <input name="roleKey" placeholder="role key" defaultValue="member" className="h-9 rounded-md border bg-background px-3 text-sm" />
              <input name="roleLabel" placeholder="Role label" defaultValue="Member" className="h-9 rounded-md border bg-background px-3 text-sm" />
              <Button type="submit" size="lg">Gửi lời mời</Button>
            </NativeForm>
          </div>
        </section>
      ) : null}
    </>
  );
}
