"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { NativeForm } from "@/components/common/native-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminCancelButton, AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { getRegisteredOfferingType } from "@/features/offerings/type-registry";
import type { OfferingTypeDefinition } from "@/features/offerings/types";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import { ROUTES } from "@/lib/routes";
import { OfferingTypeFieldsBuilder } from "./offering-type-fields-builder";

type OfferingTypeFormProps = {
  offeringType: OfferingTypeDefinition;
  returnTo?: string;
};

export function OfferingTypeForm({
  offeringType,
  returnTo = ROUTES.ADMIN.OFFERING_TYPES,
}: OfferingTypeFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const registeredType = getRegisteredOfferingType(offeringType.key);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const result = await adminApi.saveOfferingType(new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã lưu thay đổi.");
      finishMutation(router, result, { redirect: "push", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu thay đổi.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!registeredType) {
    return null;
  }

  return (
    <NativeForm
      action={adminApiActions.saveOfferingType}
      method="POST"
      className="grid gap-6 lg:grid-cols-12"
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="key" value={registeredType.key} />
      <input type="hidden" name="returnTo" value={returnTo} />

      <div className="min-w-0 space-y-6 lg:col-span-9">
        <Card className="min-w-0 rounded-lg">
          <CardHeader className="border-b">
            <CardTitle>Thông tin type</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 pt-5 md:grid-cols-2">
            <ContractField label="Tên" value={registeredType.label} />
            <ContractField label="Key" value={registeredType.key} mono />
            <ContractField label="Renderer" value={registeredType.rendererKey} mono />
            <ContractField label="Fulfillment" value={registeredType.fulfillmentType} />
            <ContractField label="Template key" value={registeredType.templateKey} mono />
            <ContractField
              label="Capabilities"
              value={[
                registeredType.supportsInventory ? "inventory" : null,
                registeredType.supportsProviderSupply ? "provider supply" : null,
              ].filter(Boolean).join(", ") || "none"}
            />
            <p className="text-sm text-muted-foreground md:col-span-2">{registeredType.description}</p>
            <p className="text-xs text-muted-foreground md:col-span-2">
              Type này được đăng ký trong code. Muốn đổi renderer hoặc hành vi type phải sửa registry và migration.
            </p>
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-visible rounded-lg gap-0">
          <CardHeader className="border-b gap-0 pb-0">
            <CardTitle>Trường dữ liệu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <OfferingTypeFieldsBuilder initialFields={offeringType.fieldSchema} />
          </CardContent>
        </Card>
      </div>

      <div className="min-w-0 lg:col-span-3">
        <div className="space-y-6 lg:sticky lg:top-6">
          <Card className="min-w-0 rounded-lg">
            <CardHeader>
              <CardTitle>Lưu thay đổi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <AdminSubmitButton className="w-full rounded-md" disabled={isSaving}>
                {isSaving ? "Đang lưu..." : "Lưu"}
              </AdminSubmitButton>
              <AdminCancelButton
                type="button"
                className="w-full rounded-md"
                render={<Link href={returnTo}>Hủy</Link>}
                nativeButton={false}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </NativeForm>
  );
}

function ContractField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-1 rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={mono ? "font-mono text-sm" : "text-sm font-medium"}>{value}</p>
    </div>
  );
}
