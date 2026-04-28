"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NativeForm } from "@/components/common/native-form";
import { FieldsEditor } from "@/components/common/fields-editor";
import { Button } from "@/components/ui/button";
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
  const [isSaving, setIsSaving] = useState(false);

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
      className="space-y-6"
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="values" value={JSON.stringify(values)} />

      <FieldsEditor
        fields={fields}
        values={values}
        onChange={(name, value) => {
          setValues((prev) => ({ ...prev, [name]: value }));
        }}
      />

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Đang lưu..." : "Lưu Global Fields"}
        </Button>
      </div>
    </NativeForm>
  );
}
