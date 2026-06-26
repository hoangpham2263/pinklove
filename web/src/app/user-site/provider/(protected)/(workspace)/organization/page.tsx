import { NativeForm } from "@/components/common/native-form";
import { ProviderSubmitButton } from "@/features/provider-orders/components/provider-buttons";
import { ProviderDataSection } from "@/features/provider-orders/components/provider-data-section";
import { ProviderField, ProviderInput, ProviderSelect } from "@/features/provider-orders/components/provider-form";
import { ProviderPage, ProviderPageHeader, ProviderSectionCard } from "@/features/provider-orders/components/provider-page";
import { listProviderOrganizations } from "@/features/providers/server/workspace";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function ProviderOrganizationPage() {
  const user = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const rows = await listProviderOrganizations(user.id);

  return (
    <ProviderPage>
      <ProviderPageHeader
        title="Organization"
        description="Quản lý tổ chức, nhóm provider, role và lời mời thành viên."
      />

      <ProviderSectionCard title="Tạo organization">
        <NativeForm action={ROUTES.API.PROVIDER.ORGANIZATION} method="POST" className="grid gap-3 md:grid-cols-4">
          <ProviderField label="Tên tổ chức">
            <ProviderInput name="name" placeholder="Tên tổ chức" required />
          </ProviderField>
          <ProviderField label="Slug">
            <ProviderInput name="slug" placeholder="Optional" />
          </ProviderField>
          <ProviderField label="Loại tổ chức">
            <ProviderSelect name="organizationType">
              {["studio", "agency", "provider_group", "creator_group", "wedding_team"].map((item) => <option key={item}>{item}</option>)}
            </ProviderSelect>
          </ProviderField>
          <ProviderSubmitButton type="submit" className="self-end">Tạo organization</ProviderSubmitButton>
        </NativeForm>
      </ProviderSectionCard>

      <ProviderDataSection
        title="Organizations"
        description="Tổ chức, nhóm provider và số lượng thành viên hiện có."
        rows={rows}
        columns={[
          { key: "name", label: "Organization" },
          { key: "slug", label: "Slug" },
          { key: "organization_type", label: "Type" },
          { key: "status", label: "Status" },
          { key: "members", label: "Members" },
          { key: "updated_at", label: "Updated" },
        ]}
        emptyMessage="Chưa có organization."
      />

      {rows.length > 0 ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <ProviderSectionCard title="Tạo role">
            <NativeForm action={ROUTES.API.PROVIDER.ORGANIZATION} method="POST" className="grid gap-3">
              <input type="hidden" name="intent" value="role" />
              <ProviderField label="Organization">
                <ProviderSelect name="organizationId">
                  {rows.map((row) => <option key={String(row.id)} value={String(row.id)}>{String(row.name)}</option>)}
                </ProviderSelect>
              </ProviderField>
              <ProviderField label="Role key">
                <ProviderInput name="roleKey" placeholder="manager" required />
              </ProviderField>
              <ProviderField label="Role label">
                <ProviderInput name="roleLabel" placeholder="Role label" />
              </ProviderField>
              <ProviderField label="Permissions">
                <ProviderInput name="permissions" placeholder="permissions, comma-separated" />
              </ProviderField>
              <ProviderSubmitButton type="submit">Lưu role</ProviderSubmitButton>
            </NativeForm>
          </ProviderSectionCard>

          <ProviderSectionCard title="Mời thành viên">
            <NativeForm action={ROUTES.API.PROVIDER.ORGANIZATION} method="POST" className="grid gap-3">
              <input type="hidden" name="intent" value="invite" />
              <ProviderField label="Organization">
                <ProviderSelect name="organizationId">
                  {rows.map((row) => <option key={String(row.id)} value={String(row.id)}>{String(row.name)}</option>)}
                </ProviderSelect>
              </ProviderField>
              <ProviderField label="User ID">
                <ProviderInput name="userId" placeholder="User ID cần mời" required />
              </ProviderField>
              <ProviderField label="Role key">
                <ProviderInput name="roleKey" placeholder="role key" defaultValue="member" />
              </ProviderField>
              <ProviderField label="Role label">
                <ProviderInput name="roleLabel" placeholder="Role label" defaultValue="Member" />
              </ProviderField>
              <ProviderSubmitButton type="submit">Gửi lời mời</ProviderSubmitButton>
            </NativeForm>
          </ProviderSectionCard>
        </div>
      ) : null}
    </ProviderPage>
  );
}
