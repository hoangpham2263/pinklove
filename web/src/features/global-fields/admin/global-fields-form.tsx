"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NativeForm } from "@/components/common/native-form";
import { FieldsEditor } from "@/components/common/fields-editor";
import { AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { AdminTableClearButton, AdminTableSearch, AdminTableToolbar } from "@/features/admin/components/admin-table-controls";
import type { FieldSchema } from "@/features/pages/schema";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";

type GlobalFieldsFormProps = {
  fields: FieldSchema[];
  initialValues: Record<string, unknown>;
};

export function GlobalFieldsForm({ fields, initialValues }: GlobalFieldsFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const filteredFields = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return fields;
    }

    return fields.filter((field) => fieldMatchesKeyword(field, keyword));
  }, [fields, search]);
  const hasFilters = search.trim().length > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const formData = new FormData(event.currentTarget);
      const result = await adminApi.updateGlobalFields(formData);
      toast.success(result.message ?? "Đã lưu Global Fields.");
      finishMutation(router, result, { redirect: false, refresh: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu Global Fields.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <NativeForm
      action={adminApiActions.updateGlobalFields}
      method="POST"
      className="space-y-4"
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="values" value={JSON.stringify(values)} />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <AdminTableToolbar>
          <AdminTableSearch value={search} onChange={setSearch} placeholder="Tìm trong global fields..." />
          <AdminTableClearButton visible={hasFilters} onClick={() => setSearch("")} />
        </AdminTableToolbar>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <AdminSubmitButton disabled={isSaving}>
            {isSaving ? "Đang lưu..." : "Lưu cài đặt"}
          </AdminSubmitButton>
        </div>
      </div>

      {filteredFields.length ? (
        <FieldsEditor
          fields={filteredFields}
          values={values}
          className=""
          onChange={(name, value) => {
            setValues((prev) => ({ ...prev, [name]: value }));
          }}
        />
      ) : (
        <div className="rounded-md border p-6 text-center text-muted-foreground">
          Không có cấu hình nào phù hợp.
        </div>
      )}
    </NativeForm>
  );
}

function fieldMatchesKeyword(field: FieldSchema, keyword: string): boolean {
  const ownText = [
    field.label,
    "description" in field ? field.description : "",
    "name" in field ? field.name : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (ownText.includes(keyword)) {
    return true;
  }

  if ("fields" in field) {
    return field.fields.some((child) => fieldMatchesKeyword(child, keyword));
  }

  return false;
}
